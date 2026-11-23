from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Assignment, OrgUnit, OrgUnitType, Team


User = get_user_model()


class PlanningOrgUnitTableNestedOrgUnitTypeSerializer(ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name"]


class PlanningOrgUnitTableAssignmentTeamSerializer(ModelSerializer):
    class Meta:
        model = Team
        fields = ["id", "name", "color"]


class PlanningOrgUnitTableAssignmentUserSerializer(ModelSerializer):
    color = serializers.CharField(source="iaso_profile.color", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "color"]


class PlanningOrgUnitTableAssignmentSerializer(ModelSerializer):
    """Assignment row for planning org unit table: both ``team`` and ``user`` are exposed; ``assignment_type`` indicates which is set."""

    team = PlanningOrgUnitTableAssignmentTeamSerializer(allow_null=True, read_only=True)
    user = PlanningOrgUnitTableAssignmentUserSerializer(allow_null=True, read_only=True)
    assignment_type = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = ("id", "team", "user", "assignment_type")

    @extend_schema_field(serializers.ChoiceField(allow_null=True, choices=["team", "user"], required=False))
    def get_assignment_type(self, obj: Assignment):
        if obj.team_id and obj.team:
            return "team"
        if obj.user_id and obj.user:
            return "user"
        return None


class PlanningOrgUnitTableSerializer(ModelSerializer):
    """Paginated planning org units for tables (minimal columns + assignment for this planning)."""

    org_unit_type = PlanningOrgUnitTableNestedOrgUnitTypeSerializer(read_only=True)
    assignment = serializers.SerializerMethodField()

    class Meta:
        model = OrgUnit
        fields = ["id", "name", "org_unit_type", "assignment"]
        read_only_fields = fields

    @extend_schema_field(PlanningOrgUnitTableAssignmentSerializer)
    def get_assignment(self, org_unit: OrgUnit):
        assignment = self._assignment_for_org_unit(org_unit)
        return PlanningOrgUnitTableAssignmentSerializer(instance=assignment).data

    def _assignment_for_org_unit(self, org_unit: OrgUnit):
        prefetched = getattr(org_unit, "_planning_assignments_prefetched", None)
        if prefetched is not None:
            return prefetched[0] if prefetched else None
        planning = self.context.get("planning")
        if planning is None:
            return None
        return (
            Assignment.objects.filter(planning=planning, org_unit=org_unit)
            .select_related("user__iaso_profile", "team")
            .first()
        )
