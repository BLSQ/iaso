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
from plugins.polio.models.base import VACCINES


class PerformanceDashboardQuerySet(QuerySet):
    def filter_for_user(self, user: typing.Optional[typing.Union[User, AnonymousUser]]):
        if not user or not user.is_authenticated:
            raise UserNotAuthError("User not Authenticated")
        profile = user.iaso_profile
        return self.filter(account=profile.account)


class PerformanceDashboard(SoftDeletableModel):
    class Status(models.TextChoices):
        DRAFT = "draft", _("Draft")
        COMMENTED = "commented", _("Commented")
        FINAL = "final", _("Final")

    date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    country = models.ForeignKey(
        OrgUnit,
        on_delete=models.PROTECT,
        related_name="performance_dashboard",
    )
    vaccine = models.CharField(max_length=20, choices=VACCINES)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="performance_dashboard", null=False)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="performance_dashboard_created_set",
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="performance_dashboard_updated_set",
    )

    # Managers
    objects = DefaultSoftDeletableManager.from_queryset(PerformanceDashboardQuerySet)()
    objects_only_deleted = OnlyDeletedSoftDeletableManager.from_queryset(PerformanceDashboardQuerySet)()
    objects_include_deleted = IncludeDeletedSoftDeletableManager.from_queryset(PerformanceDashboardQuerySet)()

    class Meta:
        verbose_name = _("Performance Dashboard")
        ordering = ["-date", "country__name"]
        indexes = [
            models.Index(fields=["account"]),
            models.Index(fields=["country"]),
        ]

    # No unique constraint specified in the ticket, so omitting for now.
    def __str__(self):
        return f"{self.country.name} - {self.date} - {self.vaccine}"