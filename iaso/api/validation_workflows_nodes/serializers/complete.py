from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.settings import api_settings

from iaso.engine.exceptions import ValidationWorkflowEngineException
from iaso.engine.validation_workflow import ValidationWorkflowEngine


class ValidationNodeCompleteSerializer(serializers.Serializer):
    comment = serializers.CharField(required=False, allow_blank=True, max_length=1024, allow_null=False)
    approved = serializers.BooleanField(required=False)
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    def validate(self, data):
        if not data.get("comment", None) and not data.get("approved", False):
            raise serializers.ValidationError({"comment": "Comment is required in case of rejection."})
        return data

    def save(self, **kwargs):
        data = self.validated_data
        validation_node = self.instance
        try:
            ValidationWorkflowEngine.complete_node(
                validation_node,
                artifact=validation_node.instance,
                user=data["user"],
                comment=data.get("comment", ""),
                approved=data.get("approved"),
            )
        except ValidationWorkflowEngineException as e:
            raise ValidationError({api_settings.NON_FIELD_ERRORS_KEY: [str(e)]})
