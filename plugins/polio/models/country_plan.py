import typing

from django.contrib.auth.models import AnonymousUser, User
from django.db import models
from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _

from iaso.models import OrgUnit, Project
from iaso.models.base import Account
from iaso.utils.models.soft_deletable import (
    DefaultSoftDeletableManager,
    IncludeDeletedSoftDeletableManager,
    OnlyDeletedSoftDeletableManager,
    SoftDeletableModel,
)
from plugins.polio.models.base import VACCINES


class CountryPlanQuerySet(QuerySet):
    def filter_for_user_and_app_id(
        self, user: typing.Optional[typing.Union[User, AnonymousUser]], app_id: typing.Optional[str] = None
    ):
        if not user or (user.is_anonymous and app_id is None):
            return self.none()

        if user.is_authenticated:
            return self.filter(account=user.iaso_profile.account)

        if app_id is not None:  # leaving the possibility to pass app_id if page needs to be embedded
            try:
                project = Project.objects.get_for_user_and_app_id(user, app_id)
                return self.filter(account=project.account)
            except Project.DoesNotExist:
                return self.none()


class CountryPlan(SoftDeletableModel):
    class Status(models.TextChoices):
        DRAFT = "draft", _("Draft")
        COMMENTED = "commented", _("Commented")
        FINAL = "final", _("Final")

    date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    country = models.ForeignKey(
        OrgUnit,
        on_delete=models.PROTECT,
        related_name="country_plans",
    )
    vaccine = models.CharField(max_length=20, choices=VACCINES)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="country_plan", null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Managers
    objects = DefaultSoftDeletableManager.from_queryset(CountryPlanQuerySet)()
    objects_only_deleted = OnlyDeletedSoftDeletableManager.from_queryset(CountryPlanQuerySet)()
    objects_include_deleted = IncludeDeletedSoftDeletableManager.from_queryset(CountryPlanQuerySet)()

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

    @staticmethod
    def json_schema():
        return {
            "type": "object",
            "properties": {
                "id": {"type": "number"},
                "vaccine": {"type": "string"},
                "created_at": {"type": "string"},
                "updated_at": {"type": "string"},
                "country_name": {"type": "string"},
                "country_id": {"type": "string"},
                "status": {"type": "string"},
                "date": {"type": "string"},
            },
            "required": ["id", "vaccine", "country_name", "country_id", "status", "date"],
        }
