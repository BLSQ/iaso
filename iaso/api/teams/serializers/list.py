from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from dynamic_fields.serializer import DynamicFieldsModelSerializerBackwardCompatible
from iaso.api.common import ModelSerializer
from iaso.models import Project, Team
from iaso.models.team import TeamType


class TeamListNestedProjectSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "color"]
        read_only_fields = fields


class TeamListSerializer(ModelSerializer, DynamicFieldsModelSerializerBackwardCompatible):
    project = TeamListNestedProjectSerializer(many=False, read_only=True, allow_null=False)
    members_count = serializers.SerializerMethodField()
    type = serializers.ChoiceField(read_only=True, allow_null=True, choices=TeamType.choices)

    class Meta:
        model = Team
        fields = ["id", "name", "color", "type", "project", "members_count"]
        default_fields = [f for f in fields if f != "members_count"]
        read_only_fields = fields

    @extend_schema_field(serializers.IntegerField)
    def get_members_count(self, team):
        if team.type == TeamType.TEAM_OF_TEAMS:
            return getattr(team, "annotated_sub_teams_count", None) or team.sub_teams.count()

        if team.type == TeamType.TEAM_OF_USERS:
            return getattr(team, "annotated_users_count", None) or team.users.count()
        return 0
