from iaso.api.common import ModelSerializer
from iaso.models import PlanningConfig


class PlanningConfigUpdateSerializer(ModelSerializer):
    class Meta:
        model = PlanningConfig
        fields = ("level",)
