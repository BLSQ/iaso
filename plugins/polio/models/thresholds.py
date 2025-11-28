import typing

from django.contrib.auth.models import AnonymousUser, User
from django.db import models
from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _

from iaso.models import OrgUnit
from iaso.models.base import Account
from iaso.models.entity import UserNotAuthError
from iaso.utils.models.soft_deletable import (
    DefaultSoftDeletableManager,
    IncludeDeletedSoftDeletableManager,
    OnlyDeletedSoftDeletableManager,
    SoftDeletableModel,
)

class ThresholdSettingsQuerySet(QuerySet):
    def filter_for_user(self, user: typing.Optional[typing.Union[User, AnonymousUser]]):
        if not user or not user.is_authenticated:
            raise UserNotAuthError("User not Authenticated")
        profile = user.iaso_profile
        return self.filter(account=profile.account)

class ThresholdSettings(SoftDeletableModel):
    class PerformanceIndicators(models.Choices):
        """
        Defines the 10 performance indicators for which thresholds can be set.

        """
        UNUSABLE_VIALS = "unusable_vials", _("Quantities of unusable vials waiting for disposal")

        WASTED_VIALS = "wasted_vials", _("Number of vials missing, broken, VVM passed, labels unreadable")

        DELAY_FORM_A = "delay_form_a", _("Average of number of days of delay for submission of Form A")

        PRE_CAMPAIGN_ACTIVITIES = "pre_campaign_activities", _("% of VM pre campaigns activities implemented")

        DAILY_REPORT_COMPLETENESS = "daily_report_completeness", _("Completeness of daily report on vaccine consumption")

        STOCK_OUT = "stock_out", _("Stock out")

        FORM_A_DISTRICT_COMPLETENESS = "form_a_district_completeness", _("Completeness of Form A at district level")

        COLD_CHAIN_INVENTORY = "cc_inventory", _("% of health facilities with Cold Chain inventory")

        PASSIVE_CC_GAPS = "passive_cc_gaps", _("% of health facilities with gaps in passive cold chain")

        LOGISTICS_PLAN_UPDATE = "logistics_plan_update", _("Latest update of the National Logistics Plan")

    class PerformanceTimeline(models.TextChoices):
        """
        Defines the timeframes used for calculating the indicators.

        """
        LAST_YEAR_SAME_DATE = "last_year_same_date", _("Last year same date")
        TO_DATE = "to_date", _("To date")
        TWELVE_MONTHS_BEHIND = "12_months_behind", _("12 months behind")
        LAST_12_MONTHS = "last_12_months", _("Last 12 months")
        SIA_A_YEAR_BEFORE = "sia_a_year_before", _("SIA a year before")
        LATEST_SIA = "latest_sia", _("Latest SIA")

    class PerformanceLevel(models.TextChoices):
        """
        Defines the color-coded performance categories.
        """
        GREEN = "green", _("Green")
        YELLOW = "yellow", _("Yellow")
        RED = "red", _("Red")

    BOUND_AVERAGE_KEY = "AVERAGE"
    BOUND_NO_LIMIT_KEY = "NO_LIMIT"

    indicators = models.CharField(max_length=200, choices=PerformanceIndicators.choices, default=PerformanceIndicators.STOCK_OUT)

    timeline = models.CharField(max_length=200, choices=PerformanceTimeline.choices, default=PerformanceTimeline.LAST_12_MONTHS)

    level = models.CharField(max_length=200, choices=PerformanceLevel.choices, default=PerformanceLevel.RED)

    lower_bound = models.CharField(
        max_length=50,
        help_text=f"The lower limit. Accepts a number, '{BOUND_AVERAGE_KEY}', or '{BOUND_NO_LIMIT_KEY}'.",
    )
    upper_bound = models.CharField(
        max_length=50,
        help_text=f"The upper limit. Accepts a number, '{BOUND_AVERAGE_KEY}', or '{BOUND_NO_LIMIT_KEY}'.",
    )

    # Optional field to specify if the boundary is inclusive or exclusive (crucial for exact scoring)
    # True means >= or <=. False means > or <. This is critical when one level ends and another begins.
    inclusive = models.BooleanField(
        default=True,
        help_text="If True, the bounds are inclusive (>=, <=).",
    )

    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="threshold_settings", null=False)


    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="threshold_settings_created_set",
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="threshold_settings_updated_set",
    )

    # Managers
    objects = DefaultSoftDeletableManager.from_queryset(ThresholdSettingsQuerySet)()
    objects_only_deleted = OnlyDeletedSoftDeletableManager.from_queryset(ThresholdSettingsQuerySet)()
    objects_include_deleted = IncludeDeletedSoftDeletableManager.from_queryset(ThresholdSettingsQuerySet)()

    class Meta:
        verbose_name = _("Threshold Settings")
        ordering = ["indicators", "timeline", "level"]
        indexes = [
            models.Index(fields=["account"]),
            models.Index(fields=["country"]),
        ]

    def __str__(self):
        return f"{self.country.name} - {self.indicators} - {self.timeline} - {self.level}"