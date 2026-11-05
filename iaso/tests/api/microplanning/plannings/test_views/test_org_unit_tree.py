from __future__ import annotations

from typing import Any
from unittest.mock import patch

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.db.models import F
from django.urls import reverse
from rest_framework import status

from iaso.api.microplanning.plannings.serializers.org_unit_tree import OrgUnitBuildTreeSerializer
from iaso.api.microplanning.plannings.views import PlanningViewSet
from iaso.models import (
    Account,
    Group,
    OrgUnit,
    OrgUnitType,
    Planning,
    PlanningConfig,
    Project,
    Team,
)
from iaso.models.org_unit import OrgUnitQuerySet
from iaso.permissions.core_permissions import CORE_PLANNING_READ_PERMISSION, CORE_SUBMISSIONS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class PlanningOrgUnitTreeViewAPITestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()

        # create account
        [cls.account, cls.data_source, cls.source_version, cls.project] = cls.create_account_datasource_version_project(
            "Test Data Source", "Account", "Test Project"
        )

        cls.other_account = Account.objects.create(name="OtherAccount")

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

        # create projects
        cls.project_other_account = Project.objects.create(
            name="Test Project other account", app_id="test.app.other_account", account=cls.other_account
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

        # create org unit groups
        cls.org_unit_group = Group.objects.create(name="Test Org Group")
        cls.org_unit_group_2 = Group.objects.create(name="Test Org Group 2")

        # create org units
        cls.mock_multipolygon = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))

        cls.ou_root = OrgUnit.objects.create(name="Root", version=cls.source_version)
        cls.children_1 = OrgUnit.objects.create(parent=cls.ou_root, version=cls.source_version, name="Child 1")
        cls.children_2 = OrgUnit.objects.create(
            parent=cls.ou_root,
            version=cls.source_version,
            name="Child 2",
            org_unit_type=cls.org_unit_type,
            location=Point(x=4, y=50, z=100),
            simplified_geom=cls.mock_multipolygon,
        )

        cls.children_1_1 = OrgUnit.objects.create(parent=cls.children_1, version=cls.source_version, name="Child 1.1")
        cls.children_1_2 = OrgUnit.objects.create(parent=cls.children_1, version=cls.source_version, name="Child 1.2")

        cls.children_2_1 = OrgUnit.objects.create(
            parent=cls.children_2, version=cls.source_version, name="Child 2.1", org_unit_type=cls.org_unit_type_2
        )
        cls.children_2_1.groups.set([cls.org_unit_group_2])
        cls.children_2_2 = OrgUnit.objects.create(
            parent=cls.children_2, version=cls.source_version, name="Child 2.2", org_unit_type=cls.org_unit_type
        )
        cls.children_2_2.groups.set([cls.org_unit_group])

        cls.children_1_1_1 = OrgUnit.objects.create(
            parent=cls.children_1_1, version=cls.source_version, name="Child 1.1.1"
        )
        cls.children_1_1_2 = OrgUnit.objects.create(
            parent=cls.children_1_1, version=cls.source_version, name="Child 1.1.2"
        )
        cls.children_1_2_1 = OrgUnit.objects.create(
            parent=cls.children_1_2, version=cls.source_version, name="Child 1.2.1"
        )
        cls.children_1_2_2 = OrgUnit.objects.create(
            parent=cls.children_1_2, version=cls.source_version, name="Child 1.2.2"
        )

        cls.children_2_1_1 = OrgUnit.objects.create(
            parent=cls.children_2_1, version=cls.source_version, name="Child 2.1.1", org_unit_type=cls.org_unit_type
        )
        cls.children_2_1_1.groups.set([cls.org_unit_group])

        cls.children_2_1_2 = OrgUnit.objects.create(
            parent=cls.children_2_1, version=cls.source_version, name="Child 2.1.2", org_unit_type=cls.org_unit_type
        )
        cls.children_2_1_2.groups.set([cls.org_unit_group_2])
        cls.children_2_2_1 = OrgUnit.objects.create(
            parent=cls.children_2_2, version=cls.source_version, name="Child 2.2.1", org_unit_type=cls.org_unit_type
        )
        cls.children_2_2_2 = OrgUnit.objects.create(
            parent=cls.children_2_2, version=cls.source_version, name="Child 2.2.2"
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

        # create planning configs for level 1 and 2 for planning
        cls.planning_config_level_1 = PlanningConfig.objects.create(level=1, planning=cls.planning)
        cls.planning_config_level_1.org_unit_types.set([cls.org_unit_type])

        cls.planning_config_level_2 = PlanningConfig.objects.create(level=2, planning=cls.planning)
        cls.planning_config_level_2.org_unit_types.set([cls.org_unit_type_2])
        cls.planning_config_level_2.org_unit_groups.set([cls.org_unit_group_2])

        # create planning configs for level 1 and 2 for planning_2
        cls.planning_2_config_level_1 = PlanningConfig.objects.create(level=1, planning=cls.planning_2)
        cls.planning_2_config_level_1.org_unit_types.set([cls.org_unit_type_2])
        cls.planning_2_config_level_1.org_unit_groups.set([cls.org_unit_group_2])

        cls.planning_2_config_level_2 = PlanningConfig.objects.create(level=2, planning=cls.planning_2)
        cls.planning_2_config_level_2.org_unit_types.set([cls.org_unit_type])
        cls.planning_2_config_level_2.org_unit_groups.set([cls.org_unit_group])

    def get_url(self, pk: int | None = None) -> str:
        if not pk:
            pk = self.planning.pk
        return reverse("planning-org-unit-tree", kwargs={"pk": pk})

    def assertValidResponse(self, data: Any):
        self.assertResponseCompliantToSwagger(data, "OrgUnitTree", True)

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

    def test_num_queries(self):
        self.client.force_authenticate(self.superuser)
        with self.assertNumQueries(7):
            # 1. SELECT PLANNING
            # 2. PREFETCH CONFIGS
            # 3. PREFETCH CONFIGS ORG UNIT TYPES
            # 4. PREFETCH CONFIGS ORG UNIT GROUPS
            # 5. SELECT INITIAL QS FOR OU WITH HIERARCHY
            # 6. RETURN QS (recursive)
            # 7. MIN AGGREGATE IN BUILD TREE
            res = self.client.get(self.get_url(), data={"level": 1})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)

    def test_filters_level(self):
        self.client.force_authenticate(self.superuser)

        with self.subTest("planning 1"):
            data = {"level": 0}

            res = self.client.get(self.get_url(), data)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data, "level", "Ensure this value is greater than or equal to 1.")

            data = {"level": 1}  # means we start to fetch the data that is at level 1 + root level
            res = self.client.get(self.get_url(), data)
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidResponse(res_data)

            self.assertEqual(len(res_data), 1)
            root = res_data[0]
            self.assertEqual(root["id"], self.children_2.pk)
            self.assertEqual(root["depth"], data["level"] + len(str(self.ou_root.path).split(".")))
            self.assertEqual(len(root["children"]), 1)

            data = {"level": 2}  # means we start to fetch the data that is at level 2 + root level
            res = self.client.get(self.get_url(), data)
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidResponse(res_data)

            self.assertEqual(len(res_data), 1)
            root = res_data[0]
            self.assertEqual(root["id"], self.children_2_1.pk)
            self.assertEqual(root["depth"], data["level"] + len(str(self.ou_root.path).split(".")))
            self.assertEqual(len(root["children"]), 2)

        with self.subTest("planning 2"):
            data = {
                "level": 1
            }  # means we start to fetch the data that is at level 1 + children_2 level => children_2_1
            res = self.client.get(self.get_url(pk=self.planning_2.pk), data)
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidResponse(res_data)

            self.assertEqual(len(res_data), 1)
            root = res_data[0]
            self.assertEqual(root["id"], self.children_2_1.pk)
            self.assertEqual(root["depth"], data["level"] + len(str(self.children_2.path).split(".")))
            self.assertEqual(len(root["children"]), 1)

            data = {
                "level": 2
            }  # means we start to fetch the data that is at level 2 + children_2 level => children_2_1_1
            res = self.client.get(self.get_url(pk=self.planning_2.pk), data)
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidResponse(res_data)

            self.assertEqual(len(res_data), 1)
            children_1 = res_data[0]
            self.assertEqual(children_1["id"], self.children_2_1_1.pk)
            self.assertEqual(children_1["depth"], data["level"] + len(str(self.children_2.path).split(".")))

    def test_filters_max_depth(self):
        self.client.force_authenticate(self.superuser)

        with self.subTest("planning 1"):
            data = {"max_depth": 0}

            res = self.client.get(self.get_url(), data)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data, "max_depth", "Ensure this value is greater than or equal to 1.")

            data = {"max_depth": 1}

            res = self.client.get(self.get_url(), data)
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidResponse(res_data)

            root = res_data[0]
            self.assertEqual(root["id"], self.ou_root.pk)
            self.assertEqual(root["depth"], 1)
            self.assertEqual(len(root["children"]), 0)  # we stops there as it's root depth + max depth - 1

            data = {"max_depth": 2}

            res = self.client.get(self.get_url(), data)
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidResponse(res_data)

            root = res_data[0]
            self.assertEqual(root["id"], self.ou_root.pk)
            self.assertEqual(root["depth"], 1)

            self.assertEqual(len(root["children"]), 1)
            children = root["children"][0]

            self.assertEqual(children["id"], self.children_2.pk)
            self.assertEqual(children["depth"], 2)
            self.assertEqual(len(children["children"]), 0)  # we stops there as it's root depth + max depth - 1

        with self.subTest("planning 2"):
            data = {"max_depth": 1}

            res = self.client.get(self.get_url(pk=self.planning_2.pk), data)
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidResponse(res_data)

            root = res_data[0]
            self.assertEqual(root["id"], self.children_2.pk)
            self.assertEqual(root["depth"], 2)
            self.assertEqual(len(root["children"]), 0)  # we stops there as it's children_2 depth + max depth - 1

            data = {"max_depth": 2}

            res = self.client.get(self.get_url(pk=self.planning_2.pk), data)
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidResponse(res_data)

            root = res_data[0]
            self.assertEqual(root["id"], self.children_2.pk)
            self.assertEqual(root["depth"], 2)

            self.assertEqual(len(root["children"]), 1)
            children = root["children"][0]

            self.assertEqual(children["id"], self.children_2_1.pk)
            self.assertEqual(children["depth"], 3)
            self.assertEqual(len(children["children"]), 0)  # we stops there as it's root depth + max depth - 1 = 2 + 1

    def test_filters_level_and_max_depth(self):
        self.client.force_authenticate(self.superuser)

        # means we start to fetch the data that is at level 2 + root level and that the max_depth is root_level + max_depth - 1 = root_level + 1 => so we naturally should get 0 values as 2 + x >= x + 1
        data = {
            "level": 2,
            "max_depth": 2,
        }
        res = self.client.get(self.get_url(), data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)

        self.assertEqual(len(res_data), 0)

        # means we start to fetch the data that is at level 2 + root level and that the max_depth is root_level + max_depth - 1 = root_level + 1, so we should get exactly one value : x + 2 = x + 2
        data = {"level": 2, "max_depth": 3}
        res = self.client.get(self.get_url(), data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)

        self.assertEqual(len(res_data), 1)
        root = res_data[0]
        self.assertEqual(root["id"], self.children_2_1.pk)
        self.assertEqual(root["depth"], 3)
        self.assertEqual(len(root["children"]), 0)  # <= should be 2 here, but with max_depth, it's 0

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

    def test_tree(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.get_url())
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)

        self.assertEqual(len(res_data), 1)

        # tree should be
        # root
        # |── children_2
        #   |── children_2_1
        #     |── children_2_1_1
        #     |── children_2_1_2

        # getting first child which should be root
        root = res_data[0]

        self.assertCountEqual(
            list(root.keys()),
            ["id", "name", "depth", "parent", "org_unit_type", "has_geo_json", "has_location", "children"],
        )
        self.assertEqual(root["id"], self.ou_root.pk)
        self.assertEqual(root["name"], "Root")
        self.assertEqual(root["depth"], 1)
        self.assertIsNone(root["parent"])
        self.assertIsNone(root["org_unit_type"])
        self.assertFalse(root["has_geo_json"])
        self.assertFalse(root["has_location"])

        # checking children_2
        children = root["children"]
        self.assertEqual(len(children), 1)
        children = children[0]

        self.assertEqual(children["id"], self.children_2.pk)
        self.assertEqual(children["name"], "Child 2")
        self.assertEqual(children["depth"], 2)
        self.assertEqual(children["parent"], self.ou_root.pk)
        self.assertEqual(
            children["org_unit_type"],
            {
                "id": self.org_unit_type.pk,
                "name": self.org_unit_type.name,
                "short_name": "TCT",
                "category": self.org_unit_type.category,
            },
        )
        self.assertTrue(children["has_geo_json"])
        self.assertTrue(children["has_location"])

        # checking children_2_1
        sub_children = children["children"]
        self.assertEqual(len(sub_children), 1)
        sub_children = sub_children[0]

        self.assertEqual(sub_children["id"], self.children_2_1.pk)
        self.assertEqual(sub_children["name"], "Child 2.1")
        self.assertEqual(sub_children["depth"], 3)
        self.assertEqual(sub_children["parent"], self.children_2.pk)
        self.assertEqual(
            sub_children["org_unit_type"],
            {
                "id": self.org_unit_type_2.pk,
                "name": self.org_unit_type_2.name,
                "short_name": "TCT2",
                "category": self.org_unit_type_2.category,
            },
        )
        self.assertFalse(sub_children["has_geo_json"])
        self.assertFalse(sub_children["has_location"])

        # checking children_2_1_1 and children_2_1_2
        sub_sub_children = sub_children.get("children")
        self.assertEqual(len(sub_sub_children), 2)

        first_sub_sub_children = sub_sub_children[0]
        self.assertEqual(first_sub_sub_children["id"], self.children_2_1_1.pk)
        self.assertEqual(first_sub_sub_children["name"], "Child 2.1.1")
        self.assertEqual(first_sub_sub_children["depth"], 4)
        self.assertEqual(first_sub_sub_children["parent"], self.children_2_1.pk)
        self.assertEqual(
            first_sub_sub_children["org_unit_type"],
            {
                "id": self.org_unit_type.pk,
                "name": self.org_unit_type.name,
                "short_name": "TCT",
                "category": self.org_unit_type.category,
            },
        )
        self.assertFalse(first_sub_sub_children["has_geo_json"])
        self.assertFalse(first_sub_sub_children["has_location"])

        second_sub_sub_children = sub_sub_children[1]
        self.assertEqual(second_sub_sub_children["id"], self.children_2_1_2.pk)
        self.assertEqual(second_sub_sub_children["name"], "Child 2.1.2")
        self.assertEqual(second_sub_sub_children["depth"], 4)
        self.assertEqual(second_sub_sub_children["parent"], self.children_2_1.pk)
        self.assertEqual(
            second_sub_sub_children["org_unit_type"],
            {
                "id": self.org_unit_type.pk,
                "name": self.org_unit_type.name,
                "short_name": "TCT",
                "category": self.org_unit_type.category,
            },
        )
        self.assertFalse(second_sub_sub_children["has_geo_json"])
        self.assertFalse(second_sub_sub_children["has_location"])

    def test_tree_planning_2(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(self.get_url(pk=self.planning_2.pk))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)

        self.assertEqual(len(res_data), 1)

        # tree should be
        # children_2
        # |── children_2_1
        #  |── children_2_1_1

        # getting first child which should be children_2
        root = res_data[0]

        self.assertCountEqual(
            list(root.keys()),
            ["id", "name", "depth", "parent", "org_unit_type", "has_geo_json", "has_location", "children"],
        )
        self.assertEqual(root["id"], self.children_2.pk)
        self.assertEqual(root["name"], "Child 2")
        self.assertEqual(root["depth"], 2)
        self.assertEqual(root["parent"], self.ou_root.pk)
        self.assertEqual(
            root["org_unit_type"],
            {
                "id": self.org_unit_type.pk,
                "name": self.org_unit_type.name,
                "short_name": "TCT",
                "category": self.org_unit_type.category,
            },
        )
        self.assertTrue(root["has_geo_json"])
        self.assertTrue(root["has_location"])

        # checking children_2_1
        children = root["children"]
        self.assertEqual(len(children), 1)
        children = children[0]

        self.assertEqual(children["id"], self.children_2_1.pk)
        self.assertEqual(children["name"], "Child 2.1")
        self.assertEqual(children["depth"], 3)
        self.assertEqual(children["parent"], self.children_2.pk)
        self.assertEqual(
            children["org_unit_type"],
            {
                "id": self.org_unit_type_2.pk,
                "name": self.org_unit_type_2.name,
                "short_name": "TCT2",
                "category": self.org_unit_type_2.category,
            },
        )
        self.assertFalse(children["has_geo_json"])
        self.assertFalse(children["has_location"])

        # checking children_2_1_1
        sub_children = children["children"]
        self.assertEqual(len(sub_children), 1)
        sub_children = sub_children[0]

        self.assertEqual(sub_children["id"], self.children_2_1_1.pk)
        self.assertEqual(sub_children["name"], "Child 2.1.1")
        self.assertEqual(sub_children["depth"], 4)
        self.assertEqual(sub_children["parent"], self.children_2_1.pk)
        self.assertEqual(
            sub_children["org_unit_type"],
            {
                "id": self.org_unit_type.pk,
                "name": self.org_unit_type.name,
                "short_name": "TCT",
                "category": self.org_unit_type.category,
            },
        )
        self.assertFalse(sub_children["has_geo_json"])
        self.assertFalse(sub_children["has_location"])

    def test_build_org_unit_tree_should_remove_orphan(self):
        """
        Considering the setup

        A -> B -> C

        Where A and C are valid, but not B

        Then the build tree should return only A
        """

        res = PlanningViewSet._build_org_unit_tree(
            OrgUnit.objects.annotate(depth=F("path__depth")).filter(pk__in=[self.ou_root.pk, self.children_2_1.pk]),
            OrgUnitBuildTreeSerializer,
        )
        self.assertEqual(
            res,
            [
                {
                    "id": self.ou_root.pk,
                    "name": self.ou_root.name,
                    "parent": None,
                    "depth": 1,
                    "children": [],
                    "org_unit_type": None,
                }
            ],
        )

    def test_queryset_should_exclude_descendants_of_rejected_org_units(self):
        """
        Given:

        Root
        └── Child 2 (rejected by level 1 config)
            └── Child 2.1 (would match level 2 config)

        Child 2.1 should not be returned because its parent is rejected.
        """
        self.planning_config_level_1.org_unit_types.set([self.org_unit_type_2])

        self.client.force_authenticate(self.superuser)

        original_build_org_unit_tree = PlanningViewSet._build_org_unit_tree

        def assert_queryset_has_no_orphans(queryset):
            org_units = list(queryset)
            org_unit_ids = {org_unit.pk for org_unit in org_units}

            # Root is always included.
            self.assertEqual(org_unit_ids, {self.ou_root.pk})

            # Child 2 is rejected, and Child 2.1 must not become an orphan.
            self.assertNotIn(self.children_2.pk, org_unit_ids)
            self.assertNotIn(self.children_2_1.pk, org_unit_ids)

            return original_build_org_unit_tree(queryset)

        # patching _build_org_unit_tree to do our test assert as it's the method that gets the queryset
        with patch.object(
            PlanningViewSet,
            "_build_org_unit_tree",
            side_effect=assert_queryset_has_no_orphans,
        ):
            res = self.client.get(self.get_url())

        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_get_queryset_returns_distinct_values(self):
        """
        To double-check that the filter upon the m2m groups from OU returns distinct values
        """

        self.children_2.groups.set([self.org_unit_group, self.org_unit_group_2])

        self.planning_config_level_1.org_unit_groups.set([self.org_unit_group, self.org_unit_group_2])

        self.client.force_authenticate(self.superuser)
        original_build_org_unit_tree = PlanningViewSet._build_org_unit_tree

        def assertHasNoDuplicates(queryset: OrgUnitQuerySet, serializer):
            self.assertEqual(queryset.count(), queryset.distinct().count())
            return original_build_org_unit_tree(queryset, serializer)

        with patch.object(
            PlanningViewSet,
            "_build_org_unit_tree",
            side_effect=assertHasNoDuplicates,
        ):
            res = self.client.get(self.get_url())

        self.assertJSONResponse(res, status.HTTP_200_OK)
