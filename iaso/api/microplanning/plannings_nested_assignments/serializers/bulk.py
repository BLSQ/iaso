from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from django.contrib.auth import get_user_model
from django.contrib.postgres.expressions import ArraySubquery
from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from hat.audit.models import Modification
from iaso.api.microplanning.assignments.serializers.audit import AuditAssignmentSerializer
from iaso.models import Assignment, OrgUnit, Planning, Team


User = get_user_model()


class AssignmentChangesSerializer(serializers.Serializer):
    created = serializers.IntegerField(read_only=True)
    updated = serializers.IntegerField(read_only=True)
    deleted = serializers.IntegerField(read_only=True)


class BaseAssignmentChangeSerializer(serializers.Serializer):
    """Changes the assignments of org units of a planning given in the context.

    An org unit that is reassigned or unassigned loses the assignments made below it:
    they were made by its previous assignee.
    """

    org_unit_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)

    @property
    def planning(self) -> Planning:
        return self.context["planning"]

    @property
    def requester(self):
        return self.context["request"].user

    def validate_org_unit_ids(self, org_unit_ids: list[int]) -> list[OrgUnit]:
        org_unit_ids = list(dict.fromkeys(org_unit_ids))
        org_units = list(
            OrgUnit.objects.filter_for_user(self.requester)
            .descendants(self.planning.org_unit)
            .filter(id__in=org_unit_ids)
            .only("id", "parent_id", "path")
        )
        unknown_ids = set(org_unit_ids) - {org_unit.id for org_unit in org_units}
        if unknown_ids:
            raise serializers.ValidationError(
                _("Org units not below the planning target geography: %(ids)s")
                % {"ids": ", ".join(str(org_unit_id) for org_unit_id in sorted(unknown_ids))}
            )
        return org_units

    def _audit(self, assignments: Iterable[Assignment], past_values: dict[int, list[dict]]) -> None:
        request = self.context["request"]
        Modification.objects.bulk_create(
            Modification(
                user=self.requester,
                past_value=past_values.get(assignment.id, []),
                new_value=[AuditAssignmentSerializer(assignment).data],
                content_object=assignment,
                source=f"API {request.method} {request.path}",
            )
            for assignment in assignments
        )

    def _soft_delete(self, assignments: list[Assignment]) -> None:
        past_values = {assignment.id: [AuditAssignmentSerializer(assignment).data] for assignment in assignments}
        now = timezone.now()
        for assignment in assignments:
            assignment.deleted_at = assignment.updated_at = now
        Assignment.objects.bulk_update(assignments, ["deleted_at", "updated_at"])
        self._audit(assignments, past_values)

    def _get_assignments_below(self, org_units: list[OrgUnit]) -> list[Assignment]:
        org_unit_ids = [org_unit.id for org_unit in org_units]
        paths = ArraySubquery(OrgUnit.objects.filter(id__in=org_unit_ids).values("path"))
        return list(
            Assignment.objects.filter(planning=self.planning, org_unit__path__descendants=paths).exclude(
                org_unit_id__in=org_unit_ids
            )
        )


class AssignOrgUnitsSerializer(BaseAssignmentChangeSerializer):
    """Assigns org units to a team or a user.

    The assignee must be a direct member (sub-team or user) of the team owning the parent of each org unit:
    the planning team for the children of the target geography, the team assigned to the parent otherwise.
    """

    team = serializers.PrimaryKeyRelatedField(queryset=Team.objects.none(), required=False, allow_null=True)
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.none(), required=False, allow_null=True)

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            self.fields["team"].queryset = Team.objects.filter_for_user(request.user)
            self.fields["user"].queryset = User.objects.filter(iaso_profile__account=request.user.iaso_profile.account)

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

    def save(self, **kwargs: Any) -> dict[str, int]:
        org_units: list[OrgUnit] = self.validated_data["org_unit_ids"]
        team, user = self.validated_data.get("team"), self.validated_data.get("user")
        assignee_ids = (team.id if team else None, user.id if user else None)
        with transaction.atomic():
            assignment_by_org_unit_id = {
                assignment.org_unit_id: assignment
                for assignment in Assignment.objects.select_for_update().filter(
                    planning=self.planning, org_unit__in=org_units
                )
            }
            reassigned = [
                assignment
                for assignment in assignment_by_org_unit_id.values()
                if (assignment.team_id, assignment.user_id) != assignee_ids
            ]
            reassigned_org_unit_ids = {assignment.org_unit_id for assignment in reassigned}
            assignments_below = self._get_assignments_below(
                [org_unit for org_unit in org_units if org_unit.id in reassigned_org_unit_ids]
            )

            past_values = {assignment.id: [AuditAssignmentSerializer(assignment).data] for assignment in reassigned}
            now = timezone.now()
            for assignment in reassigned:
                assignment.team, assignment.user, assignment.updated_at = team, user, now
            Assignment.objects.bulk_update(reassigned, ["team", "user", "updated_at"])
            self._audit(reassigned, past_values)

            created = Assignment.objects.bulk_create(
                Assignment(planning=self.planning, org_unit=org_unit, team=team, user=user, created_by=self.requester)
                for org_unit in org_units
                if org_unit.id not in assignment_by_org_unit_id
            )
            self._audit(created, {})

            self._soft_delete(assignments_below)
        return {"created": len(created), "updated": len(reassigned), "deleted": len(assignments_below)}


class UnassignOrgUnitsSerializer(BaseAssignmentChangeSerializer):
    """Removes the assignments of org units, and the assignments made below them."""

    def save(self, **kwargs: Any) -> dict[str, int]:
        org_units: list[OrgUnit] = self.validated_data["org_unit_ids"]
        with transaction.atomic():
            assignments = list(
                Assignment.objects.select_for_update().filter(planning=self.planning, org_unit__in=org_units)
            )
            assignments_below = self._get_assignments_below(org_units)
            self._soft_delete(assignments + assignments_below)
        return {"created": 0, "updated": 0, "deleted": len(assignments) + len(assignments_below)}
