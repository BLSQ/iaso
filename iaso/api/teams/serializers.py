from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.fields import Field

from iaso.models import Project
from iaso.models.team import Team, TeamType


class NestedProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "color"]


class NestedTeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ["id", "name", "deleted_at", "color"]


class NestedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


class AuditTeamSerializer(serializers.ModelSerializer):
    sub_teams: Field = serializers.PrimaryKeyRelatedField(read_only=True, many=True)

    class Meta:
        model = Team
        fields = "__all__"


class TeamDropdownSerializer(serializers.ModelSerializer):
    """Lightweight serializer for team dropdown lists"""

    class Meta:
        model = Team
        fields = ["id", "name", "color", "type", "project"]
        read_only_fields = ["id", "name", "color", "type", "project"]


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
            "color",
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
