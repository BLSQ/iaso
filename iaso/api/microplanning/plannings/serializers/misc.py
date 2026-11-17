from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import (
    Mission,
    OrgUnit,
    OrgUnitType,
    Planning,
    Project,
)
from iaso.models.microplanning import PlanningSamplingResult
from iaso.models.team import Team


class NestedProjectSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "color"]
        ref_name = "MicroplanningNestedProject"


class NestedOrgUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ["id", "name", "org_unit_type"]


class NestedOrgUnitTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name"]


class NestedPlanningSamplingResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanningSamplingResult
        fields = ["id", "pipeline_id", "pipeline_version", "pipeline_name", "group_id", "task_id"]


class PlanningWriteSerializer(serializers.ModelSerializer):
    selected_sampling_result = serializers.PrimaryKeyRelatedField(
        queryset=PlanningSamplingResult.objects.all(), required=False, allow_null=True
    )
    pipeline_uuids = serializers.ListField(child=serializers.UUIDField(), required=False, allow_empty=True)

    class Meta:
        model = Planning
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at", "deleted_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context["request"].user
        account = user.iaso_profile.account
        self.fields["project"].queryset = account.project_set.all()
        self.fields["team"].queryset = Team.objects.filter_for_user(user)
        self.fields["org_unit"].queryset = OrgUnit.objects.filter_for_user_and_app_id(user, None)
        self.fields["missions"].child_relation.queryset = Mission.objects.filter_for_user(user)
        self.fields["target_org_unit_types"].child_relation.queryset = OrgUnitType.objects.filter(
            projects__account=account
        ).distinct()

    def validate(self, attrs):
        validated_data = super().validate(attrs)

        user = self.context["request"].user
        validated_data["created_by"] = user
        validation_errors = {}
        if (
            validated_data.get("started_at")
            and validated_data.get("ended_at")
            and validated_data["started_at"] > validated_data["ended_at"]
        ):
            validation_errors["started_at"] = "startDateAfterEndDate"
            validation_errors["ended_at"] = "EndDateBeforeStartDate"

        if validated_data.get("published_at") and validated_data.get("started_at") is None:
            validation_errors["started_at"] = "publishedWithoutStartDate"
        if validated_data.get("published_at") and validated_data.get("ended_at") is None:
            validation_errors["ended_at"] = "publishedWithoutEndDate"

        project = validated_data.get("project", self.instance.project if self.instance else None)

        team = validated_data.get("team", self.instance.team if self.instance else None)
        if team.project != project:
            validation_errors["team"] = "planningAndTeams"

        missions = validated_data.get("missions", list(self.instance.missions.all()) if self.instance else None)
        if missions:
            account = project.account
            for mission in missions:
                if mission.account != account:
                    validation_errors["missions"] = "missionNotInAccount"
                    break

        org_unit = validated_data.get("org_unit", self.instance.org_unit if self.instance else None)
        if org_unit and org_unit.org_unit_type:
            org_unit_projects = org_unit.org_unit_type.projects.all()
            if project not in org_unit_projects:
                validation_errors["org_unit"] = "planningAndOrgUnit"

        target_org_unit_types = validated_data.get(
            "target_org_unit_types",
            list(self.instance.target_org_unit_types.all()) if self.instance else None,
        )
        if target_org_unit_types:
            for target_type in target_org_unit_types:
                target_type_projects = target_type.projects.all()
                if project not in target_type_projects:
                    validation_errors["target_org_unit_types"] = "planningAndTargetOrgUnitType"
                    break
                descendant_org_units = OrgUnit.objects.descendants(org_unit).filter(org_unit_type=target_type)
                if not descendant_org_units.exists():
                    validation_errors["target_org_unit_types"] = "noOrgUnitsOfTypeInHierarchy"
                    break

        selected_sampling_result = validated_data.get("selected_sampling_result")
        if selected_sampling_result:
            if selected_sampling_result and self.instance and selected_sampling_result.planning_id != self.instance.id:
                validation_errors["selected_sampling_result"] = "samplingNotForPlanning"
            validated_data["selected_sampling_result"] = selected_sampling_result

        if validation_errors:
            raise serializers.ValidationError(validation_errors)

        return validated_data


class PlanningReadNestedTeamSerializer(ModelSerializer):
    class Meta:
        model = Team
        fields = ["id", "name", "deleted_at", "color"]


class PlanningReadSerializer(serializers.ModelSerializer):
    assignments_count = serializers.SerializerMethodField()

    class Meta:
        model = Planning
        fields = [
            "id",
            "name",
            "missions",
            "description",
            "published_at",
            "started_at",
            "ended_at",
            "pipeline_uuids",
            "selected_sampling_result",
            "assignments_count",
            "team_details",
            "org_unit_details",
            "project_details",
            "target_org_unit_type_details",
            "deprecated",
        ]
        read_only_fields = fields

    def get_assignments_count(self, obj):
        return getattr(obj, "assignments_count", 0)

    selected_sampling_result = NestedPlanningSamplingResultSerializer(read_only=True)
    team_details = PlanningReadNestedTeamSerializer(source="team", read_only=True)
    org_unit_details = NestedOrgUnitSerializer(source="org_unit", read_only=True)
    project_details = NestedProjectSerializer(source="project", read_only=True)
    target_org_unit_type_details = NestedOrgUnitTypeSerializer(
        source="target_org_unit_types", many=True, read_only=True
    )
