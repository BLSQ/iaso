from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import ValidationWorkflow


class ValidationWorkflowDuplicateSerializer(ModelSerializer):
    """
    Duplicates the workflow passed to save(), e.g. `serializer.save(source=workflow)`.
    """

    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault(), write_only=True)

    class Meta:
        model = ValidationWorkflow
        fields = ["slug", "name", "created_by"]
        read_only_fields = ["slug", "name"]

    def create(self, validated_data):
        return validated_data["source"].duplicate(validated_data["created_by"])
