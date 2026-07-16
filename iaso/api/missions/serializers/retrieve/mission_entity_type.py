from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.missions.serializers.retrieve.common import MissionTypeSerializer
from iaso.models import EntityType
from iaso.models.missions import MissionEntityType, MissionEntityTypeThroughForm


class NestedMissionEntityTypeThroughFormSerializer(ModelSerializer):
    form_name = serializers.CharField(read_only=True, source="form.name")

    class Meta:
        model = MissionEntityTypeThroughForm
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


class NestedEntityTypeSerializer(ModelSerializer):
    class Meta:
        model = EntityType
        fields = ["id", "name"]


class MissionEntityTypeRetrieveSerializer(ModelSerializer):
    mission_type = MissionTypeSerializer(source="*")
    entity_type = NestedEntityTypeSerializer(read_only=True)
    forms = NestedMissionEntityTypeThroughFormSerializer(
        many=True, read_only=True, source="missionentitytypethroughform_set"
    )

    class Meta:
        model = MissionEntityType
        fields = [
            "id",
            "name",
            "description",
            "created_at",
            "entity_type",
            "forms",
            "min_cardinality",
            "max_cardinality",
            "mission_type",
        ]

        extra_kwargs = {
            "id": {"read_only": True},
            "description": {"read_only": True},
            "created_at": {"read_only": True},
            "name": {"read_only": True},
            "min_cardinality": {"read_only": True},
            "max_cardinality": {"read_only": True},
        }
