from iaso.api.common import ModelSerializer
from iaso.api.common.serializer_fields import VersionField
from iaso.models import ValidationWorkflowVersion


class NestedValidationWorkflowUpdateSerializer(ModelSerializer):
    version = VersionField(write_only=True, required=True)

    class Meta:
        model = ValidationWorkflowVersion
        fields = ["version"]
