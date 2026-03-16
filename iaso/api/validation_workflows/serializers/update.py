from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.validation_workflows.serializers.common import CurrentAccountDefault
from iaso.models import Form, ValidationWorkflow


class ValidationWorkflowUpdateSerializer(ModelSerializer):
    forms = serializers.PrimaryKeyRelatedField(queryset=Form.objects.none(), many=True, write_only=True, required=False)
    account = serializers.HiddenField(default=CurrentAccountDefault(), write_only=True)
    updated_by = serializers.HiddenField(default=serializers.CurrentUserDefault(), write_only=True)

    class Meta:
        model = ValidationWorkflow
        fields = ["name", "description", "forms", "account", "updated_by"]

        extra_kwargs = {"name": {"write_only": True}, "forms": {"required": True}, "description": {"write_only": True}}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        self.fields["forms"].queryset = Form.objects.filter_for_user_and_app_id(user)
