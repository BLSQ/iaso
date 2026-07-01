from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.validation_workflows.serializers.common import UserDisplayNameField
from iaso.models import ValidationWorkflow


class ValidationWorkflowListSerializer(ModelSerializer):
    updated_by = UserDisplayNameField(allow_null=True, allow_blank=True, required=False)
    created_by = UserDisplayNameField(allow_null=True, allow_blank=True, required=False)
    form_count = serializers.IntegerField(read_only=True)
    current_version = serializers.CharField(read_only=True, allow_null=False, allow_blank=False)

    class Meta:
        model = ValidationWorkflow
        fields = [
            "slug",
            "name",
            "form_count",
            "current_version",
            "updated_by",
            "created_by",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {"slug": {"required": True}}
