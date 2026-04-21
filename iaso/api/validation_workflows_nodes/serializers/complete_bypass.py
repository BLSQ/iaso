from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.settings import api_settings

from iaso.engine.exceptions import ValidationWorkflowEngineException
from iaso.engine.validation_workflow import ValidationWorkflowEngine
from iaso.models import ValidationNodeTemplate


class ValidationNodeCompleteBypassSerializer(serializers.Serializer):
    node = serializers.SlugRelatedField(
        label="Node template slug to complete", slug_field="slug", queryset=ValidationNodeTemplate.objects.none()
    )
    comment = serializers.CharField(required=False, allow_blank=True, max_length=1024, allow_null=False)
    approved = serializers.BooleanField(required=False)
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    def validate(self, data):
        if not data.get("comment", None) and not data.get("approved", False):
            raise serializers.ValidationError({"comment": "Comment is required in case of rejection."})
        return data

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if getattr(self, "instance", "form"):
            self.fields["node"].queryset = ValidationNodeTemplate.objects.select_related("workflow").filter(
                workflow=self.instance.form.validation_workflow
            )

    def save(self, **kwargs):
        data = self.validated_data

        try:
            ValidationWorkflowEngine.complete_node_by_passing(
                node=data["node"],
                artifact=self.instance,
                user=data["user"],
                comment=data.get("comment", ""),
                approved=data.get("approved"),
                workflow=data["node"].workflow,
            )
        except ValidationWorkflowEngineException as e:
            raise ValidationError({api_settings.NON_FIELD_ERRORS_KEY: [str(e)]})
