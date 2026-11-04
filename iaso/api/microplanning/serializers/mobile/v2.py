from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import DateTimestampField, ModelSerializer, TimestampField
from iaso.api.microplanning.serializers.mobile.nested_mission import NestedMissionSerializer
from iaso.models import Planning


class AssignmentSerializer(serializers.Serializer):
    """
    Just a serializer to ease swagger compliance
    """

    org_unit_id = serializers.IntegerField(read_only=True, allow_null=False)
    missions = NestedMissionSerializer(many=True, allow_null=False, allow_empty=False, read_only=True)


class MobilePlanningV2Serializer(ModelSerializer):
    "Only used to serialize for mobile"

    created_at = TimestampField()
    started_at = DateTimestampField()
    ended_at = DateTimestampField()
    assignments = serializers.SerializerMethodField()

    class Meta:
        model = Planning
        fields = [
            "id",
            "name",
            "description",
            "created_at",
            "started_at",
            "ended_at",
            "assignments",
        ]

    @extend_schema_field(AssignmentSerializer(many=True))
    def get_assignments(self, planning: Planning):
        assignments = []
        for a in planning.assignment_set.all():
            missions = []
            for m in planning.missions.all():
                if m.has_form_assignments(a.org_unit):
                    missions.append(
                        NestedMissionSerializer(
                            m, context={**self.context, "form_assignments": m.get_form_assignments(a.org_unit)}
                        ).data
                    )
            if len(missions) > 0:
                assignments.append({"org_unit_id": a.org_unit_id, "missions": missions})

        return assignments
