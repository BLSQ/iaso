from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.fields import Field

from iaso.api.common import (
    DateTimestampField,
    TimestampField,
)
from iaso.models import Form, OrgUnit, OrgUnitType, Project
from iaso.models.microplanning import Assignment, Planning, Team, TeamType
from iaso.models.org_unit import OrgUnitQuerySet


class NestedProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "color"]


class NestedTeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ["id", "name", "deleted_at"]


class NestedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


class AuditTeamSerializer(serializers.ModelSerializer):
    sub_teams: Field = serializers.PrimaryKeyRelatedField(read_only=True, many=True)

    class Meta:
        model = Team
        fields = "__all__"


class NestedOrgUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ["id", "name", "org_unit_type"]


class TeamSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context["request"].user
        account = user.iaso_profile.account
        users_in_account = User.objects.filter(iaso_profile__account=account)
        self.fields["project"].queryset = account.project_set.all()
        self.fields["manager"].queryset = users_in_account
        self.fields["users"].child_relation.queryset = users_in_account
        self.fields["sub_teams"].child_relation.queryset = Team.objects.filter_for_user(user)
        self.fields["parent"].queryset = Team.objects.filter_for_user(user)

    class Meta:
        model = Team
        fields = [
            "id",
            "project",
            "project_details",
            "name",
            "description",
            "created_at",
            "deleted_at",
            "type",
            "users",
            "users_details",
            "manager",
            "parent",
            "sub_teams",
            "sub_teams_details",
        ]
        read_only_fields = ["created_at"]

    users_details = NestedUserSerializer(many=True, read_only=True, source="users")
    sub_teams_details = NestedTeamSerializer(many=True, read_only=True, source="sub_teams")
    project_details = NestedProjectSerializer(many=False, read_only=True, source="project")

    def validate_parent(self, value: Team):
        if value is not None and value.type not in (None, TeamType.TEAM_OF_TEAMS):
            raise serializers.ValidationError("parentIsNotTeamOfTeam")
        if self.instance:
            p = value
            while p:
                if p == self.instance:
                    raise serializers.ValidationError("noLoopInSubTree")
                # TODO: investigate type error on next line
                p = p.parent  # type: ignore
        return value

    def validate_sub_teams(self, values):
        def recursive_check(instance, children):
            for child in children:
                if instance == child:
                    raise serializers.ValidationError("noLoopInSubTree")
                recursive_check(instance, child.sub_teams.all())

        if self.instance:
            recursive_check(self.instance, values)
        return values

    def save(self, **kwargs):
        old_sub_teams_ids = []
        if self.instance:
            old_sub_teams_ids = list(self.instance.sub_teams.all().values_list("id", flat=True))
        r = super().save(**kwargs)
        new_sub_teams_ids = list(self.instance.sub_teams.all().values_list("id", flat=True))
        team_changed_qs = Team.objects.filter(id__in=new_sub_teams_ids + old_sub_teams_ids)
        teams_to_update = []
        for team in team_changed_qs:
            teams_to_update += team.calculate_paths(force_recalculate=True)
        Team.objects.bulk_update(teams_to_update, ["path"])
        return r

    def validate(self, attrs):
        validated_data = super(TeamSerializer, self).validate(attrs)

        user = self.context["request"].user
        validated_data["created_by"] = user

        project = validated_data.get("project", self.instance.project if self.instance else None)
        sub_teams = validated_data.get("sub_teams", self.instance.sub_teams.all() if self.instance else [])
        for sub_team in sub_teams:
            if sub_team.project != project:
                raise serializers.ValidationError("Sub teams must be in the same project")

        # Check that we don't have both user and teams
        # this is written in this way to support partial update
        users = None
        teams = None
        if self.instance:
            teams = self.instance.sub_teams.all()
            users = self.instance.users.all()
        if "sub_teams" in validated_data:
            teams = validated_data["sub_teams"]
        if "users" in validated_data:
            users = validated_data["users"]
        if teams and users:
            raise serializers.ValidationError("Teams cannot have both users and sub teams")
        if users:
            expected_type = TeamType.TEAM_OF_USERS
        elif teams:
            expected_type = TeamType.TEAM_OF_TEAMS
        else:
            expected_type = None
        if validated_data.get("type") and expected_type and expected_type != validated_data.get("type"):
            raise serializers.ValidationError("Incorrect type")
        if validated_data.get("type") is None:
            validated_data["type"] = expected_type

        return validated_data


class PlanningSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user = self.context["request"].user
        account = user.iaso_profile.account
        self.fields["project"].queryset = account.project_set.all()
        self.fields["team"].queryset = Team.objects.filter_for_user(user)
        self.fields["org_unit"].queryset = OrgUnit.objects.filter_for_user_and_app_id(user, None)
        self.fields["forms"].child_relation.queryset = Form.objects.filter_for_user_and_app_id(user).distinct()

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
        ]
        read_only_fields = ["created_at", "parent"]

    team_details = NestedTeamSerializer(source="team", read_only=True)
    org_unit_details = NestedOrgUnitSerializer(source="org_unit", read_only=True)
    project_details = NestedProjectSerializer(source="project", read_only=True)
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
        if validation_errors:
            raise serializers.ValidationError(validation_errors)

        return validated_data


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
