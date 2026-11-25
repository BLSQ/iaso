from __future__ import annotations

from typing import Any

from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings

from hat.audit.models import Modification
from iaso.models import Assignment, Group, OrgUnit, OrgUnitType, Planning, PlanningConfig, Team
from iaso.permissions.core_permissions import CORE_PLANNING_READ_PERMISSION, CORE_PLANNING_WRITE_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class NestedPlanningUnassignAPITestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()
        [cls.account, cls.data_source, cls.source_version, cls.project] = cls.create_account_datasource_version_project(
            "Data source", "Account", "Project"
        )
        cls.user_no_perm = cls.create_user_with_profile(username="user_no_perm", account=cls.account, permissions=[])
        cls.writer = cls.create_user_with_profile(
            username="writer", account=cls.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        cls.reader = cls.create_user_with_profile(
            username="reader", account=cls.account, permissions=[CORE_PLANNING_READ_PERMISSION]
        )
        cls.superuser = cls.create_user_with_profile(username="superuser", account=cls.account, is_superuser=True)
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

    def assertValidBody(self, data: Any) -> None:
        self.assertResponseCompliantToSwagger(data, "AssignRequest")

    def assertValidResponse(self, data: Any) -> None:
        self.assertResponseCompliantToSwagger(data, "Assign")

    def put(self, data: dict | None = None, planning_pk: int | None = None):
        if not data:
            data = {}
        url = reverse(
            "planning-nested-assignments-assign", kwargs={"parent_lookup_pk": planning_pk or self.planning.pk}
        )
        return self.client.put(url, data=data)

    def assign(self, org_units: list[OrgUnit], **assignee: dict) -> list[Assignment]:
        return Assignment.objects.bulk_create(
            Assignment(planning=self.planning, org_unit=org_unit, **assignee) for org_unit in org_units
        )

    def get_assignees(self) -> dict[str, tuple[int | None, int | None]]:
        return {
            assignment.org_unit.name: (assignment.team_id, assignment.user_id)
            for assignment in Assignment.objects.filter(planning=self.planning).select_related("org_unit")
        }

    def test_permissions(self):
        res = self.put()
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user_no_perm)
        res = self.put()
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.reader)
        res = self.put()
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.writer)
        res = self.put()
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.superuser)
        res = self.put()
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_should_raise_404_if_planning_is_deleted_or_does_not_exist(self):
        self.planning.delete()
        self.assertSoftDeleted(self.planning)

        self.client.force_authenticate(self.superuser)
        res = self.put(data={})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        res = self.put(data={}, planning_pk=Planning.objects.all().order_by("-id").first().pk + 1)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_should_raise_404_if_planning_belongs_to_another_account(self):
        self.client.force_authenticate(self.superuser)
        res = self.put(data={}, planning_pk=self.other_account_planning.pk)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_should_raise_a_404_if_planning_is_deprecated(self):
        self.planning.deprecated = True
        self.planning.save()

        self.client.force_authenticate(self.superuser)
        res = self.put(data={})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_validation_requires_exactly_one_team_or_user(self):
        self.client.force_authenticate(self.superuser)

        for assignee in [{}, {"team": self.team_a.pk, "user": self.agent_a.pk}]:
            with self.subTest(assignee=assignee):
                data = {"org_unit_ids": [self.district_a.pk], **assignee}
                self.assertValidBody(data)
                res = self.put(data)

                res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
                self.assertHasError(
                    res_data, api_settings.NON_FIELD_ERRORS_KEY, "Exactly one of team or user must be set."
                )

    def test_validation_rejects_team_that_is_not_a_sub_team_of_the_parent_owner(self):
        self.client.force_authenticate(self.superuser)
        data = {"org_unit_ids": [self.district_a.pk], "team": self.other_team.pk}
        self.assertValidBody(data)
        res = self.put(data)

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data,
            api_settings.NON_FIELD_ERRORS_KEY,
            "The assignee must be a member of the team owning the parent of each org unit.",
        )
        self.assertEqual(self.get_assignees(), {})

    def test_validation_rejects_user_that_is_not_a_member_of_the_parent_owner(self):
        self.client.force_authenticate(self.superuser)

        self.assign([self.district_a], team=self.team_a)

        res = self.put({"org_unit_ids": [self.zone_a1.pk], "user": self.agent_b.pk})

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data,
            api_settings.NON_FIELD_ERRORS_KEY,
            "The assignee must be a member of the team owning the parent of each org unit.",
        )

    def test_validation_rejects_org_unit_whose_parent_is_not_assigned_to_a_team(self):
        self.client.force_authenticate(self.superuser)
        data = {"org_unit_ids": [self.zone_a1.pk], "user": self.agent_a.pk}
        res = self.put(data)

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "org_unit_ids", "The parent of each org unit must be assigned to a team.")

    def test_validation_rejects_target_geography_and_org_units_outside_it(self):
        self.client.force_authenticate(self.superuser)

        for org_unit in [self.root, self.outside]:
            with self.subTest(org_unit=org_unit.name):
                res = self.put({"org_unit_ids": [org_unit.pk], "team": self.team_a.pk})

                res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
                self.assertHasError(res_data, "org_unit_ids", f'Invalid pk "{org_unit.pk}" - object does not exist.')

    def test_validation_rejects_org_units_excluded_by_the_planning_config_and_those_below_them(self):
        self.client.force_authenticate(self.superuser)

        district_type = OrgUnitType.objects.create(name="District")
        OrgUnit.objects.filter(pk=self.district_a.pk).update(org_unit_type=district_type)
        config = PlanningConfig.objects.create(planning=self.planning, level=1)
        config.org_unit_types.set([district_type])
        zone_b1 = self.create_org_unit("Zone B1", parent=self.district_b)
        self.assign([self.district_a], team=self.team_a)

        for org_unit in [self.district_b, zone_b1]:
            with self.subTest(org_unit=org_unit.name):
                res = self.put({"org_unit_ids": [org_unit.pk], "team": self.team_b.pk})

                res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
                self.assertHasError(res_data, "org_unit_ids", f'Invalid pk "{org_unit.pk}" - object does not exist.')

        res = self.put({"org_unit_ids": [self.zone_a1.pk], "user": self.agent_a.pk})

        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_validation_rejects_org_units_outside_the_groups_of_the_planning_config(self):
        self.client.force_authenticate(self.superuser)
        group = Group.objects.create(name="Targeted", source_version=self.source_version)
        group.org_units.set([self.district_a])
        config = PlanningConfig.objects.create(planning=self.planning, level=1)
        config.org_unit_groups.set([group])

        res = self.put({"org_unit_ids": [self.district_b.pk], "team": self.team_a.pk})
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "org_unit_ids", f'Invalid pk "{self.district_b.pk}" - object does not exist.')

        res = self.put({"org_unit_ids": [self.district_a.pk], "team": self.team_a.pk})
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_validation_rejects_soft_deleted_team(self):
        self.client.force_authenticate(self.superuser)
        self.team_a.delete()
        self.assertSoftDeleted(self.team_a)

        res = self.put({"org_unit_ids": [self.district_a.pk], "team": self.team_a.pk})

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "team", f'Invalid pk "{self.team_a.pk}" - object does not exist.')

    def test_validation_rejects_org_unit_team_and_user_from_another_account(self):
        self.client.force_authenticate(self.superuser)
        self.assign([self.district_a], team=self.team_a)
        cases = {
            "org unit": ({"org_unit_ids": [self.other_account_district.pk], "team": self.team_a.pk}, "org_unit_ids"),
            "team": ({"org_unit_ids": [self.district_b.pk], "team": self.other_account_team.pk}, "team"),
            "user": ({"org_unit_ids": [self.zone_a1.pk], "user": self.other_account_agent.pk}, "user"),
        }
        for name, (data, error_field) in cases.items():
            with self.subTest(name):
                res = self.put(data)

                res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
                self.assertHasError(res_data, error_field)

    def test_validation_ignores_soft_deleted_assignment_of_the_parent(self):
        """A parent whose assignment was soft-deleted no longer has an owner team to assign its children."""
        self.assign([self.district_a], team=self.team_a)
        Assignment.objects.get(org_unit=self.district_a).delete()
        self.client.force_authenticate(self.superuser)
        res = self.put({"org_unit_ids": [self.zone_a1.pk], "user": self.agent_a.pk})

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(res_data, "org_unit_ids", "The parent of each org unit must be assigned to a team.")

    def test_num_queries(self):
        self.client.force_authenticate(self.writer)
        self.assign([self.district_a], team=self.team_a)
        self.assign([self.zone_a1], user=self.agent_a)

        ContentType.objects.clear_cache()

        with self.assertNumQueries(19):
            # 1-2. user permissions
            # 3. planning with its target geography
            # 4. prefetch planning config
            # 5. prefetch related assignment
            # 6-7. OU queryset restriction + recursive
            # 8. Team queryset restriction OR user queryset restriction
            # 9. Savepoint
            # 10. Savepoint
            # 11. Select assignments in reassign
            # 12. UPDATE reassign
            # 13. INSERT : create
            # 14. SELECT assignments below
            # 15. soft deletes
            # 16. release
            # 17-18. content type + audit
            # 19. release
            res = self.put({"org_unit_ids": [self.district_a.pk, self.district_b.pk], "team": self.team_b.pk})

        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_assign_children_of_target_geography_to_sub_team_creates_assignments(self):
        self.client.force_authenticate(self.superuser)
        data = {"org_unit_ids": [self.district_a.pk, self.district_b.pk], "team": self.team_a.pk}
        self.assertValidBody(data)

        res = self.put(data)

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)

        self.assertEqual(
            res_data, {"created": sorted([self.district_a.pk, self.district_b.pk]), "updated": [], "deleted": []}
        )
        self.assertEqual(
            self.get_assignees(),
            {"District A": (self.team_a.pk, None), "District B": (self.team_a.pk, None)},
        )

    def test_assign_to_user_member_of_team_owning_the_parent(self):
        self.client.force_authenticate(self.superuser)

        self.assign([self.district_a], team=self.team_a)
        data = {"org_unit_ids": [self.zone_a1.pk], "user": self.agent_a.pk}

        self.assertValidBody(data)

        res = self.put(data)

        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertEqual(self.get_assignees()["Zone A1"], (None, self.agent_a.pk))

    def test_assign_ignores_duplicate_org_unit_ids(self):
        self.client.force_authenticate(self.superuser)

        data = {"org_unit_ids": [self.district_a.pk, self.district_a.pk], "team": self.team_a.pk}

        self.assertValidBody(data)

        res = self.put(data)

        self.assertJSONResponse(res, status.HTTP_200_OK)

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertEqual(res_data, {"created": [self.district_a.pk], "updated": [], "deleted": []})

    def test_reassign_moves_the_org_unit_and_clears_the_assignments_made_below_it(self):
        self.client.force_authenticate(self.superuser)

        self.assign([self.district_a], team=self.team_a)
        self.assign([self.zone_a1, self.zone_a2], user=self.agent_a)

        data = {"org_unit_ids": [self.district_a.pk], "team": self.team_b.pk}

        self.assertValidBody(data)

        res = self.put(data)

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertEqual(
            res_data,
            {"created": [], "updated": [self.district_a.pk], "deleted": sorted([self.zone_a1.pk, self.zone_a2.pk])},
        )
        self.assertEqual(self.get_assignees(), {"District A": (self.team_b.pk, None)})
        self.assertEqual(Assignment.objects_only_deleted.filter(planning=self.planning).count(), 2)

    def test_assign_to_the_current_assignee_keeps_the_assignments_made_below(self):
        self.client.force_authenticate(self.superuser)

        self.assign([self.district_a], team=self.team_a)
        self.assign([self.zone_a1], user=self.agent_a)

        data = {"org_unit_ids": [self.district_a.pk], "team": self.team_a.pk}

        self.assertValidBody(data)

        res = self.put(data)

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertEqual(res_data, {"created": [], "updated": [], "deleted": []})
        self.assertEqual(len(self.get_assignees()), 2)

    def test_assign_makes_an_audit_record(self):
        self.client.force_authenticate(self.superuser)
        self.assign([self.district_a], team=self.team_a)
        self.assign([self.zone_a1], user=self.agent_a)

        data = {"org_unit_ids": [self.district_a.pk, self.district_b.pk], "team": self.team_b.pk}
        self.assertValidBody(data)
        res = self.put(data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)
        self.assertEqual(res_data["deleted"], [self.zone_a1.pk])
        self.assertEqual(res_data["updated"], [self.district_a.pk])
        self.assertTrue(len(res_data["created"]) == 1)

        self.assertEqual(Modification.objects.filter(user=self.superuser).count(), 3)
