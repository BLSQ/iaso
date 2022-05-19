from django.contrib.auth.models import User
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers, filters

from iaso.api.common import ModelViewSet, DeletionFilterBackend, ReadOnlyOrHasPermission
from iaso.models import Project, OrgUnit, Form
from iaso.models.microplanning import Team, TeamType, Planning


# TODO Perms: Add a permission, filter on it
class NestedProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name"]


class NestedTeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ["id", "name"]


class NestedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]


class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = [
            "id",
            "project",
            "name",
            "description",
            "created_at",
            "deleted_at",
            "users",
            "users_ids",
            "manager",
            "parent",
            "sub_teams",
            "sub_teams_ids",
        ]
        read_only_fields = ["created_at", "parent"]

    users = NestedUserSerializer(many=True, read_only=True)
    users_ids = serializers.PrimaryKeyRelatedField(
        required=False, many=True, source="users", queryset=User.objects.all()
    )
    sub_teams = NestedTeamSerializer(many=True, read_only=True)
    sub_teams_ids = serializers.PrimaryKeyRelatedField(
        required=False, many=True, source="sub_teams", queryset=Team.objects.all()
    )

    def validate_project(self, value):
        """
        Check that project belongs to the user account
        """
        account = self.context["request"].user.iaso_profile.account
        if value not in account.project_set.all():
            raise serializers.ValidationError("Invalid project")
        return value

    def validate_manager(self, value):
        user = self.context["request"].user
        account = user.iaso_profile.account
        users = User.objects.filter(iaso_profile__account=account)
        if value not in users:
            raise serializers.ValidationError("Invalid manager")
        return value

    def validate_users_ids(self, values):
        user = self.context["request"].user
        account = user.iaso_profile.account
        users = User.objects.filter(iaso_profile__account=account)
        for user in values:
            if user not in users:
                raise serializers.ValidationError("Invalid user")
        return values

    # TODO validate children

    def validate(self, attrs):
        validated_data = super(TeamSerializer, self).validate(attrs)

        user = self.context["request"].user
        validated_data["created_by"] = user

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
        elif users:
            validated_data["type"] = TeamType.TEAM_OF_USERS
        elif teams:
            validated_data["type"] = TeamType.TEAM_OF_TEAMS
        else:
            validated_data["type"] = None
        return validated_data


class TeamSearchFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        search = request.query_params.get("search")

        if search:
            queryset = queryset.filter(Q(name__icontains=search)).distinct()
        return queryset


class TeamViewSet(ModelViewSet):
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend, TeamSearchFilterBackend, DeletionFilterBackend]
    permission_classes = [ReadOnlyOrHasPermission("menupermissions.iaso_teams")]
    serializer_class = TeamSerializer
    queryset = Team.objects.all()
    ordering_fields = ["id", "name", "created_at", "updated_at"]
    filterset_fields = {
        "name": ["icontains"],
    }

    def get_queryset(self):
        user = self.request.user
        return self.queryset.filter_for_user(user)


class PlanningSerializer(serializers.ModelSerializer):
    class Meta:
        model = Planning
        fields = [
            "id",
            "name",
            "team",
            "org_unit",
            "forms",
            "project",
            "description",
            "published_at",
            "started_at",
            "ended_at",
        ]
        read_only_fields = ["created_at", "parent"]

    def validate(self, attrs):
        validated_data = super().validate(attrs)

        user = self.context["request"].user
        validated_data["created_by"] = user
        if (
            validated_data.get("started_at")
            and validated_data.get("ended_at")
            and validated_data["started_at"] > validated_data["ended_at"]
        ):
            raise serializers.ValidationError({"started_at": "Start date cannot be after end date"})

        return validated_data

    # Todo validate that project from org unit , teams and form are the same.
    def validate_project(self, value):
        """
        Check that project belongs to the user account
        """
        account = self.context["request"].user.iaso_profile.account
        if value not in account.project_set.all():
            raise serializers.ValidationError("Invalid project")
        return value

    def validate_team(self, value: Team):
        account = self.context["request"].user.iaso_profile.account
        if value.project not in account.project_set.all():
            raise serializers.ValidationError("Invalid team")
        return value

    def validate_org_unit(self, value):
        user = self.context["request"].user
        if value not in OrgUnit.objects.filter_for_user_and_app_id(user, None):
            raise serializers.ValidationError("Invalid OrgUnit")
        return value

    def validate_forms(self, values):
        user = self.context["request"].user
        forms = Form.objects.filter_for_user_and_app_id(user)
        for form in values:
            if form not in forms:
                raise serializers.ValidationError(f"Invalid Form {form.name}")
        return values


class PlanningViewSet(ModelViewSet):
    remove_results_key_if_paginated = True
    permission_classes = [ReadOnlyOrHasPermission("menupermissions.iaso_planning")]
    serializer_class = PlanningSerializer
    queryset = Planning.objects.all()
    ordering_fields = ["id", "name", "started_at", "ended_at"]
    filterset_fields = {
        "name": ["icontains"],
    }

    def get_queryset(self):
        user = self.request.user
        return self.queryset.filter_for_user(user)
