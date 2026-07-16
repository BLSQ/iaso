from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import MissionEntityType, MissionForm


class NestedEntityTypeSerializer(ModelSerializer):
    class Meta:
        model = MissionEntityType
        fields = ["id", "name"]
        extra_kwargs = {
            "id": {"read_only": True},
            "name": {"read_only": True},
        }


class MissionEntityTypeListSerializer(ModelSerializer):
    entity_type = NestedEntityTypeSerializer(read_only=True)
    forms_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = MissionForm
        fields = ["id", "name", "mission_type", "entity_type", "forms_count", "created_at"]

        extra_kwargs = {
            "id": {"read_only": True},
            "created_at": {"read_only": True},
            "name": {"read_only": True},
        }
