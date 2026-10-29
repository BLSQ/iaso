from typing import Any

from django.db import IntegrityError, models, transaction
from django.db.models.constraints import UniqueConstraint
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.settings import api_settings

from iaso.api.common import ModelSerializer
from iaso.api.common.serializer import BulkUpdateListSerializer
from iaso.models import Group, OrgUnitType, PlanningConfig


class PlanningConfigBulkUpdateListSerializer(BulkUpdateListSerializer):
    class Meta:
        model = PlanningConfig
        fields = []

    m2m_fields = {
        "org_unit_types": ("planningconfig_id", "orgunittype_id"),
        "org_unit_groups": ("planningconfig_id", "group_id"),
    }
    update_fields = ["level"]

    @staticmethod
    def _get_unique_together_constraint_name() -> str:
        constraint = next(
            constraint
            for constraint in PlanningConfig._meta.constraints
            if getattr(constraint, "fields", ()) == ("planning", "level") and isinstance(constraint, UniqueConstraint)
        )
        return constraint.name

    @transaction.atomic
    def update(self, instances: list[models.Model], validated_data: list[dict]) -> list[models.Model]:
        try:
            return super().update(instances, validated_data)
        except IntegrityError as e:
            # easier to try catch than writing endless validators for the bulk
            cause = getattr(e, "__cause__", None)
            constraint_name = getattr(
                getattr(cause, "diag", None),
                "constraint_name",
                None,
            )

            if constraint_name == self._get_unique_together_constraint_name():
                raise serializers.ValidationError(
                    {
                        api_settings.NON_FIELD_ERRORS_KEY: [
                            _("A planning configuration with this level already exists for this planning.")
                        ]
                    }
                ) from e

            raise


class PlanningConfigBulkUpdateSerializer(ModelSerializer):
    id = serializers.IntegerField(required=True, allow_null=False, write_only=True)
    org_unit_types = serializers.PrimaryKeyRelatedField(
        queryset=OrgUnitType.objects.none(),
        write_only=True,
        required=False,
        allow_null=True,
        allow_empty=True,
        many=True,
    )
    org_unit_groups = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.none(), write_only=True, required=False, allow_null=True, allow_empty=True, many=True
    )

    class Meta:
        model = PlanningConfig
        fields = ("id", "level", "org_unit_types", "org_unit_groups")
        extra_kwargs = {
            "level": {"write_only": True},
        }
        list_serializer_class = PlanningConfigBulkUpdateListSerializer

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        user = getattr(self.context.get("request", None), "user", None)
        if user:
            self.fields["org_unit_types"].child_relation.queryset = OrgUnitType.objects.filter_for_user_and_app_id(
                user
            ).only("id")
            self.fields["org_unit_groups"].child_relation.queryset = Group.objects.filter_for_user(user).only("id")

    def validate_id(self, value: int) -> int:
        if value not in self.instance.values_list("id", flat=True):
            # doing this so we can reuse the code and translations from drf
            field = serializers.PrimaryKeyRelatedField(queryset=self.instance)
            field.fail("does_not_exist", pk_value=value)
        return value
