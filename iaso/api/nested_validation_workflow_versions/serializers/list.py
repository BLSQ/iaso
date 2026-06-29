from iaso.api.common import ModelSerializer
from iaso.models import ValidationWorkflowVersion


class ValidationWorkflowVersionListSerializer(ModelSerializer):
    class Meta:
        model = ValidationWorkflowVersion
        fields = ["id", "version", "created_at", "updated_at", "created_by", "updated_by"]
