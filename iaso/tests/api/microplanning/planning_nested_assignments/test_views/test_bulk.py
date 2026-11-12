from __future__ import annotations

from django.urls import reverse
from rest_framework import status

from hat.audit.models import Modification
from iaso.models import Assignment, OrgUnit, Planning, Team
from iaso.permissions.core_permissions import CORE_PLANNING_READ_PERMISSION, CORE_PLANNING_WRITE_PERMISSION
from iaso.test import APITestCase


class NestedPlanningAssignmentBulkAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()
        [cls.account, cls.data_source, cls.source_version, cls.project] = cls.create_account_datasource_version_project(
            "Data source", "Account", "Project"
        )
        cls.writer = cls.create_user_with_profile(
            username="writer", account=cls.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        cls.reader = cls.create_user_with_profile(
            username="reader", account=cls.account, permissions=[CORE_PLANNING_READ_PERMISSION]
        )
        cls.agent_a = cls.create_user_with_profile(username="agent_a", account=cls.account)
        cls.agent_b = cls.create_user_with_profile(username="agent_b", account=cls.account)

        cls.root_team = Team.objects.create(name="Root", project=cls.project, manager=cls.writer)
        cls.team_a = Team.objects.create(name="A", project=cls.project, manager=cls.writer, parent=cls.root_team)
        cls.team_a.users.set([cls.agent_a])
        cls.team_b = Team.objects.create(name="B", project=cls.project, manager=cls.writer, parent=cls.root_team)
        cls.team_b.users.set([cls.agent_b])
        cls.other_team = Team.objects.create(name="Other", project=cls.project, manager=cls.writer)

        cls.root = cls.create_org_unit("Root")
        cls.district_a = cls.create_org_unit("District A", parent=cls.root)
        cls.district_b = cls.create_org_unit("District B", parent=cls.root)
        cls.zone_a1 = cls.create_org_unit("Zone A1", parent=cls.district_a)
        cls.zone_a2 = cls.create_org_unit("Zone A2", parent=cls.district_a)
        cls.outside = cls.create_org_unit("Outside")

        cls.planning = Planning.objects.create(
            name="Planning", project=cls.project, team=cls.root_team, org_unit=cls.root
        )

    @classmethod
    def create_org_unit(cls, name: str, parent: OrgUnit | None = None) -> OrgUnit:
        return OrgUnit.objects.create(
            name=name, parent=parent, version=cls.source_version, validation_status=OrgUnit.VALIDATION_VALID
        )

    def setUp(self) -> None:
        self.client.force_authenticate(self.writer)

    def post(self, action: str, data: dict):
        url = reverse(f"planning-nested-assignments-{action}", kwargs={"parent_lookup_pk": self.planning.pk})
        return self.client.post(url, data=data, format="json")

    def assign(self, org_units: list[OrgUnit], **assignee) -> Assignment:
        Assignment.objects.bulk_create(
            Assignment(planning=self.planning, org_unit=org_unit, **assignee) for org_unit in org_units
        )

    def get_assignees(self) -> dict[str, tuple[int | None, int | None]]:
        return {
            assignment.org_unit.name: (assignment.team_id, assignment.user_id)
            for assignment in Assignment.objects.filter(planning=self.planning).select_related("org_unit")
        }

    def test_assign_children_of_target_geography_to_sub_team_creates_assignments(self):
        res = self.post("assign", {"org_unit_ids": [self.district_a.pk, self.district_b.pk], "team": self.team_a.pk})

        self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertEqual(res.json(), {"created": 2, "updated": 0, "deleted": 0})
        self.assertEqual(
            self.get_assignees(),
            {"District A": (self.team_a.pk, None), "District B": (self.team_a.pk, None)},
        )

    def test_assign_to_user_member_of_team_owning_the_parent(self):
        self.assign([self.district_a], team=self.team_a)

        res = self.post("assign", {"org_unit_ids": [self.zone_a1.pk], "user": self.agent_a.pk})

        self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertEqual(self.get_assignees()["Zone A1"], (None, self.agent_a.pk))

    def test_assign_rejects_team_that_is_not_a_sub_team_of_the_parent_owner(self):
        res = self.post("assign", {"org_unit_ids": [self.district_a.pk], "team": self.other_team.pk})

        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.get_assignees(), {})

    def test_assign_rejects_user_that_is_not_a_member_of_the_parent_owner(self):
        self.assign([self.district_a], team=self.team_a)

        res = self.post("assign", {"org_unit_ids": [self.zone_a1.pk], "user": self.agent_b.pk})

        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

    def test_assign_rejects_org_unit_whose_parent_is_not_assigned_to_a_team(self):
        res = self.post("assign", {"org_unit_ids": [self.zone_a1.pk], "user": self.agent_a.pk})

        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertIn("org_unit_ids", res.json())

    def test_assign_rejects_target_geography_and_org_units_outside_it(self):
        for org_unit in [self.root, self.outside]:
            with self.subTest(org_unit=org_unit.name):
                res = self.post("assign", {"org_unit_ids": [org_unit.pk], "team": self.team_a.pk})

                self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
                self.assertIn("org_unit_ids", res.json())

    def test_assign_requires_exactly_one_of_team_or_user(self):
        for assignee in [{}, {"team": self.team_a.pk, "user": self.agent_a.pk}]:
            with self.subTest(assignee=assignee):
                res = self.post("assign", {"org_unit_ids": [self.district_a.pk], **assignee})

                self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

    def test_reassign_moves_the_org_unit_and_clears_the_assignments_made_below_it(self):
        self.assign([self.district_a], team=self.team_a)
        self.assign([self.zone_a1, self.zone_a2], user=self.agent_a)

        res = self.post("assign", {"org_unit_ids": [self.district_a.pk], "team": self.team_b.pk})

        self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertEqual(res.json(), {"created": 0, "updated": 1, "deleted": 2})
        self.assertEqual(self.get_assignees(), {"District A": (self.team_b.pk, None)})
        self.assertEqual(Assignment.objects_only_deleted.filter(planning=self.planning).count(), 2)

    def test_assign_to_the_current_assignee_keeps_the_assignments_made_below(self):
        self.assign([self.district_a], team=self.team_a)
        self.assign([self.zone_a1], user=self.agent_a)

        res = self.post("assign", {"org_unit_ids": [self.district_a.pk], "team": self.team_a.pk})

        self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertEqual(res.json(), {"created": 0, "updated": 0, "deleted": 0})
        self.assertEqual(len(self.get_assignees()), 2)

    def test_unassign_removes_the_assignments_and_those_made_below(self):
        self.assign([self.district_a, self.district_b], team=self.team_a)
        self.assign([self.zone_a1], user=self.agent_a)

        res = self.post("unassign", {"org_unit_ids": [self.district_a.pk]})

        self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertEqual(res.json(), {"created": 0, "updated": 0, "deleted": 2})
        self.assertEqual(self.get_assignees(), {"District B": (self.team_a.pk, None)})

    def test_assign_and_unassign_record_the_changes_in_the_audit_log(self):
        self.assign([self.district_a], team=self.team_a)
        self.assign([self.zone_a1], user=self.agent_a)

        self.post("assign", {"org_unit_ids": [self.district_a.pk, self.district_b.pk], "team": self.team_b.pk})
        self.post("unassign", {"org_unit_ids": [self.district_b.pk]})

        # Reassigned district A, created district B, cleared zone A1, then unassigned district B.
        self.assertEqual(Modification.objects.filter(user=self.writer).count(), 4)

    def test_assign_and_unassign_require_the_planning_write_permission(self):
        self.client.force_authenticate(self.reader)
        for action in ["assign", "unassign"]:
            with self.subTest(action=action):
                res = self.post(action, {"org_unit_ids": [self.district_a.pk], "team": self.team_a.pk})

                self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)
