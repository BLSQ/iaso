from rest_framework import serializers

from iaso.api.common import DateTimestampField, ModelSerializer, TimestampField
from iaso.models import Planning


# noinspection PyMethodMayBeStatic
class MobilePlanningSerializer(ModelSerializer):
    "Serialize plannings for mobile and transforms missions into forms to stay backward compatible with older versions"

    created_at = TimestampField(read_only=True)
    started_at = DateTimestampField(read_only=True)
    ended_at = DateTimestampField(read_only=True)

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
        read_only_fields = ["id", "name", "description"]

    @staticmethod
    def get_assignments(planning: Planning):
        assignments = []
        # Derive form_ids from missions for backward compatibility
        planning_form_ids = set()
        for mission in planning.missions.all():
            planning_form_ids.update(tf.form_id for tf in mission.missionformthroughform_set.all())

        for a in planning.assignment_set.all():
            out_set = {f.id for f in a.org_unit.org_unit_type.form_set.all()}
            intersection = out_set.intersection(planning_form_ids)
            assignments.append({"org_unit_id": a.org_unit_id, "form_ids": intersection})
        return assignments
