from rest_framework import serializers

from iaso.models.team import TeamType


class TeamTypeDropdownSerializer(serializers.Serializer):
    value = serializers.ChoiceField(choices=TeamType.choices)
    label = serializers.CharField()
