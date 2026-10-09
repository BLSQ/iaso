from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Planning


class PlanningDropdownSerializer(ModelSerializer):
    label = serializers.CharField(source="name", read_only=True, allow_blank=False, allow_null=False)
    value = serializers.IntegerField(read_only=True, source="pk", allow_null=False)

    class Meta:
        model = Planning
        fields = ["label", "value"]
