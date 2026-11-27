from __future__ import annotations

import random

from typing import Any

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.test import tag
from django.urls import reverse
from rest_framework import status

from iaso.models import Assignment, Group, OrgUnit, OrgUnitType, Planning, PlanningConfig, Team
from iaso.models.team import TeamType
from iaso.permissions.core_permissions import CORE_PLANNING_READ_PERMISSION, CORE_SUBMISSIONS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class NestedPlanningAssignmentTeamAPITestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()

        # create account
        [cls.account, cls.data_source, cls.source_version, cls.project] = cls.create_account_datasource_version_project(
            "Test Data Source", "Account", "Test Project"
        )

        [
            cls.other_account,
            cls.data_source_other_account,
            cls.source_version_other_account,
            cls.project_other_account,
        ] = cls.create_account_datasource_version_project("Test Data Source OA", "OtherAccount", "Test Project OA")

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
        cls.root_team = Team.objects.create(
            name="Root Team", project=cls.project, manager=cls.superuser, type=TeamType.TEAM_OF_TEAMS
        )
        cls.team = Team.objects.create(name="Test Team", project=cls.project, manager=cls.superuser)
        cls.team_2 = Team.objects.create(
            name="Test Team 2",
            project=cls.project,
            manager=cls.superuser,
            parent=cls.root_team,
            type=TeamType.TEAM_OF_TEAMS,
        )

        cls.team_1_1 = Team.objects.create(
            name="Test Team 1.1", project=cls.project, manager=cls.superuser, parent=cls.team
        )
        cls.team_2_1 = Team.objects.create(
            name="Test Team 2.1", project=cls.project, manager=cls.superuser, parent=cls.team_2
        )

        cls.team_1_1_1 = Team.objects.create(
            name="Test Team 1.1.1", project=cls.project, manager=cls.superuser, parent=cls.team_1_1
        )
        cls.team_2_1_1 = Team.objects.create(
            name="Test Team 2.1.1", project=cls.project, manager=cls.superuser, parent=cls.team_2_1
        )
        cls.team_2_1_2 = Team.objects.create(
            name="Test Team 2.1.2", project=cls.project, manager=cls.superuser, parent=cls.team_2_1
        )

        cls.team_other_account = Team.objects.create(
            name="Test Team Other Account", project=cls.project_other_account, manager=cls.user_other_account
        )

        # create org unit types
        cls.org_unit_type = OrgUnitType.objects.create(name="Test Country Type", short_name="TCT", category="COUNTRY")
        cls.org_unit_type.projects.set([cls.project])

        cls.org_unit_type_2 = OrgUnitType.objects.create(
            name="Test Country Type 2", short_name="TCT2", category="COUNTRY"
        )
        cls.org_unit_type_2.projects.set([cls.project])

        cls.org_unit_type_other_account = OrgUnitType.objects.create(
            name="Test Country Type OA", short_name="TCTOA", category="COUNTRY"
        )
        cls.org_unit_type_other_account.projects.set([cls.project_other_account])

        # create org unit groups
        cls.org_unit_group = Group.objects.create(name="Test Org Group", source_version=cls.source_version)
        cls.org_unit_group_2 = Group.objects.create(name="Test Org Group 2", source_version=cls.source_version)
        cls.org_unit_group_other_account = Group.objects.create(
            name="Test Org Group OA", source_version=cls.source_version_other_account
        )

        # create org units
        cls.mock_multipolygon = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))

        cls.ou_root = OrgUnit.objects.create(
            name="Root", version=cls.source_version, validation_status=OrgUnit.VALIDATION_VALID
        )
        cls.children_1 = OrgUnit.objects.create(
            parent=cls.ou_root,
            version=cls.source_version,
            name="Child 1",
            validation_status=OrgUnit.VALIDATION_VALID,
            org_unit_type=cls.org_unit_type,
        )
        cls.children_2 = OrgUnit.objects.create(
            parent=cls.ou_root,
            version=cls.source_version,
            name="Child 2",
            org_unit_type=cls.org_unit_type,
            location=Point(x=4, y=50, z=100),
            simplified_geom=cls.mock_multipolygon,
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
            org_unit_type=cls.org_unit_type_2,
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.children_2_1.groups.set([cls.org_unit_group_2])
        cls.children_2_2 = OrgUnit.objects.create(
            parent=cls.children_2,
            version=cls.source_version,
            name="Child 2.2",
            org_unit_type=cls.org_unit_type,
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.children_2_2.groups.set([cls.org_unit_group])

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
            org_unit_type=cls.org_unit_type,
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.children_2_1_1.groups.set([cls.org_unit_group])

        cls.children_2_1_2 = OrgUnit.objects.create(
            parent=cls.children_2_1,
            version=cls.source_version,
            name="Child 2.1.2",
            org_unit_type=cls.org_unit_type,
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.children_2_1_2.groups.set([cls.org_unit_group_2])
        cls.children_2_2_1 = OrgUnit.objects.create(
            parent=cls.children_2_2,
            version=cls.source_version,
            name="Child 2.2.1",
            org_unit_type=cls.org_unit_type,
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
            name="planning", project=cls.project, team=cls.root_team, org_unit=cls.ou_root
        )

        cls.planning_other_account = Planning.objects.create(
            name="planning_other_account",
            project=cls.project_other_account,
            team=cls.team_other_account,
            org_unit=cls.ou_root,
        )

        # create planning configs for level 1 and 2 for planning
        cls.planning_config_level_1 = PlanningConfig.objects.create(level=1, planning=cls.planning)
        cls.planning_config_level_1.org_unit_types.set([cls.org_unit_type])

        cls.planning_config_level_2 = PlanningConfig.objects.create(level=2, planning=cls.planning)
        cls.planning_config_level_2.org_unit_types.set([cls.org_unit_type_2])
        cls.planning_config_level_2.org_unit_groups.set([cls.org_unit_group_2])

        # resulting tree
        # root
        # |- children_2
        #    |- children_2_1

        # create assignments
        Assignment.objects.create(planning=cls.planning, team=cls.team, org_unit=cls.children_1)
        cls.assignment = Assignment.objects.create(planning=cls.planning, team=cls.team_2, org_unit=cls.children_2)
        cls.assignment_2 = Assignment.objects.create(
            planning=cls.planning, team=cls.team_2_1, org_unit=cls.children_2_1
        )
        cls.assignment_3 = Assignment.objects.create(
            planning=cls.planning, team=cls.team_2_1_1, org_unit=cls.children_2_1_1
        )
        cls.assignment_4 = Assignment.objects.create(
            planning=cls.planning, team=cls.team_2_1_2, org_unit=cls.children_2_1_2
        )

    def assertValidResponse(self, response: Any, expected_length: int):
        self.assertValidListData(
            list_data=response, results_key="results", expected_length=expected_length, paginated=True
        )
        self.assertResponseCompliantToSwagger(response, "PaginatedAssignmentTeamList")

    def get_url(self, planning_pk: int | None = None) -> str:
        if not planning_pk:
            planning_pk = self.planning.pk
        return reverse("planning-nested-assignments-teams", kwargs={"parent_lookup_pk": planning_pk})

    def get_team_ids(self, expected_length: int, **params: Any) -> list[int]:
        res = self.client.get(self.get_url(), data=params)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, expected_length)
        return [team["team_id"] for team in res_data["results"]]

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
        with self.assertNumQueries(10):
            # 1. SELECT PLANNING
            # 2. PREFETCH CONFIG
            # 3. PREFETCH OUT FROM CONFIG
            # 4. PREFETCH OUG FROM CONFIG
            # 5. TEAM QS
            # 6. ORG UNIT QUERYSET (TREE BUILDER)
            # 7. ORG UNIT TREE BUILDER
            # 8. own_count qs
            # 9. PAGINATION
            # 10. SELECT DATA
            res = self.client.get(self.get_url())
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 4)

    def test_ordering_is_assigned(self):
        self.client.force_authenticate(self.superuser)

        team_ids = self.get_team_ids(4, order="assigned")

        # Unassigned teams first, assigned teams last.
        self.assertCountEqual(
            team_ids[:2],
            [self.team_2_1_1.pk, self.team_2_1_2.pk],
        )
        self.assertCountEqual(
            team_ids[2:],
            [self.team_2.pk, self.team_2_1.pk],
        )

        # Reverse ordering.
        team_ids = self.get_team_ids(4, order="-assigned")

        self.assertCountEqual(
            team_ids[:2],
            [self.team_2.pk, self.team_2_1.pk],
        )
        self.assertCountEqual(
            team_ids[2:],
            [self.team_2_1_1.pk, self.team_2_1_2.pk],
        )

    def test_ordering_total(self):
        self.client.force_authenticate(self.superuser)

        team_ids = self.get_team_ids(4, order="total")

        # Totals: 0, 0, 2, 3.
        self.assertCountEqual(
            team_ids[:2],
            [self.team_2_1_1.pk, self.team_2_1_2.pk],
        )
        self.assertEqual(team_ids[2:], [self.team_2_1.pk, self.team_2.pk])

        team_ids = self.get_team_ids(4, order="-total")

        self.assertEqual(team_ids[:2], [self.team_2.pk, self.team_2_1.pk])
        self.assertCountEqual(
            team_ids[2:],
            [self.team_2_1_1.pk, self.team_2_1_2.pk],
        )

    def test_ordering_depth(self):
        self.client.force_authenticate(self.superuser)

        team_ids = self.get_team_ids(4, order="team_depth")

        self.assertEqual(
            team_ids[:2],
            [self.team_2.pk, self.team_2_1.pk],
        )
        self.assertCountEqual(
            team_ids[2:],
            [self.team_2_1_1.pk, self.team_2_1_2.pk],
        )

        team_ids = self.get_team_ids(4, order="-team_depth")

        self.assertCountEqual(
            team_ids[:2],
            [self.team_2_1_1.pk, self.team_2_1_2.pk],
        )
        self.assertEqual(
            team_ids[2:],
            [self.team_2_1.pk, self.team_2.pk],
        )

    def test_filters_is_assigned(self):
        self.client.force_authenticate(self.superuser)

        # assert count is 4 without parameter
        self.get_team_ids(4)

        self.get_team_ids(4, is_assigned="true")

        self.get_team_ids(0, is_assigned="false")

    def test_filters_teams(self):
        self.client.force_authenticate(self.superuser)
        with self.subTest("team out of account"):
            data = {"teams": self.team_other_account.pk}
            res = self.client.get(self.get_url(), data=data)
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidResponse(res_data, 0)

        with self.subTest("team does not exist"):
            pk = Team.objects.order_by("-pk").first().pk + 1
            data = {"teams": pk}
            res = self.client.get(self.get_url(), data=data)
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidResponse(res_data, 0)

        with self.subTest("team filter"):
            data = {"teams": ",".join([str(self.team_2.pk), str(self.team_2_1.pk)])}
            team_ids = self.get_team_ids(2, **data)
            self.assertCountEqual(team_ids, [self.team_2.pk, self.team_2_1.pk])

    def test_does_not_include_team_out_of_tree(self):
        self.client.force_authenticate(self.superuser)
        team_ids = self.get_team_ids(4)
        self.assertNotIn(self.team.pk, team_ids)

    def test_does_not_include_soft_deleted_team(self):
        self.team_2_1.delete()
        self.assertSoftDeleted(self.team_2_1)

        self.client.force_authenticate(self.superuser)
        data = {"order": "team_depth"}
        res = self.client.get(self.get_url(), data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidResponse(res_data, 3)

        self.assertEqual(
            res_data["results"],
            [
                {
                    "team_id": self.team_2.pk,
                    "assigned_for_level": 1,
                    "total_for_level": 1,
                    "assigned": 3,
                    "total": 3,
                    "area_org_unit_ids": [self.children_2.pk],
                    "type": {"label": TeamType.TEAM_OF_TEAMS.label, "value": TeamType.TEAM_OF_TEAMS.value},
                    "depth": 2,
                },
                {
                    "team_id": self.team_2_1_1.pk,
                    "assigned_for_level": 1,
                    "total_for_level": 0,
                    "assigned": 1,
                    "total": 0,
                    "area_org_unit_ids": [self.children_2_1_1.pk],
                    "type": None,
                    "depth": 4,
                },
                {
                    "team_id": self.team_2_1_2.pk,
                    "assigned_for_level": 1,
                    "total_for_level": 0,
                    "assigned": 1,
                    "total": 0,
                    "area_org_unit_ids": [self.children_2_1_2.pk],
                    "type": None,
                    "depth": 4,
                },
            ],
        )

    def test_happy_path(self):
        self.client.force_authenticate(self.superuser)
        data = {"order": "team_depth"}
        res = self.client.get(self.get_url(), data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 4)

        self.assertEqual(
            res_data["results"],
            [
                {
                    "team_id": self.team_2.pk,
                    "assigned_for_level": 1,
                    "total_for_level": 1,
                    "assigned": 4,
                    "total": 3,
                    "area_org_unit_ids": [self.children_2.pk],
                    "type": {"label": TeamType.TEAM_OF_TEAMS.label, "value": TeamType.TEAM_OF_TEAMS.value},
                    "depth": 2,
                },
                {
                    "team_id": self.team_2_1.pk,
                    "assigned_for_level": 1,
                    "total_for_level": 2,
                    "assigned": 3,
                    "total": 2,
                    "area_org_unit_ids": [self.children_2_1.pk],
                    "type": {"label": TeamType.TEAM_OF_TEAMS.label, "value": TeamType.TEAM_OF_TEAMS.value},
                    "depth": 3,
                },
                {
                    "team_id": self.team_2_1_1.pk,
                    "assigned_for_level": 1,
                    "total_for_level": 0,
                    "assigned": 1,
                    "total": 0,
                    "area_org_unit_ids": [self.children_2_1_1.pk],
                    "type": None,
                    "depth": 4,
                },
                {
                    "team_id": self.team_2_1_2.pk,
                    "assigned_for_level": 1,
                    "total_for_level": 0,
                    "assigned": 1,
                    "total": 0,
                    "area_org_unit_ids": [self.children_2_1_2.pk],
                    "type": None,
                    "depth": 4,
                },
            ],
        )

    def test_soft_deleted_assignments_are_not_taken_into_account(self):
        self.client.force_authenticate(self.superuser)
        data = {"order": "team_depth"}
        res = self.client.get(self.get_url(), data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 4)

        self.assertEqual(
            [
                {
                    k: v
                    for k, v in x.items()
                    if k in ["team_id", "assigned", "total", "assigned_for_level", "total_for_level"]
                }
                for x in res_data["results"]
            ],
            [
                {"team_id": self.team_2.pk, "assigned_for_level": 1, "total_for_level": 1, "assigned": 4, "total": 3},
                {"team_id": self.team_2_1.pk, "assigned_for_level": 1, "total_for_level": 2, "assigned": 3, "total": 2},
                {
                    "team_id": self.team_2_1_1.pk,
                    "assigned_for_level": 1,
                    "total_for_level": 0,
                    "assigned": 1,
                    "total": 0,
                },
                {
                    "team_id": self.team_2_1_2.pk,
                    "assigned_for_level": 1,
                    "total_for_level": 0,
                    "assigned": 1,
                    "total": 0,
                },
            ],
        )

        self.assignment_2.delete()
        self.assertSoftDeleted(self.assignment_2)

        res = self.client.get(self.get_url(), data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 4)

        self.assertEqual(
            [
                {
                    k: v
                    for k, v in x.items()
                    if k in ["team_id", "assigned", "total", "assigned_for_level", "total_for_level"]
                }
                for x in res_data["results"]
            ],
            [
                {"team_id": self.team_2.pk, "assigned_for_level": 1, "total_for_level": 1, "assigned": 3, "total": 3},
                {"team_id": self.team_2_1.pk, "assigned_for_level": 0, "total_for_level": 2, "assigned": 2, "total": 2},
                {
                    "team_id": self.team_2_1_1.pk,
                    "assigned_for_level": 1,
                    "total_for_level": 0,
                    "assigned": 1,
                    "total": 0,
                },
                {
                    "team_id": self.team_2_1_2.pk,
                    "assigned_for_level": 1,
                    "total_for_level": 0,
                    "assigned": 1,
                    "total": 0,
                },
            ],
        )


@tag("benchmark")
class NestedPlanningAssignmentTeamAPIPerfTestCase(APITestCase):
    DATASET_SIZE = 100_000

    @classmethod
    def create_team_tree(cls, ous_by_depth):
        teams_by_ou_id = {}

        for depth, ous in ous_by_depth.items():
            if depth == 0:
                continue

            teams = []

            for index, ou in enumerate(ous):
                parent = cls.root_team if depth == 1 else teams_by_ou_id[ou.parent_id]

                teams.append(
                    Team(
                        name=f"Team for OU {ou.pk}",
                        project=cls.project,
                        manager=cls.superuser,
                        parent=parent,
                        path=f"{parent.path}.{index}",
                    )
                )

            Team.objects.bulk_create(teams)

            teams_by_ou_id.update((ou.pk, team) for ou, team in zip(ous, teams))

        return teams_by_ou_id

    @classmethod
    def create_ou_pyramid(cls, total: int, max_children: int = 20):
        rng = random.Random(42)

        root = cls.ou_root
        mock_multipolygon = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))

        ous_by_depth = {0: [root]}
        remaining = total - 1
        parents = [root]
        depth = 1
        count_path = 2
        while remaining > 0:
            children = []

            for parent in parents:
                if not remaining:
                    break

                count = rng.randint(1, min(max_children, remaining))

                for _ in range(count):
                    ou = OrgUnit(
                        name=f"OU {total - remaining + len(children) + 1}",
                        version=cls.source_version,
                        parent=parent,
                        validation_status=OrgUnit.VALIDATION_VALID,
                        path=f"{parent.path}.{count_path}",
                        simplified_geom=mock_multipolygon,
                    )

                    if depth == 1:
                        ou.org_unit_type = cls.org_unit_type

                    elif depth == 2:
                        ou.org_unit_type = cls.org_unit_type_2

                    children.append(ou)
                    count_path += 1

                remaining -= count

            ous = OrgUnit.objects.bulk_create(children)

            if depth == 1:
                through = OrgUnit.groups.through

                through.objects.bulk_create(
                    [through(orgunit_id=ou.pk, group_id=cls.org_unit_group.pk) for ou in children]
                )

            if depth == 2:
                through = OrgUnit.groups.through

                through.objects.bulk_create(
                    [through(orgunit_id=ou.pk, group_id=cls.org_unit_group_2.pk) for ou in children]
                )

            ous_by_depth[depth] = children
            parents = children
            depth += 1

            for ou in ous:
                ou.calculate_paths()

        return ous_by_depth

    @classmethod
    def create_assignments(cls, ous_by_depth, teams_by_ou_id):
        assignments = [
            Assignment(
                planning=cls.planning,
                org_unit=ou,
                team=teams_by_ou_id[ou.pk],
            )
            for depth, ous in ous_by_depth.items()
            if depth > 0
            for ou in ous
        ]

        return Assignment.objects.bulk_create(assignments)

    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()
        [cls.account, cls.data_source, cls.source_version, cls.project] = cls.create_account_datasource_version_project(
            "Test Data Source", "Account", "Test Project"
        )
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

        cls.users = [cls.user_no_perm, cls.user_read_perm, cls.user_other_perm, cls.superuser]

        # create OUT
        cls.org_unit_type = OrgUnitType.objects.create(name="Test Country Type", short_name="TCT", category="COUNTRY")
        cls.org_unit_type.projects.set([cls.project])

        cls.org_unit_type_2 = OrgUnitType.objects.create(
            name="Test Country Type 2", short_name="TCT2", category="COUNTRY"
        )
        cls.org_unit_type_2.projects.set([cls.project])

        cls.org_unit_type_3 = OrgUnitType.objects.create(
            name="Test Country Type 3", short_name="TCT3", category="COUNTRY"
        )
        cls.org_unit_type_3.projects.set([cls.project])

        cls.org_unit_types = [cls.org_unit_type, cls.org_unit_type_2, cls.org_unit_type_3]

        # create OUG
        cls.org_unit_group = Group.objects.create(name="Test Org Group", source_version=cls.source_version)
        cls.org_unit_group_2 = Group.objects.create(name="Test Org Group 2", source_version=cls.source_version)
        cls.org_unit_group_3 = Group.objects.create(name="Test Org Group 3", source_version=cls.source_version)

        cls.org_unit_groups = [cls.org_unit_group, cls.org_unit_group_2, cls.org_unit_group_3]
        cls.root_team = Team.objects.create(
            name="Root Team",
            project=cls.project,
            manager=cls.superuser,
            type=TeamType.TEAM_OF_TEAMS,
        )

        cls.ou_root = OrgUnit.objects.create(
            name="Root",
            version=cls.source_version,
            validation_status=OrgUnit.VALIDATION_VALID,
        )

        cls.planning = Planning.objects.create(
            name="Planning",
            project=cls.project,
            team=cls.root_team,
            org_unit=cls.ou_root,
        )

        cls.planning_config_level_1 = PlanningConfig.objects.create(
            level=1,
            planning=cls.planning,
        )
        cls.planning_config_level_1.org_unit_types.set([cls.org_unit_type])
        cls.planning_config_level_1.org_unit_groups.set([cls.org_unit_group])

        cls.planning_config_level_2 = PlanningConfig.objects.create(
            level=2,
            planning=cls.planning,
        )
        cls.planning_config_level_2.org_unit_types.set([cls.org_unit_type_2])
        cls.planning_config_level_2.org_unit_groups.set([cls.org_unit_group_2])

        cls.ous_by_depth = cls.create_ou_pyramid(total=cls.DATASET_SIZE)
        cls.teams_by_ou_id = cls.create_team_tree(cls.ous_by_depth)
        cls.assignments = cls.create_assignments(
            cls.ous_by_depth,
            cls.teams_by_ou_id,
        )

        cls.analyze_touched_tables()

    def get_url(self, planning_pk: int | None = None) -> str:
        if planning_pk is None:
            planning_pk = self.planning.pk
        return reverse("planning-nested-assignments-teams", kwargs={"parent_lookup_pk": planning_pk})

    def test_perf(self):
        time_limit = 0.5  # 0.5s
        self.client.force_authenticate(self.superuser)
        self.assertEqual(OrgUnit.objects.count(), self.DATASET_SIZE)
        self.assertEqual(Assignment.objects.count(), self.DATASET_SIZE - 1)
        self.assertEqual(Team.objects.count(), self.DATASET_SIZE)

        for limit, expected in [
            (20, time_limit),
            (100, time_limit),
            (1000, time_limit),
            (10_000, time_limit + 0.2),
            (self.DATASET_SIZE - 1, time_limit * 10),
        ]:
            with self.subTest(f"{limit}, {expected}s"):
                with self.assertDurationTakesLessEqual(expected):
                    res = self.client.get(self.get_url(), data={"limit": limit})
                res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
                self.assertValidListData(
                    list_data=res_data, results_key="results", expected_length=limit, paginated=True
                )
