from iaso.api.common import ModelSerializer
from iaso.models import Team


class TeamDropdownSerializer(ModelSerializer):
    """Lightweight serializer for team dropdown lists"""

    class Meta:
        model = Team
        fields = ["id", "name", "color", "type", "project"]
        read_only_fields = ["id", "name", "color", "type", "project"]
