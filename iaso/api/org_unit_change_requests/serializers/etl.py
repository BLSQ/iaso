from dynamic_fields.serializer import DynamicFieldsModelSerializerMixin
from iaso.api.common import ModelSerializer
from iaso.models import OrgUnitChangeRequest


class ETLOrgUnitChangeRequestListSerializer(DynamicFieldsModelSerializerMixin, ModelSerializer):
    class Meta:
        model = OrgUnitChangeRequest
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.read_only = True
