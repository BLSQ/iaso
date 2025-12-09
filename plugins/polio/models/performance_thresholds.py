import json
import typing

from django.contrib.auth.models import AnonymousUser, User
from django.db import models
from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _

from iaso.models import Project
from iaso.models.base import Account
from iaso.utils.models.soft_deletable import (
    DefaultSoftDeletableManager,
    IncludeDeletedSoftDeletableManager,
    OnlyDeletedSoftDeletableManager,
    SoftDeletableModel,
)


ENABLED_OPERATORS = ["==", ">", "<", ">=", "<="]


class PerformanceThresholdQuerySet(QuerySet):
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


class PerformanceThresholds(SoftDeletableModel):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="performance_thresholds", null=False)
    indicator = models.CharField(max_length=200, blank=False)
    fail_threshold = models.JSONField(null=False, blank=False)  # a json in the JSON Logic format
    warning_threshold = models.JSONField(null=False, blank=False)  # a json in the JSON Logic format
    success_threshold = models.JSONField(null=False, blank=False)  # a json in the JSON Logic format
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Managers
    objects = DefaultSoftDeletableManager.from_queryset(PerformanceThresholdQuerySet)()
    objects_only_deleted = OnlyDeletedSoftDeletableManager.from_queryset(PerformanceThresholdQuerySet)()
    objects_include_deleted = IncludeDeletedSoftDeletableManager.from_queryset(PerformanceThresholdQuerySet)()

    class Meta:
        verbose_name = _("Performance Threshold")
        verbose_name_plural = _("Performance Thresholds")
        ordering = ["indicator"]
        unique_together = ["account", "indicator"]

        indexes = [
            models.Index(fields=["account"]),
            models.Index(fields=["indicator"]),
        ]

    def __str__(self):
        return f"{self.account.name}-{self.indicator}"

    # make method static for easier testing
    @staticmethod
    def is_json_logic_rule(data):
        if not data:
            return False
        for key, value in data.items():
            if key not in ENABLED_OPERATORS:
                return False
            if not isinstance(value, list) or len(value) != 2:
                return False
            if value[0] != {"var": "value"}:
                return False
            if value[1] != {"var": "average"} and not isinstance(value[1], int):
                return False
        return True

    # make method static for easier testing
    @staticmethod
    def is_json_logic_expression(data):
        if not data:
            return False

        if isinstance(data, str):
            dict_data = json.loads(data)
        else:
            dict_data = data

        for key, value in dict_data.items():
            if key not in ["and", "or"]:
                # Single rule
                return PerformanceThresholds.is_json_logic_rule(data)
            if not isinstance(value, list):
                return False
            for entry in value:
                entry_keys = entry.keys()
                if "and" in entry_keys or "or" in entry_keys:
                    # this model does not support nested operators
                    return False
                return PerformanceThresholds.is_json_logic_rule(entry)

        return True

    # expose json schema of model for testing
    @staticmethod
    def json_schema():
        return {
            "type": "object",
            "properties": {
                "id": {"type": "number"},
                "indicator": {"type": "string"},
                "created_at": {"type": "string"},
                "updated_at": {"type": "string"},
                "fail_threshold": {"type": "object"},
                "success_threshold": {"type": "object"},
                "warning_threshold": {"type": "object"},
            },
            "required": ["id", "indicator", "fail_threshold", "success_threshold", "warning_threshold"],
        }
