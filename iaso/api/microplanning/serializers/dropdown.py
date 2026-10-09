from iaso.api.common import ModelSerializer
from iaso.models import Planning


class PlanningDropdownSerializer(ModelSerializer):
    class Meta:
        model = Planning
        fields = ["id", "name"]
        read_only_fields = ["id", "name"]
