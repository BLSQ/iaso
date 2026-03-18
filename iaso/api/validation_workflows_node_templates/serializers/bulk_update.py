from iaso.api.common import ModelSerializer
from iaso.models import ValidationNodeTemplate


class ValidationNodeTemplateBulkUpdateSerializer(ModelSerializer):
    class Meta:
        model = ValidationNodeTemplate
        fields = []
