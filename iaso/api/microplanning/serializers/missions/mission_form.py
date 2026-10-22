from iaso.api.common import ModelSerializer
from iaso.models import MissionForm


class PlanningMissionFormListSerializer(ModelSerializer):
    class Meta:
        model = MissionForm
        fields = ["id", "name", "mission_type", "created_at"]

        extra_kwargs = {
            "id": {"read_only": True},
            "created_at": {"read_only": True},
            "name": {"read_only": True},
        }
