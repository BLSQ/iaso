from rest_framework import serializers

from iaso.models.missions import MissionType


class MissionTypeSerializer(serializers.Serializer):
    value = serializers.ChoiceField(source="mission_type", read_only=True, choices=MissionType.values)
    label = serializers.CharField(source="get_mission_type_display", read_only=True)
