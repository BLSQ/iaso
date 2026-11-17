from iaso.api.common import ModelSerializer
from iaso.models import Planning


class AuditPlanningSerializer(ModelSerializer):
    class Meta:
        model = Planning
        fields = "__all__"
