from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import ValidationWorkflow


class ValidationWorkflowDropdownSerializer(ModelSerializer):
    value = serializers.IntegerField(source="pk", read_only=True)
    label = serializers.CharField(source="name", read_only=True)

    class Meta:
        model = ValidationWorkflow
        fields = ["value", "label"]
