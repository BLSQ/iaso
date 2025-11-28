import typing

from django.contrib.auth.models import AnonymousUser, User
from django.db import models
from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _

from iaso.models.base import Account
from iaso.models.entity import UserNotAuthError
from iaso.utils.models.soft_deletable import (
    DefaultSoftDeletableManager,
    IncludeDeletedSoftDeletableManager,
    OnlyDeletedSoftDeletableManager,
    SoftDeletableModel,
)


class PerformanceThresholdQuerySet(QuerySet):
    def filter_for_user(self, user: typing.Optional[typing.Union[User, AnonymousUser]]):
        if not user or not user.is_authenticated:
            raise UserNotAuthError("User not Authenticated")
        profile = user.iaso_profile
        return self.filter(account=profile.account)


class PerformanceThresholds(SoftDeletableModel):
    class PerformanceIndicators(models.TextChoices):
        UNUSABLE_VIALS = "unusable_vials", _("Quantities of unusable vials waiting for disposal")
        WASTED_VIALS = "wasted_vials", _("Number of vials missing, broken, VVM passed, labels unreadable")
        DELAY_FORM_A = "delay_form_a", _("Average of number of days of delay for submission of Form A")
        PRE_CAMPAIGN_ACTIVITIES = "pre_campaign_activities", _("% of VM pre campaigns activities implemented")
        DAILY_REPORT_COMPLETENESS = (
            "daily_report_completeness",
            _("Completeness of daily report on vaccine consumption"),
        )
        STOCK_OUT = "stock_out", _("Stock out")
        FORM_A_DISTRICT_COMPLETENESS = "form_a_district_completeness", _("Completeness of Form A at district level")
        COLD_CHAIN_INVENTORY = "cc_inventory", _("% of health facilities with Cold Chain inventory")
        PASSIVE_CC_GAPS = "passive_cc_gaps", _("% of health facilities with gaps in passive cold chain")
        LOGISTICS_PLAN_UPDATE = "logistics_plan_update", _("Latest update of the National Logistics Plan")

    class PerformanceTimeline(models.TextChoices):
        LAST_YEAR_SAME_DATE = "last_year_same_date", _("Last year same date")
        TO_DATE = "to_date", _("To date")
        TWELVE_MONTHS_BEHIND = "12_months_behind", _("12 months behind")
        LAST_12_MONTHS = "last_12_months", _("Last 12 months")
        SIA_A_YEAR_BEFORE = "sia_a_year_before", _("SIA a year before")
        LATEST_SIA = "latest_sia", _("Latest SIA")

    BOUND_AVERAGE_KEY = "AVERAGE"
    BOUND_NO_LIMIT_KEY = "NO_LIMIT"

    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="performance_thresholds", null=False)

    # I have renamed this to singular 'indicator' as it holds one value per row
    indicator = models.CharField(
        max_length=200, choices=PerformanceIndicators.choices, default=PerformanceIndicators.STOCK_OUT
    )

    timeline = models.CharField(
        max_length=200, choices=PerformanceTimeline.choices, default=PerformanceTimeline.LAST_12_MONTHS
    )

    fail_threshold = models.CharField(
        max_length=50, help_text="Values worse than this are Red/Fail. Values better are Yellow/Warning."
    )

    success_threshold = models.CharField(
        max_length=50, help_text="Values better than this are Green/Success. Values worse are Yellow/Warning."
    )

    inclusive = models.BooleanField(
        default=True,
        help_text="If True, the bounds are inclusive (>=, <=).",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="performance_thresholds_created_set",
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="performance_thresholds_updated_set",
    )

    # Managers
    objects = DefaultSoftDeletableManager.from_queryset(PerformanceThresholdQuerySet)()
    objects_only_deleted = OnlyDeletedSoftDeletableManager.from_queryset(PerformanceThresholdQuerySet)()
    objects_include_deleted = IncludeDeletedSoftDeletableManager.from_queryset(PerformanceThresholdQuerySet)()

    class Meta:
        verbose_name = _("Performance Threshold")
        verbose_name_plural = _("Performance Thresholds")
        # FIXED: Removed 'level'
        ordering = ["indicator", "timeline"]

        unique_together = ["account", "indicator", "timeline"]

        indexes = [
            models.Index(fields=["account"]),
            models.Index(fields=["indicator"]),
            models.Index(fields=["timeline"]),
        ]

    def __str__(self):
        return f"{self.indicator} ({self.timeline}): Fail < {self.fail_threshold}, Success > {self.success_threshold}"
