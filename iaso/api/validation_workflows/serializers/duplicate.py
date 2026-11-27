from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import ValidationWorkflow


class ValidationWorkflowDuplicateSerializer(ModelSerializer):
    """
    Duplicates the workflow given as the instance, e.g. `ValidationWorkflowDuplicateSerializer(workflow, data={})`.
    save() returns the copy, which is then the instance serialized in the response.
    """

    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault(), write_only=True)

    class Meta:
        model = ValidationWorkflow
        fields = ["slug", "name", "created_by"]
        read_only_fields = ["slug", "name"]

    def update(self, instance, validated_data):
        return instance.duplicate(validated_data["created_by"])
