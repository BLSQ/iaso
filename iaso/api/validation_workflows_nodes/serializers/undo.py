from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.settings import api_settings

from iaso.engine.exceptions import ValidationWorkflowEngineException
from iaso.engine.validation_workflow import ValidationWorkflowEngine


class ValidationNodeUndoSerializer(serializers.Serializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    def save(self, **kwargs):
        try:
            ValidationWorkflowEngine.undo_node(
                self.instance, self.validated_data["user"], self.instance.instance, self.instance.node.workflow
            )
        except ValidationWorkflowEngineException as e:
            raise ValidationError({api_settings.NON_FIELD_ERRORS_KEY: [str(e)]})
