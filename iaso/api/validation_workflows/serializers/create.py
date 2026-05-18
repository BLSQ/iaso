from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from iaso.api.common import ModelSerializer
from iaso.api.validation_workflows.serializers.common import CurrentAccountDefault
from iaso.models import Form, ValidationWorkflow


class ValidationWorkflowCreateSerializer(ModelSerializer):
    account = serializers.HiddenField(default=CurrentAccountDefault(), write_only=True)
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault(), write_only=True)
    forms = serializers.PrimaryKeyRelatedField(
        queryset=Form.objects.none(), many=True, required=False, source="form_set", write_only=True, allow_empty=True
    )

    class Meta:
        model = ValidationWorkflow
        fields = ["name", "description", "slug", "account", "created_by", "forms"]
        extra_kwargs = {"name": {"write_only": True}, "description": {"write_only": True}, "slug": {"read_only": True}}
        validators = [
            UniqueTogetherValidator(
                queryset=ValidationWorkflow.objects.all(),
                fields=["name", "account"],
            )
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        self.fields["forms"].child_relation.queryset = Form.objects.filter_for_user_and_app_id(user)
