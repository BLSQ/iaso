from __future__ import annotations

from typing import Any

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.urls import reverse
from rest_framework import status

from iaso.models import Group, OrgUnit, OrgUnitType, Planning, PlanningConfig, Team
from iaso.permissions.core_permissions import CORE_PLANNING_READ_PERMISSION, CORE_SUBMISSIONS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class PlanningLevelsOrgUnitCountViewAPITestCase(SwaggerTestCaseMixin, APITestCase):
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
        cls.team = Team.objects.create(name="Test Team", project=cls.project, manager=cls.superuser)
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
            parent=cls.ou_root, version=cls.source_version, name="Child 1", validation_status=OrgUnit.VALIDATION_VALID
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
            name="planning", project=cls.project, team=cls.team, org_unit=cls.ou_root
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

    def assertValidBody(self, body: Any) -> None:
        self.assertResponseCompliantToSwagger(body, "LevelOrgUnitCountRequest", True)

    def assertValidResponse(self, data: Any, expected_length: int) -> None:
        self.assertEqual(len(data), expected_length)
        self.assertResponseCompliantToSwagger(data, "LevelOrgUnitCountResponse", True)

    def get_url(self, pk: int | None = None) -> str:
        if not pk:
            pk = self.planning.pk
        return reverse("planning-levels-org-unit-count", kwargs={"pk": pk})

    def test_permissions(self):
        res = self.client.post(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user_no_perm)
        res = self.client.post(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_other_perm)
        res = self.client.post(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_read_perm)
        res = self.client.post(self.get_url(), data=[])
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(self.superuser)
        res = self.client.post(self.get_url(), data=[])
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_should_raise_404_if_planning_is_deleted_or_does_not_exist(self):
        self.planning.delete()
        self.assertSoftDeleted(self.planning)

        self.client.force_authenticate(self.superuser)
        res = self.client.post(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        res = self.client.post(self.get_url(Planning.objects.all().order_by("-id").first().pk + 1))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_should_raise_404_if_planning_belongs_to_another_account(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.post(self.get_url(self.planning_other_account.pk))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_should_not_raise_a_404_if_planning_is_deprecated(self):
        self.planning.deprecated = True
        self.planning.save()

        self.client.force_authenticate(self.superuser)
        res = self.client.post(self.get_url(), data=[])
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_num_queries(self):
        self.client.force_authenticate(self.superuser)

        with self.subTest("without body"):
            body = []
            self.assertValidBody(body)
            with self.assertNumQueries(6):
                # 1. SELECT PLANNING
                # 2. PREFETCH PLANNING CONFIG
                # 3. PREFETCH PLANNING CONFIG OUT
                # 4. PREFETCH PLANNING CONFIG GROUPS
                # 5. OU FILTER FOR USER
                # 6. RECURSIVE
                res = self.client.post(self.get_url(), data=body)
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidResponse(res_data, 3)

        with self.subTest("with body"):
            body = [
                {
                    "level": 2,
                    "org_unit_types": [self.org_unit_type_2.pk],
                    "org_unit_groups": [self.org_unit_group_2.pk],
                },
                {
                    "level": 3,
                    "org_unit_types": [self.org_unit_type_2.pk],
                    "org_unit_groups": [self.org_unit_group_2.pk],
                },
            ]
            self.assertValidBody(body)
            with self.assertNumQueries(7):
                # 1. SELECT PLANNING
                # 2: OUT SERIALIZER QUERYSET VALIDATION
                # 3: GROUP SERIALIZER QUERYSET VALIDATION
                # 4: OUT SERIALIZER QUERYSET VALIDATION - SECOND ITEM
                # 5: GROUP SERIALIZER QUERYSET VALIDATION - SECOND ITEM
                # 6: OU FILTER FOR USER
                # 7: RECURSIVE
                res = self.client.post(self.get_url(), data=body)
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidResponse(res_data, 3)

    def test_validation_org_unit_types(self):
        self.client.force_authenticate(self.superuser)
        with self.subTest("org unit type other account"):
            body = [{"level": 1}, {"level": 2, "org_unit_types": [self.org_unit_type_other_account.pk]}]
            self.assertValidBody(body)
            res = self.client.post(self.get_url(), data=body)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(
                res_data,
                [
                    {},
                    {
                        "org_unit_types": [
                            f'Invalid pk "{self.org_unit_type_other_account.pk}" - object does not exist.'
                        ]
                    },
                ],
            )

        with self.subTest("org unit type that does not exist"):
            pk = OrgUnitType.objects.order_by("-pk").first().pk + 1
            body = [{"level": 1}, {"level": 2, "org_unit_types": [pk]}]
            self.assertValidBody(body)
            res = self.client.post(self.get_url(), data=body)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(
                res_data,
                [{}, {"org_unit_types": [f'Invalid pk "{pk}" - object does not exist.']}],
            )

    def test_validation_levels(self):
        self.client.force_authenticate(self.superuser)

        with self.subTest("level is required"):
            body = [{}]
            # self.assertValidBody(body) swagger will fail obviously :)
            res = self.client.post(self.get_url(), data=body)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(res_data, [{"level": ["This field is required."]}])

        with self.subTest("level must be > 0"):
            body = [{"level": 0}]
            # self.assertValidBody(body) swagger will fail obviously :)
            res = self.client.post(self.get_url(), data=body)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(res_data, [{"level": ["Ensure this value is greater than or equal to 1."]}])

            body = [{"level": 1}]
            self.assertValidBody(body)
            res = self.client.post(self.get_url(), data=body)
            self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_validation_org_unit_groups(self):
        self.client.force_authenticate(self.superuser)
        with self.subTest("org unit group other account"):
            body = [{"level": 1}, {"level": 2, "org_unit_groups": [self.org_unit_group_other_account.pk]}]
            self.assertValidBody(body)
            res = self.client.post(self.get_url(), data=body)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(
                res_data,
                [
                    {},
                    {
                        "org_unit_groups": [
                            f'Invalid pk "{self.org_unit_group_other_account.pk}" - object does not exist.'
                        ]
                    },
                ],
            )

        with self.subTest("org unit type that does not exist"):
            pk = Group.objects.order_by("-pk").first().pk + 1
            body = [{"level": 1}, {"level": 2, "org_unit_groups": [pk]}]
            self.assertValidBody(body)
            res = self.client.post(self.get_url(), data=body)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(
                res_data,
                [{}, {"org_unit_groups": [f'Invalid pk "{pk}" - object does not exist.']}],
            )

    def test_happy_path_with_body(self):
        self.client.force_authenticate(self.superuser)
        # unfiltered tree is :
        # Root
        # ├── Child 1
        # |   ├── Child 1.1
        # |   |   ├── Child 1.1.1
        # |   |   └── Child 1.1.2
        # |   └── Child 1.2
        # |       ├── Child 1.2.1
        # |       └── Child 1.2.2
        # └── Child 2 (org_unit_type)
        #     ├── Child 2.1 (org_unit_type_2) (org_unit_group_2)
        #     |   ├── Child 2.1.1 (org_unit_type) (org_unit_group)
        #     |   └── Child 2.1.2 (org_unit_type) (org_unit_group_2)
        #     └── Child 2.2 (org_unit_type) (org_unit_group)
        #       ├── Child 2.2.1 (org_unit_type)
        #       └── Child 2.2.2

        data = [
            {"level": 2, "org_unit_types": [self.org_unit_type_2.pk], "org_unit_groups": [self.org_unit_group_2.pk]},
            {"level": 3},
        ]
        self.assertValidBody(data)
        # filtered tree with those new levels should be
        # Root
        # ├── Child 1
        # └── Child 2 (org_unit_type)
        #     └── Child 2.1 (org_unit_type_2) (org_unit_group_2)
        #         ├── Child 2.1.1 (org_unit_type) (org_unit_group)
        #         └── Child 2.1.2 (org_unit_type) (org_unit_group_2)

        res = self.client.post(self.get_url(), data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 4)
        self.assertCountEqual(
            res_data,
            [
                {"level": 0, "depth": 1, "count": 1},
                {"level": 1, "depth": 2, "count": 2},
                {"level": 2, "depth": 3, "count": 1},
                {"level": 3, "depth": 4, "count": 2},
            ],
        )

    def test_happy_path_empty_body(self):
        # tree should be
        # root
        # |── children_2 -> level 1 config
        #   |── children_2_1 -> level 2 config
        #     |── children_2_1_1
        #     |── children_2_1_2
        # so data should be:
        # level: 0, count: 1
        # level: 1, count: 1
        # level: 2, count: 1
        self.client.force_authenticate(self.superuser)
        body = []
        self.assertValidBody(body)
        res = self.client.post(self.get_url(), data=body)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 3)
        self.assertCountEqual(
            res_data,
            [
                {"level": 0, "depth": 1, "count": 1},
                {"level": 1, "depth": 2, "count": 1},
                {"level": 2, "depth": 3, "count": 1},
            ],
        )

    def test_only_valid_org_unit_should_be_included(self):
        # tree should normally be
        # root
        # |── children_2 -> level 1 config
        #   |── children_2_1 -> level 2 config
        #     |── children_2_1_1
        #     |── children_2_1_2
        # so data should be:
        # level: 0, count: 1
        # level: 1, count: 1
        # level: 2, count: 1
        # But setting children_2 to REJECTED or NEW
        # root
        # level: 0, count: 1
        self.client.force_authenticate(self.superuser)
        body = []
        self.assertValidBody(body)
        res = self.client.post(self.get_url(), data=body)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 3)
        self.assertCountEqual(
            res_data,
            [
                {"level": 0, "depth": 1, "count": 1},
                {"level": 1, "depth": 2, "count": 1},
                {"level": 2, "depth": 3, "count": 1},
            ],
        )

        for validation_status in [OrgUnit.VALIDATION_REJECTED, OrgUnit.VALIDATION_NEW]:
            with self.subTest(f"validation status {validation_status}"):
                self.children_2.validation_status = validation_status
                self.children_2.save()

                body = []
                self.assertValidBody(body)
                res = self.client.post(self.get_url(), data=body)
                res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
                self.assertValidResponse(res_data, 1)
                self.assertCountEqual(
                    res_data,
                    [{"level": 0, "depth": 1, "count": 1}],
                )
