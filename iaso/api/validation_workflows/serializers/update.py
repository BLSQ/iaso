from iaso.api.common import ModelSerializer
from iaso.models import ValidationWorkflow


class ValidationWorkflowUpdateSerializer(ModelSerializer):
    class Meta:
        model = ValidationWorkflow
        fields = ["name", "description", "slug"]

        extra_kwargs = {"name": {"write_only": True}, "description": {"write_only": True}, "slug": {"read_only": True}}

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request and request.user:
            instance.updated_by = request.user
        return super().update(instance, validated_data)
