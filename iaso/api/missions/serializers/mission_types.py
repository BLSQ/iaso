from rest_framework import serializers

from iaso.models.microplanning import MissionType


class MissionTypeDropdownSerializer(serializers.Serializer):
    value = serializers.ChoiceField(choices=MissionType.choices)
    label = serializers.CharField()
