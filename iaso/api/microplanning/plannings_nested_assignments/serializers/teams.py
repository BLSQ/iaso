from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Team
from iaso.models.team import TeamType


class AssignmentTeamSerializer(ModelSerializer):
    team_id = serializers.IntegerField(source="id", read_only=True)
    assigned = serializers.IntegerField(read_only=True)
    total = serializers.IntegerField(read_only=True)
    area_org_unit_ids = serializers.ListField(
        child=serializers.IntegerField(read_only=True), read_only=True, allow_empty=True
    )
    type = serializers.ChoiceField(choices=TeamType.choices, read_only=True, allow_null=True)

    class Meta:
        model = Team
        fields = ["team_id", "assigned", "total", "area_org_unit_ids", "type"]
        read_only_fields = fields
