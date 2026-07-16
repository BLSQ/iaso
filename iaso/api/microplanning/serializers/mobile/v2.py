from rest_framework import serializers

from iaso.api.common import DateTimestampField, ModelSerializer, TimestampField
from iaso.api.microplanning.serializers.mobile.nested_mission import NestedMissionSerializer
from iaso.models import Planning


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

    def get_assignments(self, planning: Planning):
        assignments = []
        for a in planning.assignment_set.all():
            missions = []
            for m in planning.missions.all():
                form_assignments = m.get_form_assignments(a)

                if form_assignments:
                    missions.append(
                        NestedMissionSerializer(m, context={**self.context, "form_assignments": form_assignments}).data
                    )

                # if m.mission_type == MissionType.FORM_FILLING:
                #     # We assign the mission only if there is a match between the OUT's forms and the mission's forms
                #     out_set = set(a.org_unit.org_unit_type.form_set.values_list("id", flat=True))
                #     intersection = out_set.intersection(m.mission_forms.values_list("form_id", flat=True))
                #     if len(intersection) > 0:
                #         # Only keep the forms that are in the OUT
                #         mc = NestedMissionSerializer(m).data
                #         mc["mission_forms"] = list(
                #             filter(lambda x: x["form"]["id"] in intersection, mc["mission_forms"])
                #         )
                #         missions.append(mc)
                # elif m.mission_type == MissionType.ORG_UNIT_AND_FORM:
                #     # We need to filter on OrgUnit which are parent of the type
                #     m_out = m.org_unit_type.org_unit_type.id
                #     if (
                #         m_out == a.org_unit.org_unit_type.id
                #         or m_out in a.org_unit.org_unit_type.sub_unit_types.values_list("id", flat=True)
                #     ):
                #         missions.append(NestedMissionSerializer(m).data)
                # elif m.mission_type == MissionType.ENTITY_AND_FORM:
                #     # We always assign entities as there are no enforcement on entities and OrgUnit types.
                #     missions.append(NestedMissionSerializer(m).data)
                # else:
                #     raise NotImplementedError("Unknown mission type")
            if len(missions) > 0:
                assignments.append({"org_unit_id": a.org_unit_id, "missions": missions})

        return assignments
