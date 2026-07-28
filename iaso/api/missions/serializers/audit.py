from iaso.api.common import ModelSerializer
from iaso.models import MissionForm


class AuditMissionSerializer(ModelSerializer):
    class Meta:
        model = MissionForm
        fields = "__all__"
