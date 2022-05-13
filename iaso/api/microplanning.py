from django.contrib.auth.models import User
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers, filters

from iaso.api.common import ModelViewSet, DeletionFilterBackend
from iaso.models import Project
from iaso.models.microplanning import Team, TeamType

# TODO Perms: Add a permission, filter on it
class NestedProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name"]
        read_only_fields = ["created_at"]


class NestedTeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ["id", "name"]
        read_only_fields = ["created_at"]


class NestedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]
        read_only_fields = ["created_at"]


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
    serializer_class = TeamSerializer
    queryset = Team.objects.all()
    ordering_fields = ["id", "name", "created_at", "updated_at"]
    filterset_fields = {
        "name": ["icontains"],
    }

    def get_queryset(self):
        user = self.request.user
        return self.queryset.filter_for_user(user)
