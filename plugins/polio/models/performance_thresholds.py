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
        keys = data.keys()
        values = list(data.values())
        operators = ["==", ">", "<", ">=", "<="]
        unsupported_keys = [key for key in keys if key not in operators]
        all_keys_valid = not unsupported_keys
        correct_array_format = len([value for value in values if (isinstance(value, list) and len(value) == 2)]) == len(
            keys
        )
        correct_reference_format = False
        correct_argument_format = False
        if correct_array_format:
            correct_reference_format = len([value for value in values if (value[0] == {"var": "value"})]) == len(keys)

            correct_argument_format = len(
                [value for value in values if (value[1] == {"var": "average"} or isinstance(value[1], int))]
            ) == len(keys)

        if all_keys_valid and correct_array_format and correct_reference_format and correct_argument_format:
            return True

        return False

    # make method static for easier testing
    @staticmethod
    def is_json_logic_expression(data):
        if not data:
            return False
        if isinstance(data, str):
            dict_data = json.loads(data)
        else:
            dict_data = data
        keys = dict_data.keys()

        if "and" not in keys and "or" not in keys:
            return PerformanceThresholds.is_json_logic_rule(dict_data)

        values = dict_data.values()
        found_invalid_data = False
        for entry in values:
            if not isinstance(entry, list):
                return False
            entry_keys = sum([list(rule.keys()) for rule in entry], [])
            # this model does not support nested operators
            if "and" in entry_keys or "or" in entry_keys:
                found_invalid_data = True
            else:
                found_invalid_data = (
                    len([rule for rule in entry if not PerformanceThresholds.is_json_logic_rule(rule)]) > 0
                )
            if found_invalid_data:
                break
        return not found_invalid_data

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
