from django.contrib.auth import get_user_model
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Project, Team
from iaso.utils.serializer.color import ColorFieldSerializer


class TeamRetrieveNestedProjectSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "color"]
        read_only_fields = fields


class TeamRetrieveNestedUserSerializer(ModelSerializer):
    iaso_profile_id = serializers.IntegerField(source="iaso_profile.id", read_only=True, allow_null=True)
    color = ColorFieldSerializer(read_only=True, source="iaso_profile.color", allow_null=True)

    class Meta:
        model = get_user_model()
        fields = ["id", "username", "first_name", "last_name", "iaso_profile_id", "color"]
        read_only_fields = fields


class TeamRetrieveNestedTeamSerializer(ModelSerializer):
    class Meta:
        model = Team
        fields = ["id", "name", "deleted_at", "color"]
        read_only_fields = fields


class TeamRetrieveSerializer(ModelSerializer):
    manager = TeamRetrieveNestedUserSerializer(read_only=True)
    users = TeamRetrieveNestedUserSerializer(many=True, read_only=True, allow_null=True, allow_empty=True)
    project = TeamRetrieveNestedProjectSerializer(many=False, read_only=True, allow_null=False)
    sub_teams = TeamRetrieveNestedTeamSerializer(many=True, read_only=True, allow_null=True, allow_empty=True)

    class Meta:
        model = Team
        fields = [
            "id",
            "name",
            "description",
            "created_at",
            "updated_at",
            "users",
            "project",
            "sub_teams",
            "manager",
            "type",
            "parent",
            "color",
        ]
        read_only_fields = fields
