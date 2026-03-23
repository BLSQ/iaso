from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.validation_workflows.serializers.common import CurrentAccountDefault
from iaso.models import ValidationWorkflow


class ValidationWorkflowCreateSerializer(ModelSerializer):
    account = serializers.HiddenField(default=CurrentAccountDefault(), write_only=True)
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault(), write_only=True)

    class Meta:
        model = ValidationWorkflow
        fields = ["name", "description", "slug", "account", "created_by"]
        extra_kwargs = {"name": {"write_only": True}, "description": {"write_only": True}, "slug": {"read_only": True}}
