from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import MissionForm


class MissionFormListSerializer(ModelSerializer):
    mission_type = serializers.CharField(read_only=True, source="get_mission_type_display")

    class Meta:
        model = MissionForm
        fields = ["id", "name", "mission_type", "created_at"]

        extra_kwargs = {
            "id": {"read_only": True},
            "created_at": {"read_only": True},
            "name": {"read_only": True},
        }
