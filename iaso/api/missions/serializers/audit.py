from iaso.api.common import ModelSerializer
from iaso.models import MissionWithForms


class AuditMissionSerializer(ModelSerializer):
    class Meta:
        model = MissionWithForms
        fields = "__all__"
