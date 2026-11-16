from __future__ import annotations

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.utils.serializer_helpers import ReturnDict

from iaso.api.common import ModelSerializer
from iaso.models import Team
from iaso.models.team import TeamType


class NestedTeamTypeSerializer(serializers.Serializer):
    label = serializers.CharField(read_only=True)
    value = serializers.ChoiceField(choices=TeamType.values, read_only=True)


class AssignmentTeamSerializer(ModelSerializer):
    team_id = serializers.IntegerField(read_only=True)
    assigned_for_level = serializers.IntegerField(read_only=True)
    total_for_level = serializers.IntegerField(read_only=True)
    assigned = serializers.IntegerField(read_only=True)
    total = serializers.IntegerField(read_only=True)
    area_org_unit_ids = serializers.ListField(
        child=serializers.IntegerField(read_only=True), read_only=True, allow_empty=True
    )
    type = serializers.SerializerMethodField(allow_null=True, read_only=True)
    depth = serializers.IntegerField(source="team_depth", read_only=True)

    class Meta:
        model = Team
        fields = [
            "team_id",
            "assigned_for_level",
            "total_for_level",
            "assigned",
            "total",
            "area_org_unit_ids",
            "type",
            "depth",
        ]
        read_only_fields = fields

    @extend_schema_field(NestedTeamTypeSerializer(allow_null=True))
    def get_type(self, obj: Team) -> ReturnDict | None:
        if not obj.type:
            return None
        return NestedTeamTypeSerializer(instance={"label": obj.get_type_display(), "value": obj.type}).data
