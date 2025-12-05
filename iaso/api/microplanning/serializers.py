from django.contrib.auth.models import User
from rest_framework import serializers

from iaso.api.common import (
    DateTimestampField,
    TimestampField,
)
from iaso.api.teams.serializers import NestedTeamSerializer
from iaso.models import Form, Group, OrgUnit, OrgUnitType, Project, Task
from iaso.models.microplanning import Assignment, Planning, PlanningSamplingResult
from iaso.models.org_unit import OrgUnitQuerySet
from iaso.models.team import Team


class NestedProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "color"]
        ref_name = "MicroplanningNestedProject"


class NestedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]
        ref_name = "MicroplanningNestedUser"


class NestedOrgUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ["id", "name", "org_unit_type"]


class NestedOrgUnitTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name"]


class PlanningSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context["request"].user
        account = user.iaso_profile.account
        self.fields["project"].queryset = account.project_set.all()
        self.fields["team"].queryset = Team.objects.filter_for_user(user)
        self.fields["org_unit"].queryset = OrgUnit.objects.filter_for_user_and_app_id(user, None)
        self.fields["forms"].child_relation.queryset = Form.objects.filter_for_user_and_app_id(user).distinct()
        self.fields["target_org_unit_type"].queryset = OrgUnitType.objects.filter(projects__account=account).distinct()

    class Meta:
        model = Planning
        fields = [
            "id",
            "name",
            "team_details",
            "team",
            "org_unit",
            "org_unit_details",
            "forms",
            "project",
            "project_details",
            "description",
            "published_at",
            "started_at",
            "ended_at",
            "pipeline_uuids",
            "target_org_unit_type",
            "target_org_unit_type_details",
        ]
        read_only_fields = ["created_at", "parent"]

    team_details = NestedTeamSerializer(source="team", read_only=True)
    org_unit_details = NestedOrgUnitSerializer(source="org_unit", read_only=True)
    project_details = NestedProjectSerializer(source="project", read_only=True)
    target_org_unit_type_details = NestedOrgUnitTypeSerializer(source="target_org_unit_type", read_only=True)
    pipeline_uuids = serializers.ListField(child=serializers.UUIDField(), required=False, allow_empty=True)

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

        forms = validated_data.get("forms", list(self.instance.forms.all()) if self.instance else None)
        project_forms = project.forms.all()
        if forms and not all(f in project_forms for f in forms):
            validation_errors["forms"] = "planningAndForms"

        org_unit = validated_data.get("org_unit", self.instance.org_unit if self.instance else None)
        if org_unit and org_unit.org_unit_type:
            org_unit_projects = org_unit.org_unit_type.projects.all()
            if project not in org_unit_projects:
                validation_errors["org_unit"] = "planningAndOrgUnit"

        target_org_unit_type = validated_data.get(
            "target_org_unit_type", self.instance.target_org_unit_type if self.instance else None
        )
        if target_org_unit_type:
            target_type_projects = target_org_unit_type.projects.all()
            if project not in target_type_projects:
                validation_errors["target_org_unit_type"] = "planningAndTargetOrgUnitType"
            else:
                descendant_org_units = OrgUnit.objects.descendants(org_unit).filter(org_unit_type=target_org_unit_type)
                if not descendant_org_units.exists():
                    validation_errors["target_org_unit_type"] = "noOrgUnitsOfTypeInHierarchy"

        if validation_errors:
            raise serializers.ValidationError(validation_errors)

        return validated_data


class SamplingGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name"]


class SamplingTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["id", "name", "status"]


class PlanningSamplingResultSerializer(serializers.ModelSerializer):
    planning = serializers.PrimaryKeyRelatedField(read_only=True)
    group_id = serializers.IntegerField(read_only=True, allow_null=True)
    task_id = serializers.IntegerField(read_only=True, allow_null=True)
    created_by_details = NestedUserSerializer(source="created_by", read_only=True)
    group_details = SamplingGroupSerializer(source="group", read_only=True)
    task_details = SamplingTaskSerializer(source="task", read_only=True)

    class Meta:
        model = PlanningSamplingResult
        fields = [
            "id",
            "planning",
            "task_id",
            "task_details",
            "pipeline_id",
            "pipeline_version",
            "group_id",
            "group_details",
            "parameters",
            "status",
            "created_at",
            "created_by",
            "created_by_details",
        ]
        read_only_fields = [
            "id",
            "planning",
            "created_at",
            "created_by",
            "created_by_details",
            "group_details",
            "task_details",
        ]


class PlanningSamplingResultWriteSerializer(serializers.ModelSerializer):
    group_id = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.none(),
        allow_null=True,
        required=False,
        source="group",
    )
    task_id = serializers.PrimaryKeyRelatedField(
        queryset=Task.objects.none(),
        allow_null=True,
        required=False,
        source="task",
    )

    class Meta:
        model = PlanningSamplingResult
        fields = ["task_id", "pipeline_id", "pipeline_version", "group_id", "parameters", "status"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            account = user.iaso_profile.account
            self.fields["group_id"].queryset = Group.objects.filter_for_user(user)
            self.fields["task_id"].queryset = Task.objects.filter(account=account)
        else:
            self.fields["group_id"].queryset = Group.objects.none()
            self.fields["task_id"].queryset = Task.objects.none()


class AuditPlanningSerializer(serializers.ModelSerializer):
    class Meta:
        model = Planning
        fields = "__all__"


class AssignmentSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context["request"].user
        account = user.iaso_profile.account
        users_in_account = User.objects.filter(iaso_profile__account=account)

        self.fields["user"].queryset = users_in_account
        self.fields["planning"].queryset = Planning.objects.filter_for_user(user)
        self.fields["team"].queryset = Team.objects.filter_for_user(user)
        self.fields["org_unit"].queryset = OrgUnit.objects.filter_for_user_and_app_id(user, None)

    class Meta:
        model = Assignment
        fields = ["id", "planning", "user", "team", "org_unit", "org_unit_details"]
        read_only_fields = ["created_at"]

    org_unit_details = NestedOrgUnitSerializer(source="org_unit", read_only=True)

    def validate(self, attrs):
        validated_data = super().validate(attrs)

        user = self.context["request"].user
        validated_data["created_by"] = user

        assigned_user = validated_data.get("user", self.instance.user if self.instance else None)
        assigned_team = validated_data.get("team", self.instance.team if self.instance else None)
        if assigned_team and assigned_user:
            raise serializers.ValidationError("Cannot assign on both team and users")

        planning = validated_data.get("planning", self.instance.planning if self.instance else None)
        org_unit: OrgUnit = validated_data.get("org_unit", self.instance.org_unit if self.instance else None)

        org_units_available: OrgUnitQuerySet = self.fields["org_unit"].queryset
        org_units_available = org_units_available.descendants(planning.org_unit)
        if org_unit not in org_units_available:
            raise serializers.ValidationError({"org_unit": "OrgUnit is not in planning scope"})
        # TODO More complex check possible:
        # - Team or user should be under the root planning team
        # - check that the hierarchy of the planning assignement is respected
        # - one of the parent org unit should be assigned to a parent team of the assigned user or team
        # - type  of org unit is valid for this form
        return validated_data


class AuditAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = "__all__"


class BulkAssignmentSerializer(serializers.Serializer):
    """Assign orgunit in bulk to as team or user.

    update assignment object if it exists otherwise create it
    Audit the modification"""

    planning = serializers.PrimaryKeyRelatedField(queryset=Planning.objects.none(), write_only=True)
    team = serializers.PrimaryKeyRelatedField(
        queryset=Team.objects.none(), write_only=True, required=False, allow_null=True
    )
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.none(), write_only=True, required=False, allow_null=True
    )
    org_units = serializers.PrimaryKeyRelatedField(queryset=OrgUnit.objects.none(), write_only=True, many=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context["request"].user
        account = user.iaso_profile.account
        users_in_account = User.objects.filter(iaso_profile__account=account)

        self.fields["user"].queryset = users_in_account
        self.fields["planning"].queryset = Planning.objects.filter_for_user(user)
        self.fields["team"].queryset = Team.objects.filter_for_user(user)
        self.fields["org_units"].child_relation.queryset = OrgUnit.objects.filter_for_user_and_app_id(user, None)

    def validate(self, attrs):
        validated_data = super().validate(attrs)
        if validated_data.get("user") and validated_data.get("team"):
            raise serializers.ValidationError(
                {"team": "Cannot specify both user and teams", "user": "Cannot specify both user and teams"}
            )
        return validated_data


class BulkDeleteAssignmentSerializer(serializers.Serializer):
    """Bulk soft delete all assignments for a specific planning.

    Marks all assignments linked to the specified planning as deleted using the deleted_at field.
    Audit the modification.
    """

    planning = serializers.PrimaryKeyRelatedField(queryset=Planning.objects.none(), write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context["request"].user
        self.fields["planning"].queryset = Planning.objects.filter_for_user(user)


# noinspection PyMethodMayBeStatic
class MobilePlanningSerializer(serializers.ModelSerializer):
    "Only used to serialize for mobile"

    def save(self):
        # ensure that we can't save from here
        raise NotImplementedError

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

    created_at = TimestampField()
    started_at = DateTimestampField()
    ended_at = DateTimestampField()

    assignments = serializers.SerializerMethodField()

    def get_assignments(self, planning: Planning):
        user = self.context["request"].user
        r = []
        planning_form_set = set(planning.forms.values_list("id", flat=True))
        forms_per_ou_type = {}
        for out in OrgUnitType.objects.filter(projects__account=user.iaso_profile.account):
            out_set = set(out.form_set.values_list("id", flat=True))
            intersection = out_set.intersection(planning_form_set)
            forms_per_ou_type[out.id] = (
                intersection  # intersection of the two sets: the forms of the orgunit types and the forms of the planning
            )

        for a in planning.assignment_set.filter(deleted_at__isnull=True).filter(user=user).prefetch_related("org_unit"):
            # TODO: investigate type error on next line
            r.append({"org_unit_id": a.org_unit_id, "form_ids": forms_per_ou_type[a.org_unit.org_unit_type_id]})  # type: ignore
        return r
