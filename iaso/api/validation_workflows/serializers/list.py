from rest_framework import serializers

from iaso.api.common import ModelSerializer, TimestampField
from iaso.api.validation_workflows.serializers.common import UserDisplayNameField
from iaso.models import ValidationWorkflow


class ValidationWorkflowListSerializer(ModelSerializer):
    created_at = TimestampField(read_only=True)
    updated_by = UserDisplayNameField()
    updated_at = TimestampField(read_only=True)
    created_by = UserDisplayNameField()
    form_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ValidationWorkflow
        fields = ["slug", "name", "form_count", "created_by", "updated_by", "created_at", "updated_at"]
