from typing import Any, Sequence

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.teams.serializer_fields import TeamPrimaryKeyRelatedField
from iaso.models import Project, Team
from iaso.models.team import TeamType


class TeamUpdateSerializer(ModelSerializer):
    updated_by = serializers.HiddenField(default=serializers.CurrentUserDefault())
    parent = TeamPrimaryKeyRelatedField(
        team_type=TeamType.TEAM_OF_TEAMS, write_only=True, required=False, allow_null=True, queryset=Team.objects.none()
    )
    sub_teams = serializers.PrimaryKeyRelatedField(
        write_only=True, required=False, allow_null=False, queryset=Team.objects.none(), many=True
    )
    manager = serializers.PrimaryKeyRelatedField(
        write_only=True, required=True, allow_null=False, queryset=get_user_model().objects.none()
    )
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.none(), required=True)
    users = serializers.PrimaryKeyRelatedField(
        queryset=get_user_model().objects.none(), required=False, allow_null=False, allow_empty=True, many=True
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
            "updated_by",
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

    def validate_parent(self, value: Team) -> Team:
        p = value
        while p:
            if p == self.instance:
                raise serializers.ValidationError(_("Cannot create loop in teams tree"))
            p = p.parent
        return value

    def validate_sub_teams(self, values: Sequence[Team]) -> Sequence[Team]:
        def recursive_check(instance: Team, children: Sequence[Team]) -> None:
            for child in children:
                if instance == child:
                    raise serializers.ValidationError(_("Cannot create loop in teams tree"))
                recursive_check(instance, child.sub_teams.all())

        if not isinstance(self.instance, Team):
            raise ValueError

        recursive_check(self.instance, values)
        return values

    @transaction.atomic
    def save(self, **kwargs: Any) -> Team:
        if not isinstance(self.instance, Team):
            raise ValueError

        old_sub_teams_ids = list(self.instance.sub_teams.values_list("id", flat=True))
        super().save(**kwargs)
        new_sub_teams_ids = list(self.instance.sub_teams.values_list("id", flat=True))

        if set(old_sub_teams_ids) != set(new_sub_teams_ids):
            team_changed_qs = Team.objects.filter(id__in=new_sub_teams_ids + old_sub_teams_ids)
            teams_to_update = []
            for team in team_changed_qs:
                teams_to_update += team.calculate_paths(force_recalculate=True)

            if teams_to_update:
                unique_teams = {t.pk: t for t in teams_to_update}.values()
                Team.objects.bulk_update(unique_teams, ["path"], batch_size=100)

        return self.instance

    def validate(self, attrs: dict) -> dict:
        validated_data = super().validate(attrs)

        project = validated_data.get("project", self.instance.project)
        sub_teams = validated_data.get("sub_teams", self.instance.sub_teams.all())
        users = validated_data.get("users", self.instance.users.all())
        team_type = validated_data.get("type", self.instance.type)

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
