from rest_framework import serializers
from rest_framework.fields import Field

from iaso.api.common import ModelSerializer
from iaso.models import Team


class AuditTeamSerializer(ModelSerializer):
    sub_teams: Field = serializers.PrimaryKeyRelatedField(read_only=True, many=True)

    class Meta:
        model = Team
        fields = "__all__"
