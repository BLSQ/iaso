from __future__ import annotations

from typing import Any, List

from django.db import IntegrityError, models, transaction
from django.db.models.constraints import UniqueConstraint
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.settings import api_settings

from iaso.api.common import ModelSerializer
from iaso.api.common.serializer import BulkUpdateListSerializer
from iaso.api.microplanning.serializers.serializer_fields import CurrentPlanningDefault
from iaso.models import Group, OrgUnitType, PlanningConfig


class NestedPlanningConfigBulkListSerializer(BulkUpdateListSerializer):
    m2m_fields = {
        "org_unit_types": ("planningconfig_id", "orgunittype_id"),
        "org_unit_groups": ("planningconfig_id", "group_id"),
    }
    update_fields = ["level"]

    class Meta:
        model = PlanningConfig
        fields = []

    @staticmethod
    def _get_unique_together_constraint_name() -> str:
        constraint = next(
            constraint
            for constraint in PlanningConfig._meta.constraints
            if getattr(constraint, "fields", ()) == ("planning", "level") and isinstance(constraint, UniqueConstraint)
        )
        return constraint.name

    @transaction.atomic
    def update(self, instances: List[models.Model], validated_data: List[dict]) -> List[models.Model]:
        try:
            return self._update(instances, validated_data)
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

    def _update(self, instances: List[models.Model], validated_data: List[dict]) -> List[models.Model]:
        # get the existing instances and do a comparison so we know :
        instances_ids = {instance.id for instance in instances}
        instances_by_ids = {instance.id: instance for instance in instances}
        validated_data_by_ids = {vd["id"]: vd for vd in validated_data if vd.get("id")}
        validated_data_ids = set(validated_data_by_ids.keys())

        to_remove = instances_ids - validated_data_ids
        to_add_data = [k for k in validated_data if "id" not in k]

        to_update = validated_data_ids & instances_ids
        to_update_data = {k: v for k, v in validated_data_by_ids.items() if k in to_update}

        # which one to delete
        PlanningConfig.objects.filter(pk__in=list(to_remove)).delete()

        # which one to add, with m2m
        planning_config_bulk_create = PlanningConfig.objects.bulk_create(
            [
                PlanningConfig(**{k: v for k, v in vd.items() if k not in ["org_unit_groups", "org_unit_types"]})
                for vd in to_add_data
            ]
        )
        created_instances = iter(planning_config_bulk_create)

        planning_config_bulk_create_ids = [x.id for x in planning_config_bulk_create]

        # create m2ms

        org_unit_types = []
        org_unit_groups = []

        for pc, vd in zip(planning_config_bulk_create_ids, to_add_data, strict=False):
            # org_unit_groups
            org_unit_groups += [{"group_id": v.id, "planningconfig_id": pc} for v in vd["org_unit_groups"]]

            # org_unit_types
            org_unit_types += [{"orgunittype_id": v.id, "planningconfig_id": pc} for v in vd["org_unit_types"]]

        if org_unit_types:
            PlanningConfig.org_unit_types.through.objects.bulk_create(
                [PlanningConfig.org_unit_types.through(**d) for d in org_unit_types]
            )
        if org_unit_groups:
            PlanningConfig.org_unit_groups.through.objects.bulk_create(
                [PlanningConfig.org_unit_groups.through(**d) for d in org_unit_groups]
            )

        # which one to updates
        updated_instances = []
        if to_update:
            updated_instances += super().update(instances, list(to_update_data.values()))

        instances_by_ids.update({instance.id: instance for instance in updated_instances})
        rtn_instances = [
            instances_by_ids[vd["id"]] if vd.get("id") else next(created_instances) for vd in validated_data
        ]

        return rtn_instances


class NestedPlanningConfigBulkSerializer(ModelSerializer):
    id = serializers.IntegerField(required=False)

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
    planning_id = serializers.HiddenField(default=CurrentPlanningDefault())

    class Meta:
        model = PlanningConfig
        fields = ("id", "level", "org_unit_groups", "org_unit_types", "planning_id")
        extra_kwargs = {
            "level": {"write_only": True},
        }
        list_serializer_class = NestedPlanningConfigBulkListSerializer

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        user = getattr(self.context.get("request", None), "user", None)
        if user:
            self.fields["org_unit_types"].child_relation.queryset = OrgUnitType.objects.filter_for_user_and_app_id(
                user
            ).only("id")
            self.fields["org_unit_groups"].child_relation.queryset = Group.objects.filter_for_user(user).only("id")

    def validate_id(self, value: int | None) -> int | None:
        if not value:
            return value
        if value not in self.instance.values_list("id", flat=True):
            # doing this so we can reuse the code and translations from drf
            field = serializers.PrimaryKeyRelatedField(queryset=self.instance)
            field.fail("does_not_exist", pk_value=value)
        return value
