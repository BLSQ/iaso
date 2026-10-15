from typing import Any, Dict, List

from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.relations import PrimaryKeyRelatedField

from iaso.api.common import ModelSerializer
from iaso.models import OrgUnit, OrgUnitType, Planning, PlanningConfig


class PlanningConfigBulkCreateListSerializer(serializers.ListSerializer):
    class Meta:
        model = PlanningConfig

    @staticmethod
    def validate(data: Dict[str, Any]) -> Dict[str, Any]:
        level_planning = [(x["level"], x["planning"]) for x in data]

        if len(level_planning) != len(set(level_planning)):
            raise serializers.ValidationError(_("Level and planning must be unique together"))

        return data

    @staticmethod
    def _get_instance_dict(data: Dict[str, Any]) -> Dict[str, Any]:
        return {k: v for k, v in data.items() if k in ["level", "planning"]}

    @transaction.atomic
    def create(self, validated_data: dict) -> List[PlanningConfig]:
        instances: List[PlanningConfig] = [PlanningConfig(**self._get_instance_dict(x)) for x in validated_data]

        PlanningConfig.objects.bulk_create(instances, batch_size=100)

        instance_out_pairs = [
            (instance.id, out.pk)
            for instance, data in zip(instances, validated_data)
            for out in data.get("org_unit_types", [])
        ]

        if instance_out_pairs:
            PlanningConfig.org_unit_types.through.objects.bulk_create(
                [
                    PlanningConfig.org_unit_types.through(planningconfig_id=inst_id, orgunittype_id=out_id)
                    for inst_id, out_id in instance_out_pairs
                ],
                ignore_conflicts=True,
                batch_size=100,
            )

        instance_oug_pairs = [
            (instance.id, oug.pk)
            for instance, data in zip(instances, validated_data)
            for oug in data.get("org_unit_groups", [])
        ]

        if instance_oug_pairs:
            PlanningConfig.org_unit_groups.through.objects.bulk_create(
                [
                    PlanningConfig.org_unit_groups.through(planningconfig_id=inst_id, orgunit_id=oug_id)
                    for inst_id, oug_id in instance_oug_pairs
                ],
                ignore_conflicts=True,
                batch_size=100,
            )

        return instances


class PlanningConfigBulkCreateSerializer(ModelSerializer):
    org_unit_types = PrimaryKeyRelatedField(
        queryset=OrgUnitType.objects.none(),
        write_only=True,
        required=False,
        allow_null=True,
        allow_empty=True,
        many=True,
    )
    org_unit_groups = PrimaryKeyRelatedField(
        queryset=OrgUnit.objects.none(), write_only=True, required=False, allow_null=True, allow_empty=True, many=True
    )

    class Meta:
        model = PlanningConfig
        list_serializer_class = PlanningConfigBulkCreateListSerializer
        fields = ("id", "level", "planning", "org_unit_types", "org_unit_groups")
        extra_kwargs = {
            "level": {"required": True, "write_only": True},
            "planning": {"required": True, "write_only": True},
            "id": {"read_only": True},
        }

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        user = getattr(self.context.get("request", None), "user", None)
        if user:
            self.fields["org_unit_types"].child_relation.queryset = OrgUnitType.objects.filter_for_user_and_app_id(
                user
            ).only("id")
            self.fields["org_unit_groups"].child_relation.queryset = OrgUnit.objects.filter_for_user(user).only("id")
            self.fields["planning"].queryset = Planning.objects.filter_for_user(user).only("id")
