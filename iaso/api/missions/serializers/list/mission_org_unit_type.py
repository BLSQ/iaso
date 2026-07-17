from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import MissionForm, OrgUnitType


class NestedOrgUnitTypeSerializer(ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name"]
        extra_kwargs = {
            "id": {"read_only": True},
            "name": {"read_only": True},
        }


class MissionOrgUnitTypeListSerializer(ModelSerializer):
    org_unit_type = NestedOrgUnitTypeSerializer(read_only=True)
    forms_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = MissionForm
        fields = ["id", "name", "mission_type", "org_unit_type", "forms_count", "created_at"]

        extra_kwargs = {
            "id": {"read_only": True},
            "created_at": {"read_only": True},
            "name": {"read_only": True},
        }
