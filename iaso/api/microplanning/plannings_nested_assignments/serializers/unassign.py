from __future__ import annotations

from typing import Any

from django.contrib.postgres.expressions import ArraySubquery
from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers
from typing_extensions import override

from iaso.api.common import ModelSerializer
from iaso.api.common.serializer import ListQueryOptimizedSerializer
from iaso.api.common.serializer_fields import IasoPrimaryKeyRelatedField
from iaso.api.microplanning.plannings.utils import PlanningOrgUnitTreeQuerySetBuilder
from iaso.models import Assignment, OrgUnit, Planning
from iaso.models.microplanning.assignments import AssignmentQuerySet
from iaso.models.org_unit import OrgUnitQuerySet


class UnassignInputSerializer(ModelSerializer):
    org_unit_ids = IasoPrimaryKeyRelatedField(queryset=OrgUnit.objects.none(), many=True, write_only=True)

    class Meta:
        model = Assignment
        fields = ("org_unit_ids",)

    @staticmethod
    def _get_assignable_org_units(user, planning: Planning) -> OrgUnitQuerySet:
        """Org units below the planning target geography that its configs keep in the planning tree."""
        root = planning.org_unit
        root_level = len(str(root.path).split("."))
        configs = planning.configs.prefetch_related("org_unit_types", "org_unit_groups")
        return (
            PlanningOrgUnitTreeQuerySetBuilder()
            .build_queryset(
                queryset=OrgUnit.objects.filter_for_user(user),
                root=root,
                processed_levels={root_level + config.level - 1 for config in configs},
                configs=configs,
            )
            .exclude(pk=root.pk)
            .only("id", "parent_id", "path")
        )

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        user = getattr(self.context.get("request", None), "user", None)
        planning = self.context.get("planning", None)

        if user and planning:
            self.fields["org_unit_ids"].child_relation.queryset = self._get_assignable_org_units(user, planning)

    def filter_queryset(self, queryset: AssignmentQuerySet) -> AssignmentQuerySet:
        self.is_valid(raise_exception=True)

        if not queryset:
            return queryset

        org_units = self.validated_data["org_unit_ids"]
        paths = ArraySubquery(OrgUnit.objects.filter(id__in=[ou.id for ou in org_units]).values("path"))
        return queryset.filter(
            Q(org_unit__in=self.validated_data["org_unit_ids"])
            | (Q(org_unit__path__descendants=paths) & ~Q(org_unit__in=self.validated_data["org_unit_ids"]))
        )


class ListUnassignSerializer(ListQueryOptimizedSerializer):
    deleted = serializers.ListField(child=serializers.IntegerField(), required=False, read_only=True, allow_empty=True)

    @override
    def update(self, instances: AssignmentQuerySet, validated_data: dict[str, Any]) -> AssignmentQuerySet:
        fields = list(self.child.fields.keys())

        for obj, data in zip(instances, validated_data):
            for field, value in data.items():
                setattr(obj, field, value)

        instances.bulk_update(instances, fields=fields, batch_size=1000)
        return instances

    @override
    def to_representation(self, data: AssignmentQuerySet) -> dict[str, Any]:
        return {
            "deleted": [instance.org_unit_id for instance in data],
        }

    @property
    def data(self):
        ret = serializers.BaseSerializer.data.fget(self)
        return serializers.ReturnDict(ret, serializer=self)


class UnassignSerializer(ModelSerializer):
    deleted_at = serializers.HiddenField(write_only=True, default=timezone.now)
    updated_at = serializers.HiddenField(write_only=True, default=timezone.now)

    class Meta:
        model = Assignment
        list_serializer_class = ListUnassignSerializer
        fields = ("deleted_at", "updated_at")


class UnassignResponseSerializer(serializers.Serializer):
    """
    Just there for swagger compliance, linked to ListUnassignSerializer

    """

    deleted = serializers.ListField(child=serializers.IntegerField(), required=False, allow_empty=True)
