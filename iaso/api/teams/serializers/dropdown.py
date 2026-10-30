from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Team
from iaso.models.team import TeamType


class TeamDropdownSerializer(ModelSerializer):
    """Lightweight serializer for team dropdown lists"""

    label = serializers.CharField(source="name", read_only=True, allow_blank=False, allow_null=False)
    value = serializers.IntegerField(read_only=True, source="pk", allow_null=False)
    type = serializers.ChoiceField(choices=TeamType.choices, allow_null=True)

    class Meta:
        model = Team
        fields = ["label", "value", "color", "type"]
        read_only_fields = fields
