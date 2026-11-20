from __future__ import annotations

from django.urls import reverse
from rest_framework import status

from hat.audit.models import Modification
from iaso.models import Assignment, Group, OrgUnit, OrgUnitType, Planning, PlanningConfig, Team
from iaso.permissions.core_permissions import CORE_PLANNING_READ_PERMISSION, CORE_PLANNING_WRITE_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class NestedPlanningAssignmentBulkAPITestCase(SwaggerTestCaseMixin, APITestCase):
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

        [cls.other_account, _, other_source_version, other_project] = cls.create_account_datasource_version_project(
            "Other data source", "Other account", "Other project"
        )
        cls.other_account_agent = cls.create_user_with_profile(username="other_agent", account=cls.other_account)
        cls.team_a.users.add(cls.other_account_agent)
        cls.other_account_team = Team.objects.create(
            name="Other account", project=other_project, manager=cls.other_account_agent, parent=cls.root_team
        )
        cls.other_account_district = OrgUnit.objects.create(
            name="Other account district",
            parent=cls.root,
            version=other_source_version,
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.other_account_planning = Planning.objects.create(
            name="Other planning", project=other_project, team=cls.other_account_team, org_unit=cls.root
        )

    @classmethod
    def create_org_unit(cls, name: str, parent: OrgUnit | None = None) -> OrgUnit:
        return OrgUnit.objects.create(
            name=name, parent=parent, version=cls.source_version, validation_status=OrgUnit.VALIDATION_VALID
        )

    def setUp(self) -> None:
        self.client.force_authenticate(self.writer)

    def post(self, action: str, data: dict, planning_pk: int | None = None):
        url = reverse(
            f"planning-nested-assignments-{action}", kwargs={"parent_lookup_pk": planning_pk or self.planning.pk}
        )
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
        self.assertEqual(
            res.json(), {"created": sorted([self.district_a.pk, self.district_b.pk]), "updated": [], "deleted": []}
        )
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

    def test_assign_rejects_org_units_excluded_by_the_planning_config_and_those_below_them(self):
        district_type = OrgUnitType.objects.create(name="District")
        OrgUnit.objects.filter(pk=self.district_a.pk).update(org_unit_type=district_type)
        config = PlanningConfig.objects.create(planning=self.planning, level=1)
        config.org_unit_types.set([district_type])
        zone_b1 = self.create_org_unit("Zone B1", parent=self.district_b)
        self.assign([self.district_a], team=self.team_a)

        for org_unit in [self.district_b, zone_b1]:
            with self.subTest(org_unit=org_unit.name):
                res = self.post("assign", {"org_unit_ids": [org_unit.pk], "team": self.team_b.pk})

                self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
                self.assertIn("org_unit_ids", res.json())

        res = self.post("assign", {"org_unit_ids": [self.zone_a1.pk], "user": self.agent_a.pk})

        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_assign_rejects_org_units_outside_the_groups_of_the_planning_config(self):
        group = Group.objects.create(name="Targeted", source_version=self.source_version)
        group.org_units.set([self.district_a])
        config = PlanningConfig.objects.create(planning=self.planning, level=1)
        config.org_unit_groups.set([group])

        res = self.post("assign", {"org_unit_ids": [self.district_b.pk], "team": self.team_a.pk})
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertIn("org_unit_ids", res.json())

        res = self.post("assign", {"org_unit_ids": [self.district_a.pk], "team": self.team_a.pk})
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_assign_rejects_org_unit_team_and_user_from_another_account(self):
        self.assign([self.district_a], team=self.team_a)
        cases = {
            "org unit": ({"org_unit_ids": [self.other_account_district.pk], "team": self.team_a.pk}, "org_unit_ids"),
            "team": ({"org_unit_ids": [self.district_b.pk], "team": self.other_account_team.pk}, "team"),
            "user": ({"org_unit_ids": [self.zone_a1.pk], "user": self.other_account_agent.pk}, "user"),
        }
        for name, (data, error_field) in cases.items():
            with self.subTest(name):
                res = self.post("assign", data)

                self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
                self.assertIn(error_field, res.json())

    def test_unassign_rejects_org_units_from_another_account(self):
        res = self.post("unassign", {"org_unit_ids": [self.other_account_district.pk]})

        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertIn("org_unit_ids", res.json())

    def test_assign_rejects_soft_deleted_team(self):
        self.team_a.delete()

        res = self.post("assign", {"org_unit_ids": [self.district_a.pk], "team": self.team_a.pk})

        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertIn("team", res.json())

    def test_assign_ignores_soft_deleted_assignment_of_the_parent(self):
        """A parent whose assignment was soft-deleted no longer has an owner team to assign its children."""
        self.assign([self.district_a], team=self.team_a)
        Assignment.objects.get(org_unit=self.district_a).delete()

        res = self.post("assign", {"org_unit_ids": [self.zone_a1.pk], "user": self.agent_a.pk})

        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertIn("org_unit_ids", res.json())

    def test_assign_and_unassign_return_404_for_missing_soft_deleted_or_other_account_planning(self):
        deleted_planning = Planning.objects.create(
            name="Deleted", project=self.project, team=self.root_team, org_unit=self.root
        )
        deleted_planning.delete()
        missing_pk = Planning.objects_include_deleted.order_by("-pk").first().pk + 1
        for action in ["assign", "unassign"]:
            for name, planning_pk in {
                "missing": missing_pk,
                "soft-deleted": deleted_planning.pk,
                "other account": self.other_account_planning.pk,
            }.items():
                with self.subTest(action=action, planning=name):
                    res = self.post(action, {"org_unit_ids": [self.district_a.pk], "team": self.team_a.pk}, planning_pk)

                    self.assertJSONResponse(res, status.HTTP_404_NOT_FOUND)

    def test_assign_ignores_duplicate_org_unit_ids(self):
        res = self.post("assign", {"org_unit_ids": [self.district_a.pk, self.district_a.pk], "team": self.team_a.pk})

        self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertEqual(res.json(), {"created": [self.district_a.pk], "updated": [], "deleted": []})

    def test_assign_rejects_org_unit_ids_that_are_not_integers(self):
        res = self.post("assign", {"org_unit_ids": ["abc"], "team": self.team_a.pk})

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
        self.assertEqual(
            res.json(),
            {"created": [], "updated": [self.district_a.pk], "deleted": sorted([self.zone_a1.pk, self.zone_a2.pk])},
        )
        self.assertEqual(self.get_assignees(), {"District A": (self.team_b.pk, None)})
        self.assertEqual(Assignment.objects_only_deleted.filter(planning=self.planning).count(), 2)

    def test_assign_to_the_current_assignee_keeps_the_assignments_made_below(self):
        self.assign([self.district_a], team=self.team_a)
        self.assign([self.zone_a1], user=self.agent_a)

        res = self.post("assign", {"org_unit_ids": [self.district_a.pk], "team": self.team_a.pk})

        self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertEqual(res.json(), {"created": [], "updated": [], "deleted": []})
        self.assertEqual(len(self.get_assignees()), 2)

    def test_unassign_removes_the_assignments_and_those_made_below(self):
        self.assign([self.district_a, self.district_b], team=self.team_a)
        self.assign([self.zone_a1], user=self.agent_a)

        res = self.post("unassign", {"org_unit_ids": [self.district_a.pk]})

        self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertEqual(
            res.json(), {"created": [], "updated": [], "deleted": sorted([self.district_a.pk, self.zone_a1.pk])}
        )
        self.assertEqual(self.get_assignees(), {"District B": (self.team_a.pk, None)})

    def test_assign_and_unassign_record_the_changes_in_the_audit_log(self):
        self.assign([self.district_a], team=self.team_a)
        self.assign([self.zone_a1], user=self.agent_a)

        self.post("assign", {"org_unit_ids": [self.district_a.pk, self.district_b.pk], "team": self.team_b.pk})
        self.post("unassign", {"org_unit_ids": [self.district_b.pk]})

        # Reassigned district A, created district B, cleared zone A1, then unassigned district B.
        self.assertEqual(Modification.objects.filter(user=self.writer).count(), 4)

    def test_assign_and_unassign_require_an_authenticated_user_with_the_planning_write_permission(self):
        no_permission_user = self.create_user_with_profile(username="no_permission", account=self.account)
        expected_status_by_user = {
            "anonymous": (None, status.HTTP_401_UNAUTHORIZED),
            "no permission": (no_permission_user, status.HTTP_403_FORBIDDEN),
            "read permission": (self.reader, status.HTTP_403_FORBIDDEN),
            "write permission": (self.writer, status.HTTP_200_OK),
        }
        for action in ["assign", "unassign"]:
            for name, (user, expected_status) in expected_status_by_user.items():
                with self.subTest(action=action, user=name):
                    self.client.force_authenticate(user)

                    res = self.post(action, {"org_unit_ids": [self.district_a.pk], "team": self.team_a.pk})

                    self.assertEqual(res.status_code, expected_status)

    def test_assign_request_and_response_match_the_openapi_schema(self):
        body = {"org_unit_ids": [self.district_a.pk], "team": self.team_a.pk}
        self.assertResponseCompliantToSwagger(body, "AssignOrgUnitsRequest")

        res = self.post("assign", body)

        self.assertResponseCompliantToSwagger(self.assertJSONResponse(res, status.HTTP_200_OK), "AssignOrgUnits")

    def test_unassign_request_and_response_match_the_openapi_schema(self):
        self.assign([self.district_a], team=self.team_a)
        body = {"org_unit_ids": [self.district_a.pk]}
        self.assertResponseCompliantToSwagger(body, "UnassignOrgUnitsRequest")

        res = self.post("unassign", body)

        self.assertResponseCompliantToSwagger(self.assertJSONResponse(res, status.HTTP_200_OK), "UnassignOrgUnits")

    def test_assign_num_queries(self):
        self.assign([self.district_a], team=self.team_a)
        self.assign([self.zone_a1], user=self.agent_a)

        with self.assertNumQueries(18):
            # 1-2. user permissions
            # 3. planning with its target geography
            # 4. requester's org unit restrictions
            # 5. planning configs
            # 6. assignable org units (recursive tree)
            # 7. team
            # 8. teams owning the parents
            # 9-10. savepoints (view and serializer transactions)
            # 11. lock the assignments of the org units
            # 12. assignments below the reassigned org units
            # 13. reassign
            # 14. create
            # 15. soft-delete the assignments below
            # 16. release serializer savepoint
            # 17. audit
            # 18. release view savepoint
            res = self.post(
                "assign", {"org_unit_ids": [self.district_a.pk, self.district_b.pk], "team": self.team_b.pk}
            )

        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_unassign_num_queries(self):
        self.assign([self.district_a, self.district_b], team=self.team_a)
        self.assign([self.zone_a1], user=self.agent_a)

        with self.assertNumQueries(14):
            # 1-2. user permissions
            # 3. planning with its target geography
            # 4. requester's org unit restrictions
            # 5. planning configs
            # 6. assignable org units (recursive tree)
            # 7-8. savepoints (view and serializer transactions)
            # 9. lock the assignments of the org units
            # 10. assignments below them
            # 11. soft-delete
            # 12. release serializer savepoint
            # 13. audit
            # 14. release view savepoint
            res = self.post("unassign", {"org_unit_ids": [self.district_a.pk, self.district_b.pk]})

        self.assertJSONResponse(res, status.HTTP_200_OK)
