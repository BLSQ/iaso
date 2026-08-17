from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.missions.serializers.retrieve.common import MissionTypeSerializer
from iaso.models import OrgUnitType
from iaso.models.missions import MissionFormThroughForm, MissionOrgUnitType


class NestedMissionFormThroughFormSerializer(ModelSerializer):
    form_name = serializers.CharField(read_only=True, source="form.name")

    class Meta:
        model = MissionFormThroughForm
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
    mission_type = MissionTypeSerializer(source="*")
    org_unit_type = NestedOrgUnitTypeSerializer(read_only=True)
    forms = NestedMissionFormThroughFormSerializer(many=True, read_only=True, source="missionformthroughform_set")

    class Meta:
        model = MissionOrgUnitType
        fields = [
            "id",
            "name",
            "description",
            "mission_type",
            "created_at",
            "org_unit_type",
            "forms",
            "min_cardinality",
            "max_cardinality",
        ]

        extra_kwargs = {
            "id": {"read_only": True},
            "description": {"read_only": True},
            "created_at": {"read_only": True},
            "name": {"read_only": True},
            "min_cardinality": {"read_only": True},
            "max_cardinality": {"read_only": True},
        }
