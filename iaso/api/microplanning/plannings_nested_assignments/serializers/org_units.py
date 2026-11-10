from iaso.api.common import ModelSerializer
from iaso.models import Assignment


class AssignmentOrgUnitSerializer(ModelSerializer):
    class Meta:
        model = Assignment
        fields = ["id", "org_unit", "team", "user"]
        read_only_fields = fields
