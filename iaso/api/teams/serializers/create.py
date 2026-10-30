from typing import Any

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.teams.serializer_fields import TeamPrimaryKeyRelatedField
from iaso.models import Project, Team
from iaso.models.team import TeamType


class TeamCreateSerializer(ModelSerializer):
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault())
    parent = TeamPrimaryKeyRelatedField(
        team_type=TeamType.TEAM_OF_TEAMS, write_only=True, required=False, allow_null=True, queryset=Team.objects.none()
    )
    sub_teams = serializers.PrimaryKeyRelatedField(
        write_only=True, required=False, allow_null=True, queryset=Team.objects.none(), many=True
    )
    manager = serializers.PrimaryKeyRelatedField(
        write_only=True, required=True, allow_null=False, queryset=get_user_model().objects.none()
    )
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.none(), required=True, write_only=True)
    users = serializers.PrimaryKeyRelatedField(
        queryset=get_user_model().objects.none(),
        required=False,
        allow_null=True,
        allow_empty=True,
        many=True,
        write_only=True,
    )

    class Meta:
        model = Team
        fields = [
            "id",
            "name",
            "manager",
            "project",
            "description",
            "type",
            "color",
            "parent",
            "sub_teams",
            "users",
            "created_by",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "name": {"write_only": True},
            "description": {"write_only": True},
            "type": {"write_only": True},
            "color": {"write_only": True},
        }

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        user = getattr(self.context.get("request"), "user", None)
        if user:
            team_queryset = Team.objects.filter_for_user(user)
            self.fields["parent"].queryset = team_queryset
            self.fields["sub_teams"].child_relation.queryset = team_queryset
            self.fields["project"].queryset = Project.objects.filter_on_user_projects(user)

        account = getattr(getattr(user, "iaso_profile", None), "account", None)

        if account:
            user_queryset = get_user_model().objects.filter(iaso_profile__account=account)
            self.fields["manager"].queryset = user_queryset
            self.fields["users"].child_relation.queryset = user_queryset

    @transaction.atomic
    def save(self, **kwargs: Any) -> Team:
        instance = super().save(**kwargs)
        sub_teams = self.validated_data.get("sub_teams", [])

        if not sub_teams:
            return instance

        teams_to_update = []
        for team in sub_teams:
            teams_to_update += team.calculate_paths(force_recalculate=True)

        if teams_to_update:
            unique_teams = {t.pk: t for t in teams_to_update}
            Team.objects.bulk_update(unique_teams.values(), fields=["path"], batch_size=100)

        return instance

    def validate(self, attrs: dict) -> dict:
        validated_data = super().validate(attrs)

        project = validated_data.get("project", None)
        sub_teams = validated_data.get("sub_teams", [])
        users = validated_data.get("users", [])
        team_type = validated_data.get("type", None)

        if any(sub_team.project != project for sub_team in sub_teams):
            raise serializers.ValidationError(_("Sub teams must be in the same project"))

        if sub_teams and users:
            raise serializers.ValidationError(_("Teams cannot have both users and sub teams"))

        expected_type = TeamType.TEAM_OF_USERS if users else TeamType.TEAM_OF_TEAMS if sub_teams else None

        if team_type is not None and expected_type is not None and team_type != expected_type:
            raise serializers.ValidationError(
                _("Incorrect type: expected %(expected_type)s") % {"expected_type": expected_type.label}
            )

        if team_type is None:
            validated_data["type"] = expected_type

        return validated_data
