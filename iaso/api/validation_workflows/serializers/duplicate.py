from iaso.api.common import ModelSerializer
from iaso.models import ValidationWorkflow


class ValidationWorkflowDuplicateSerializer(ModelSerializer):
    class Meta:
        model = ValidationWorkflow
        fields = ["slug", "name"]
        read_only_fields = fields
