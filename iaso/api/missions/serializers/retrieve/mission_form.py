from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import MissionForm
from iaso.models.missions import MissionFormThroughForm


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


class MissionFormRetrieveSerializer(ModelSerializer):
    mission_type_label = serializers.CharField(source="get_mission_type_display", read_only=True)

    forms = NestedMissionFormThroughFormSerializer(
        many=True, read_only=True, source="missionformthroughform_set", allow_empty=False, allow_null=False
    )

    class Meta:
        model = MissionForm
        fields = ["id", "name", "description", "mission_type", "mission_type_label", "created_at", "forms"]

        extra_kwargs = {
            "id": {"read_only": True},
            "created_at": {"read_only": True},
            "name": {"read_only": True},
            "description": {"read_only": True},
            "mission_type": {"read_only": True},
        }
