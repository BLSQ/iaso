from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.urls import reverse
from rest_framework import status

from iaso.models import Assignment, OrgUnit, Planning, Team
from iaso.permissions.core_permissions import CORE_PLANNING_READ_PERMISSION, CORE_SUBMISSIONS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class NestedPlanningAssignmentOrgUnitAPITestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()

        # create account
        [cls.account, cls.data_source, cls.source_version, cls.project] = cls.create_account_datasource_version_project(
            "Test Data Source", "Account", "Test Project"
        )

        [cls.other_account, cls.other_data_source, cls.other_source_version, cls.project_other_account] = (
            cls.create_account_datasource_version_project(
                "Test Data Source other account", "OtherAccount", "Test Project other account"
            )
        )

        # set up users
        cls.user_no_perm = cls.create_user_with_profile(username="user_no_perm", account=cls.account, permissions=[])
        cls.user_read_perm = cls.create_user_with_profile(
            username="user_read_perm", account=cls.account, permissions=[CORE_PLANNING_READ_PERMISSION]
        )
        cls.user_other_perm = cls.create_user_with_profile(
            username="user_other_perm", account=cls.account, permissions=[CORE_SUBMISSIONS_PERMISSION]
        )
        cls.superuser = cls.create_user_with_profile(
            username="superuser", account=cls.account, is_superuser=True, is_staff=True
        )

        cls.user_other_account = cls.create_user_with_profile(
            username="user_other_account", account=cls.other_account, is_superuser=True, is_staff=True
        )

        # create teams
        cls.team = Team.objects.create(name="Test Team", project=cls.project, manager=cls.superuser)
        cls.team_2 = Team.objects.create(name="Test Team 2", project=cls.project, manager=cls.superuser)
        cls.team_3 = Team.objects.create(name="Test Team 3", project=cls.project, manager=cls.superuser)
        cls.team_other_account = Team.objects.create(
            name="Test Team Other Account", project=cls.project_other_account, manager=cls.user_other_account
        )
        # create org units
        cls.mock_multipolygon = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))

        cls.ou_root_other_account = OrgUnit.objects.create(
            name="Root", version=cls.other_source_version, validation_status=OrgUnit.VALIDATION_VALID
        )
        cls.ou_root = OrgUnit.objects.create(
            name="Root", version=cls.source_version, validation_status=OrgUnit.VALIDATION_VALID
        )
        cls.children_1 = OrgUnit.objects.create(
            parent=cls.ou_root, version=cls.source_version, name="Child 1", validation_status=OrgUnit.VALIDATION_VALID
        )
        cls.children_2 = OrgUnit.objects.create(
            parent=cls.ou_root,
            version=cls.source_version,
            name="Child 2",
            location=Point(x=4, y=50, z=100),
            simplified_geom=cls.mock_multipolygon,
            geom=cls.mock_multipolygon,
            validation_status=OrgUnit.VALIDATION_VALID,
        )

        cls.children_1_1 = OrgUnit.objects.create(
            parent=cls.children_1,
            version=cls.source_version,
            name="Child 1.1",
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.children_1_2 = OrgUnit.objects.create(
            parent=cls.children_1,
            version=cls.source_version,
            name="Child 1.2",
            validation_status=OrgUnit.VALIDATION_VALID,
        )

        cls.children_2_1 = OrgUnit.objects.create(
            parent=cls.children_2,
            version=cls.source_version,
            name="Child 2.1",
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.children_2_2 = OrgUnit.objects.create(
            parent=cls.children_2,
            version=cls.source_version,
            name="Child 2.2",
            validation_status=OrgUnit.VALIDATION_VALID,
        )

        cls.children_1_1_1 = OrgUnit.objects.create(
            parent=cls.children_1_1,
            version=cls.source_version,
            name="Child 1.1.1",
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.children_1_1_2 = OrgUnit.objects.create(
            parent=cls.children_1_1,
            version=cls.source_version,
            name="Child 1.1.2",
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.children_1_2_1 = OrgUnit.objects.create(
            parent=cls.children_1_2,
            version=cls.source_version,
            name="Child 1.2.1",
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.children_1_2_2 = OrgUnit.objects.create(
            parent=cls.children_1_2,
            version=cls.source_version,
            name="Child 1.2.2",
            validation_status=OrgUnit.VALIDATION_VALID,
        )

        cls.children_2_1_1 = OrgUnit.objects.create(
            parent=cls.children_2_1,
            version=cls.source_version,
            name="Child 2.1.1",
            validation_status=OrgUnit.VALIDATION_VALID,
        )

        cls.children_2_1_2 = OrgUnit.objects.create(
            parent=cls.children_2_1,
            version=cls.source_version,
            name="Child 2.1.2",
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.children_2_2_1 = OrgUnit.objects.create(
            parent=cls.children_2_2,
            version=cls.source_version,
            name="Child 2.2.1",
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.children_2_2_2 = OrgUnit.objects.create(
            parent=cls.children_2_2,
            version=cls.source_version,
            name="Child 2.2.2",
            validation_status=OrgUnit.VALIDATION_VALID,
        )

        # create planning
        cls.planning = Planning.objects.create(
            name="planning", project=cls.project, team=cls.team, org_unit=cls.ou_root
        )
        cls.planning_2 = Planning.objects.create(
            name="planning 2", project=cls.project, team=cls.team, org_unit=cls.children_2
        )

        cls.planning_other_account = Planning.objects.create(
            name="planning_other_account",
            project=cls.project_other_account,
            team=cls.team_other_account,
            org_unit=cls.ou_root,
        )

        # create assignments
        cls.assignment_1 = Assignment.objects.create(
            planning=cls.planning, org_unit=cls.children_1, team=cls.team, user=cls.superuser
        )
        cls.assignment_2 = Assignment.objects.create(
            planning=cls.planning, org_unit=cls.children_1_1, team=cls.team_2, user=cls.user_no_perm
        )
        cls.assignment_3 = Assignment.objects.create(
            planning=cls.planning, org_unit=cls.children_1_1_1, team=cls.team_3, user=cls.user_read_perm
        )

        cls.assignment_other_planning = Assignment.objects.create(
            planning=cls.planning_other_account, team=cls.team_other_account, user=cls.user_other_account
        )

    def assertValidResponse(self, data: Any, expected_length: int):
        self.assertValidListData(list_data=data, results_key="results", expected_length=expected_length, paginated=True)
        self.assertResponseCompliantToSwagger(data, "PaginatedAssignmentOrgUnitList")

    def get_url(self, planning_pk: int | None = None) -> str:
        if planning_pk is None:
            planning_pk = self.planning.pk
        return reverse("planning-nested-assignments-org-units", kwargs={"parent_lookup_pk": planning_pk})

    def test_should_raise_404_if_planning_is_deleted_or_does_not_exist(self):
        self.planning.delete()
        self.assertSoftDeleted(self.planning)

        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        res = self.client.get(self.get_url(Planning.objects.all().order_by("-id").first().pk + 1))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_should_raise_404_if_planning_belongs_to_another_account(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.get_url(self.planning_other_account.pk))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_should_not_raise_a_404_if_planning_is_deprecated(self):
        self.planning.deprecated = True
        self.planning.save()

        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_num_queries(self):
        self.client.force_authenticate(self.superuser)
        with self.assertNumQueries(4):
            # 1. SELECT PLANNING
            # 3. FILTERSET ORG UNIT QUERYSET
            # 3. PAGINATION COUNT
            # 4. SELECT DATA
            res = self.client.get(self.get_url())
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 3)

    def test_permissions(self):
        res = self.client.get(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user_no_perm)
        res = self.client.get(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_other_perm)
        res = self.client.get(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_read_perm)
        res = self.client.get(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_filter_teams(self):
        self.client.force_authenticate(self.superuser)

        data = {"teams": f"{self.team.pk}"}
        res = self.client.get(self.get_url(), data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 1)

        self.assertEqual(
            res_data["results"],
            [
                {
                    "id": self.assignment_1.pk,
                    "org_unit": self.children_1.pk,
                    "user": self.superuser.pk,
                    "team": self.team.pk,
                }
            ],
        )

        data = {"teams": f"{self.team.pk},{self.team_2.pk}"}
        res = self.client.get(self.get_url(), data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 2)

        self.assertEqual(
            res_data["results"],
            [
                {
                    "id": self.assignment_1.pk,
                    "org_unit": self.children_1.pk,
                    "user": self.superuser.pk,
                    "team": self.team.pk,
                },
                {
                    "id": self.assignment_2.pk,
                    "org_unit": self.children_1_1.pk,
                    "user": self.user_no_perm.pk,
                    "team": self.team_2.pk,
                },
            ],
        )

        data = {"teams": f"{self.team.pk},{self.team_3.pk}"}
        res = self.client.get(self.get_url(), data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 2)

        self.assertEqual(
            res_data["results"],
            [
                {
                    "id": self.assignment_1.pk,
                    "org_unit": self.children_1.pk,
                    "user": self.superuser.pk,
                    "team": self.team.pk,
                },
                {
                    "id": self.assignment_3.pk,
                    "org_unit": self.children_1_1_1.pk,
                    "user": self.user_read_perm.pk,
                    "team": self.team_3.pk,
                },
            ],
        )

        res = self.client.get(self.get_url(), data={"teams": Team.objects.order_by("-pk").first().pk + 1})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 0)

    def test_filter_users(self):
        self.client.force_authenticate(self.superuser)

        data = {"users": f"{self.superuser.pk}"}
        res = self.client.get(self.get_url(), data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 1)

        self.assertEqual(
            res_data["results"],
            [
                {
                    "id": self.assignment_1.pk,
                    "org_unit": self.children_1.pk,
                    "user": self.superuser.pk,
                    "team": self.team.pk,
                }
            ],
        )

        data = {"users": f"{self.superuser.pk},{self.user_no_perm.pk}"}
        res = self.client.get(self.get_url(), data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 2)

        self.assertEqual(
            res_data["results"],
            [
                {
                    "id": self.assignment_1.pk,
                    "org_unit": self.children_1.pk,
                    "user": self.superuser.pk,
                    "team": self.team.pk,
                },
                {
                    "id": self.assignment_2.pk,
                    "org_unit": self.children_1_1.pk,
                    "user": self.user_no_perm.pk,
                    "team": self.team_2.pk,
                },
            ],
        )

        data = {"users": f"{self.superuser.pk},{self.user_read_perm.pk}"}
        res = self.client.get(self.get_url(), data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 2)

        self.assertEqual(
            res_data["results"],
            [
                {
                    "id": self.assignment_1.pk,
                    "org_unit": self.children_1.pk,
                    "user": self.superuser.pk,
                    "team": self.team.pk,
                },
                {
                    "id": self.assignment_3.pk,
                    "org_unit": self.children_1_1_1.pk,
                    "user": self.user_read_perm.pk,
                    "team": self.team_3.pk,
                },
            ],
        )

        res = self.client.get(self.get_url(), data={"users": get_user_model().objects.order_by("-pk").first().pk + 1})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 0)

    def test_filter_org_units(self):
        self.client.force_authenticate(self.superuser)

        data = {"org_units": f"{self.children_1.pk}"}
        res = self.client.get(self.get_url(), data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 1)

        self.assertEqual(
            res_data["results"],
            [
                {
                    "id": self.assignment_1.pk,
                    "org_unit": self.children_1.pk,
                    "user": self.superuser.pk,
                    "team": self.team.pk,
                }
            ],
        )

        data = {"org_units": f"{self.children_1.pk},{self.children_1_1.pk}"}
        res = self.client.get(self.get_url(), data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 2)

        self.assertEqual(
            res_data["results"],
            [
                {
                    "id": self.assignment_1.pk,
                    "org_unit": self.children_1.pk,
                    "user": self.superuser.pk,
                    "team": self.team.pk,
                },
                {
                    "id": self.assignment_2.pk,
                    "org_unit": self.children_1_1.pk,
                    "user": self.user_no_perm.pk,
                    "team": self.team_2.pk,
                },
            ],
        )

        data = {"org_units": f"{self.children_1.pk},{self.children_1_1_1.pk}"}
        res = self.client.get(self.get_url(), data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 2)

        self.assertEqual(
            res_data["results"],
            [
                {
                    "id": self.assignment_1.pk,
                    "org_unit": self.children_1.pk,
                    "user": self.superuser.pk,
                    "team": self.team.pk,
                },
                {
                    "id": self.assignment_3.pk,
                    "org_unit": self.children_1_1_1.pk,
                    "user": self.user_read_perm.pk,
                    "team": self.team_3.pk,
                },
            ],
        )

        res = self.client.get(self.get_url(), data={"org_units": OrgUnit.objects.order_by("-pk").first().pk + 1})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 0)

    def test_filter_parent_org_unit(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.get_url())
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 3)

        with self.subTest("org unit out of account"):
            data = {"parent_org_unit": self.ou_root_other_account.pk}
            res = self.client.get(self.get_url(), data=data)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(
                res_data, "parent_org_unit", "Select a valid choice. That choice is not one of the available choices."
            )

        with self.subTest("org unit does not exist"):
            pk = OrgUnit.objects.order_by("-id").first().pk + 1
            data = {"parent_org_unit": pk}
            res = self.client.get(self.get_url(), data=data)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(
                res_data, "parent_org_unit", "Select a valid choice. That choice is not one of the available choices."
            )

        with self.subTest("filter"):
            data = {"parent_org_unit": self.children_1.pk}
            res = self.client.get(self.get_url(), data=data)
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidResponse(res_data, 1)
            self.assertEqual(res_data["results"][0]["id"], self.assignment_2.pk)

    def test_should_not_see_assignments_other_account(self):
        self.client.force_authenticate(self.user_other_account)
        res = self.client.get(self.get_url(self.planning_other_account.pk))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 1)
        self.assertEqual(
            res_data["results"],
            [
                {
                    "id": self.assignment_other_planning.pk,
                    "org_unit": None,
                    "team": self.team_other_account.pk,
                    "user": self.user_other_account.pk,
                }
            ],
        )

    def test_response_does_not_include_soft_deleted_assignments(self):
        self.client.force_authenticate(self.superuser)

        res = self.client.get(self.get_url())
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 3)

        assignment_pk = self.assignment_1.pk
        self.assignment_1.delete()
        self.assertSoftDeleted(self.assignment_1)

        res = self.client.get(self.get_url())
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 2)
        self.assertNotIn(assignment_pk, [x["id"] for x in res_data["results"]])

    def test_response(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.get_url())
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 3)

        self.assertEqual(
            res_data["results"],
            [
                {
                    "id": self.assignment_1.pk,
                    "org_unit": self.children_1.pk,
                    "user": self.superuser.pk,
                    "team": self.team.pk,
                },
                {
                    "id": self.assignment_2.pk,
                    "org_unit": self.children_1_1.pk,
                    "user": self.user_no_perm.pk,
                    "team": self.team_2.pk,
                },
                {
                    "id": self.assignment_3.pk,
                    "org_unit": self.children_1_1_1.pk,
                    "user": self.user_read_perm.pk,
                    "team": self.team_3.pk,
                },
            ],
        )
