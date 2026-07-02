from iaso.api.common import ModelSerializer
from iaso.models import Mission


class AuditMissionSerializer(ModelSerializer):
    class Meta:
        model = Mission
        fields = "__all__"
