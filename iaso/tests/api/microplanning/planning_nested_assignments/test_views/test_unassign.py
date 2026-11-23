from __future__ import annotations

from typing import Any

from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from rest_framework import status

from hat.audit.models import Modification
from iaso.models import Assignment, OrgUnit, Planning, Team
from iaso.permissions.core_permissions import CORE_PLANNING_READ_PERMISSION, CORE_PLANNING_WRITE_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class NestedPlanningAssignmentBulkAPITestCase(SwaggerTestCaseMixin, APITestCase):
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
        self.assertResponseCompliantToSwagger(data, "UnassignInputRequest")

    def assertValidResponse(self, data: Any) -> None:
        self.assertResponseCompliantToSwagger(data, "UnassignResponse")

    def put(self, data: dict | None = None, planning_pk: int | None = None):
        if not data:
            data = {}
        url = reverse(
            "planning-nested-assignments-unassign", kwargs={"parent_lookup_pk": planning_pk or self.planning.pk}
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

    def test_validation_rejects_org_units_from_another_account(self):
        self.client.force_authenticate(self.superuser)
        data = {"org_unit_ids": [self.other_account_district.pk]}
        self.assertValidBody(data)
        res = self.put(data)

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data, "org_unit_ids", f'Invalid pk "{self.other_account_district.pk}" - object does not exist.'
        )

    def test_num_queries(self):
        self.client.force_authenticate(self.writer)

        self.assign([self.district_a, self.district_b], team=self.team_a)
        self.assign([self.zone_a1], user=self.agent_a)

        data = {"org_unit_ids": [self.district_a.pk, self.district_b.pk]}
        self.assertValidBody(data)

        ContentType.objects.clear_cache()

        with self.assertNumQueries(14):
            # 1. select planning instance
            # 2. Org unit validation (restriction filter for user)
            # 3. planning config
            # 4. recursive CTE
            # 5. select assignments to update (filter_queryset)
            # 6. savepoint
            # 7. select assignments to update
            # 8. update
            # 9. audit - select content type
            # 10. insert into audit
            # 11. release savepoint
            res = self.put(data)

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)

    def test_happy_path(self):
        self.client.force_authenticate(self.superuser)

        objs = self.assign([self.district_a, self.district_b], team=self.team_a)
        original_updated_at = {obj.pk: obj.updated_at for obj in objs}

        data = {"org_unit_ids": [self.district_a.pk, self.district_b.pk]}

        self.assertValidBody(data)
        res = self.put(data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)

        self.assertEqual(res_data, {"deleted": [self.district_a.pk, self.district_b.pk]})

        for o in objs:
            self.assertSoftDeleted(o)
            self.assertIsNotNone(o.updated_at)
            self.assertNotEqual(o.updated_at, original_updated_at[o.pk])

    def test_unassign_removes_the_assignments_and_those_made_below(self):
        self.client.force_authenticate(self.superuser)
        objs = self.assign([self.district_a, self.district_b], team=self.team_a)
        objs.extend(self.assign([self.zone_a1], user=self.agent_a))
        objs = [o for o in objs if o.org_unit_id in [self.district_a.pk, self.zone_a1.pk]]
        original_updated_at = {obj.pk: obj.updated_at for obj in objs}

        data = {"org_unit_ids": [self.district_a.pk]}
        res = self.put(data)

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)

        self.assertEqual(res_data, {"deleted": sorted([self.district_a.pk, self.zone_a1.pk])})
        self.assertEqual(self.get_assignees(), {"District B": (self.team_a.pk, None)})

        for o in objs:
            with self.subTest(o):
                self.assertSoftDeleted(o)
                self.assertIsNotNone(o.updated_at)
                self.assertNotEqual(o.updated_at, original_updated_at[o.pk])

    def test_unassign_makes_an_audit_record(self):
        self.client.force_authenticate(self.superuser)
        objs = self.assign([self.district_a], team=self.team_a)

        data = {"org_unit_ids": [self.district_a.pk]}
        self.assertValidBody(data)
        res = self.put(data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)
        self.assertEqual(res_data["deleted"], [self.district_a.pk])

        self.assertEqual(Modification.objects.filter(user=self.superuser).count(), 1)
        modification = Modification.objects.filter(user=self.superuser).get()
        self.assertEqual(modification.user, self.superuser)
        self.assertEqual(modification.content_object, objs[0])
        url = reverse("planning-nested-assignments-unassign", kwargs={"parent_lookup_pk": self.planning.pk})
        self.assertEqual(
            modification.source,
            f"API PUT {url}",
        )
