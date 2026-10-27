import typing

from django.contrib.auth import get_user_model
from drf_spectacular.helpers import lazy_serializer
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Team
from iaso.utils.serializer.color import ColorFieldSerializer


class NestedUserTreeSerializer(ModelSerializer):
    color = ColorFieldSerializer(source="iaso_profile.color", read_only=True, allow_null=False)
    iaso_profile_id = serializers.IntegerField(source="iaso_profile.id", read_only=True, allow_null=True)

    class Meta:
        model = get_user_model()
        fields = ["id", "iaso_profile_id", "username", "first_name", "last_name", "color"]
        read_only_fields = fields


class TeamBuildTreeSerializer(ModelSerializer):
    depth = serializers.IntegerField(read_only=True)
    users = NestedUserTreeSerializer(many=True, read_only=True, allow_null=True, allow_empty=True)

    class Meta:
        model = Team
        fields = ["id", "name", "type", "parent", "depth", "color", "users"]
        read_only_fields = fields


class TeamTreeSerializer(TeamBuildTreeSerializer):
    """
    This serializer has been built only for swagger compliance
    """

    children = serializers.SerializerMethodField()

    class Meta(TeamBuildTreeSerializer.Meta):
        model = Team
        fields = TeamBuildTreeSerializer.Meta.fields + ["children"]
        read_only_fields = fields

    @extend_schema_field(lazy_serializer("iaso.api.teams.serializers.tree.TeamTreeSerializer")(many=True))
    def get_children(self, obj: Team) -> list[dict]:
        return typing.cast(list[dict], typing.cast(object, TeamTreeSerializer(obj.sub_teams.all(), many=True).data))
