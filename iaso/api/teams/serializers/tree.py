import typing

from drf_spectacular.helpers import lazy_serializer
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Team


class TeamBuildTreeSerializer(ModelSerializer):
    depth = serializers.IntegerField(read_only=True)

    class Meta:
        model = Team
        fields = [
            "id",
            "name",
            "type",
            "parent",
            "depth",
        ]
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
    def get_children(self, obj: Team) -> typing.List[dict]:
        return typing.cast(
            typing.List[dict], typing.cast(object, TeamTreeSerializer(obj.sub_teams.all(), many=True).data)
        )
