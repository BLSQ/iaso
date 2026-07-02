from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import OrgUnitType
from iaso.models.microplanning.missions import MissionOrgUnitType, MissionOrgUnitTypeThroughForm


class NestedMissionOrgUnitTypeThroughFormSerializer(ModelSerializer):
    form_name = serializers.CharField(read_only=True, source="form.name")

    class Meta:
        model = MissionOrgUnitTypeThroughForm
        fields = [
            "form",
            "form_name",
            "min_cardinality",
            "max_cardinality",
        ]

        extra_kwargs = {
            "form": {"read_only": True},
            "min_cardinality": {"read_only": True},
            "max_cardinality": {"read_only": True},
        }


class NestedOrgUnitTypeSerializer(ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name"]


class MissionOrgUnitTypeRetrieveSerializer(ModelSerializer):
    mission_type = serializers.CharField(read_only=True, source="get_mission_type_display")
    org_unit_type = NestedOrgUnitTypeSerializer(read_only=True)
    forms = NestedMissionOrgUnitTypeThroughFormSerializer(
        many=True, read_only=True, source="missionorgunittypethroughform_set"
    )

    class Meta:
        model = MissionOrgUnitType
        fields = [
            "id",
            "name",
            "mission_type",
            "created_at",
            "org_unit_type",
            "forms",
            "min_cardinality",
            "max_cardinality",
        ]

        extra_kwargs = {
            "id": {"read_only": True},
            "created_at": {"read_only": True},
            "name": {"read_only": True},
        }
