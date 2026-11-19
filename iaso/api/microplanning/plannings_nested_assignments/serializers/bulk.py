from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from django.contrib.auth import get_user_model
from django.contrib.postgres.expressions import ArraySubquery
from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from iaso.api.microplanning.assignments.serializers.audit import AuditAssignmentSerializer
from iaso.api.microplanning.plannings.utils import PlanningOrgUnitTreeQuerySetBuilder
from iaso.api.microplanning.plannings_nested_assignments.serializers.fields import BulkPrimaryKeyRelatedField
from iaso.models import Assignment, OrgUnit, Planning, Team
from iaso.models.microplanning.assignments import AssignmentQuerySet
from iaso.models.org_unit import OrgUnitQuerySet


User = get_user_model()

BULK_BATCH_SIZE = 100


@dataclass
class AssignmentChange:
    assignment: Assignment
    past_value: list[dict]

    @classmethod
    def before_update(cls, assignment: Assignment) -> AssignmentChange:
        return cls(assignment, [AuditAssignmentSerializer(assignment).data])


class BaseAssignmentChangeSerializer(serializers.ModelSerializer):
    """Changes the assignments of org units, given the assignments of the planning as instance.

    An org unit that is reassigned or unassigned loses the assignments made below it:
    they were made by its previous assignee.
    """

    org_unit_ids = BulkPrimaryKeyRelatedField(
        many=True, queryset=OrgUnit.objects.none(), allow_empty=False, write_only=True
    )
    updated_at = serializers.HiddenField(default=timezone.now)
    created = serializers.ListField(child=serializers.IntegerField(), read_only=True)
    updated = serializers.ListField(child=serializers.IntegerField(), read_only=True)
    deleted = serializers.ListField(child=serializers.IntegerField(), read_only=True)

    class Meta:
        model = Assignment
        fields = ["org_unit_ids", "updated_at", "created", "updated", "deleted"]

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.changes: list[AssignmentChange] = []
        if self.requester and self.requester.is_authenticated and self.planning:
            self.fields["org_unit_ids"].child_relation.queryset = self._get_assignable_org_units(
                self.requester, self.planning
            )

    @staticmethod
    def _get_assignable_org_units(user, planning: Planning) -> OrgUnitQuerySet:
        """Org units below the planning target geography that its configs keep in the planning tree."""
        root = planning.org_unit
        root_level = len(str(root.path).split("."))
        configs = planning.configs.prefetch_related("org_unit_types", "org_unit_groups")
        return (
            PlanningOrgUnitTreeQuerySetBuilder()
            .build_queryset(
                queryset=OrgUnit.objects.filter_for_user(user),
                root=root,
                processed_levels={root_level + config.level - 1 for config in configs},
                configs=configs,
            )
            .exclude(pk=root.pk)
            .only("id", "parent_id", "path")
        )

    @property
    def planning(self) -> Planning | None:
        return self.context.get("planning")

    @property
    def requester(self):
        request = self.context.get("request")
        return request.user if request else None

    def _soft_delete(self, assignments: list[Assignment], now: datetime) -> None:
        self.changes += [AssignmentChange.before_update(assignment) for assignment in assignments]
        for assignment in assignments:
            assignment.deleted_at = assignment.updated_at = now
        Assignment.objects.bulk_update(assignments, ["deleted_at", "updated_at"], batch_size=BULK_BATCH_SIZE)

    @staticmethod
    def _get_assignments_below(assignments: AssignmentQuerySet, org_units: list[OrgUnit]) -> list[Assignment]:
        org_unit_ids = [org_unit.id for org_unit in org_units]
        paths = ArraySubquery(OrgUnit.objects.filter(id__in=org_unit_ids).values("path"))
        return list(assignments.filter(org_unit__path__descendants=paths).exclude(org_unit_id__in=org_unit_ids))


class AssignOrgUnitsSerializer(BaseAssignmentChangeSerializer):
    """Assigns org units to a team or a user.

    The assignee must be a direct member (sub-team or user) of the team owning the parent of each org unit:
    the planning team for the children of the target geography, the team assigned to the parent otherwise.
    """

    class Meta(BaseAssignmentChangeSerializer.Meta):
        fields = [*BaseAssignmentChangeSerializer.Meta.fields, "team", "user"]
        extra_kwargs = {"team": {"write_only": True}, "user": {"write_only": True}}

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.fields["team"].queryset = Team.objects.none()
        self.fields["user"].queryset = User.objects.none()
        if self.requester and self.requester.is_authenticated:
            self.fields["team"].queryset = Team.objects.filter_for_user(self.requester)
            account = getattr(getattr(self.requester, "iaso_profile", None), "account", None)
            if account:
                self.fields["user"].queryset = User.objects.filter(iaso_profile__account=account)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        team, user = attrs.get("team"), attrs.get("user")
        if bool(team) == bool(user):
            raise serializers.ValidationError(_("Exactly one of team or user must be set."))
        self._validate_assignee_is_member(attrs["org_unit_ids"], team, user)
        return attrs

    def _get_owner_team_id_by_org_unit_id(self, org_units: list[OrgUnit]) -> dict[int, int | None]:
        team_id_by_parent_id = dict(
            Assignment.objects.filter(
                planning=self.planning,
                org_unit_id__in={org_unit.parent_id for org_unit in org_units},
                team__isnull=False,
            ).values_list("org_unit_id", "team_id")
        )
        team_id_by_parent_id[self.planning.org_unit_id] = self.planning.team_id
        return {org_unit.id: team_id_by_parent_id.get(org_unit.parent_id) for org_unit in org_units}

    def _validate_assignee_is_member(self, org_units: list[OrgUnit], team: Team | None, user) -> None:
        owner_team_id_by_org_unit_id = self._get_owner_team_id_by_org_unit_id(org_units)
        if None in owner_team_id_by_org_unit_id.values():
            raise serializers.ValidationError(
                {"org_unit_ids": _("The parent of each org unit must be assigned to a team.")}
            )
        owner_team_ids = set(owner_team_id_by_org_unit_id.values())
        if team:
            is_member = owner_team_ids == {team.parent_id}
        else:
            teams_of_user = set(
                Team.users.through.objects.filter(team_id__in=owner_team_ids, user=user).values_list(
                    "team_id", flat=True
                )
            )
            is_member = owner_team_ids <= teams_of_user
        if not is_member:
            raise serializers.ValidationError(
                _("The assignee must be a member of the team owning the parent of each org unit.")
            )

    def update(self, instance: AssignmentQuerySet, validated_data: dict[str, Any]) -> dict[str, list[int]]:
        org_units: list[OrgUnit] = validated_data["org_unit_ids"]
        team, user, now = validated_data.get("team"), validated_data.get("user"), validated_data["updated_at"]
        assignee_ids = (team.id if team else None, user.id if user else None)
        with transaction.atomic():
            assignment_by_org_unit_id = {
                assignment.org_unit_id: assignment
                for assignment in instance.select_for_update().filter(org_unit__in=org_units)
            }
            reassigned = [
                assignment
                for assignment in assignment_by_org_unit_id.values()
                if (assignment.team_id, assignment.user_id) != assignee_ids
            ]
            reassigned_org_unit_ids = {assignment.org_unit_id for assignment in reassigned}
            assignments_below = self._get_assignments_below(
                instance, [org_unit for org_unit in org_units if org_unit.id in reassigned_org_unit_ids]
            )

            self.changes += [AssignmentChange.before_update(assignment) for assignment in reassigned]
            for assignment in reassigned:
                assignment.team, assignment.user, assignment.updated_at = team, user, now
            Assignment.objects.bulk_update(reassigned, ["team", "user", "updated_at"], batch_size=BULK_BATCH_SIZE)

            created = Assignment.objects.bulk_create(
                (
                    Assignment(
                        planning=self.planning, org_unit=org_unit, team=team, user=user, created_by=self.requester
                    )
                    for org_unit in org_units
                    if org_unit.id not in assignment_by_org_unit_id
                ),
                batch_size=BULK_BATCH_SIZE,
            )
            self.changes += [AssignmentChange(assignment, []) for assignment in created]

            self._soft_delete(assignments_below, now)
        return {
            "created": _org_unit_ids(created),
            "updated": _org_unit_ids(reassigned),
            "deleted": _org_unit_ids(assignments_below),
        }


class UnassignOrgUnitsSerializer(BaseAssignmentChangeSerializer):
    """Removes the assignments of org units, and the assignments made below them."""

    def update(self, instance: AssignmentQuerySet, validated_data: dict[str, Any]) -> dict[str, list[int]]:
        org_units: list[OrgUnit] = validated_data["org_unit_ids"]
        with transaction.atomic():
            assignments = list(instance.select_for_update().filter(org_unit__in=org_units))
            assignments_below = self._get_assignments_below(instance, org_units)
            self._soft_delete(assignments + assignments_below, validated_data["updated_at"])
        return {"created": [], "updated": [], "deleted": _org_unit_ids(assignments + assignments_below)}


def _org_unit_ids(assignments: list[Assignment]) -> list[int]:
    return sorted(assignment.org_unit_id for assignment in assignments)
