from iaso.api.common import ModelSerializer
from iaso.models import Assignment


class AuditNestedPlanningAssignmentSerializer(ModelSerializer):
    class Meta:
        model = Assignment
        fields = "__all__"
