from __future__ import annotations

from typing import Any
from unittest import skip

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.db.models import F
from django.urls import reverse
from rest_framework import status

from iaso.api.microplanning.views import PlanningViewSet
from iaso.models import (
    Account,
    DataSource,
    Group,
    OrgUnit,
    OrgUnitType,
    Planning,
    PlanningConfig,
    Project,
    SourceVersion,
    Team,
)
from iaso.permissions.core_permissions import CORE_PLANNING_READ_PERMISSION, CORE_SUBMISSIONS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class PlanningOrgUnitTreeViewAPITestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()

        # create account
        cls.account = Account.objects.create(name="Account")
        cls.data_source = DataSource.objects.create(name="Test Data Source")
        cls.source_version = SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account.default_version = cls.source_version
        cls.account.save()

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
        cls.project = Project.objects.create(name="Test Project", app_id="test.app", account=cls.account)
        cls.project_other_account = Project.objects.create(
            name="Test Project other account", app_id="test.app.other_account", account=cls.other_account
        )
        cls.data_source.projects.add(cls.project)

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
            parent=cls.children_2_1, version=cls.source_version, name="Child 2.1.1"
        )
        cls.children_2_1_2 = OrgUnit.objects.create(
            parent=cls.children_2_1, version=cls.source_version, name="Child 2.1.2"
        )
        cls.children_2_2_1 = OrgUnit.objects.create(
            parent=cls.children_2_2, version=cls.source_version, name="Child 2.2.1"
        )
        cls.children_2_2_2 = OrgUnit.objects.create(
            parent=cls.children_2_2, version=cls.source_version, name="Child 2.2.2"
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

        # create planning configs for level 1 and 2
        cls.planning_config_level_1 = PlanningConfig.objects.create(level=1, planning=cls.planning)
        cls.planning_config_level_1.org_unit_types.set([cls.org_unit_type])

        cls.planning_config_level_2 = PlanningConfig.objects.create(level=2, planning=cls.planning)
        cls.planning_config_level_2.org_unit_types.set([cls.org_unit_type_2])
        cls.planning_config_level_2.org_unit_groups.set([cls.org_unit_group_2])

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
            res = self.client.get(self.get_url())
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)

    def test_filters_level(self):
        self.client.force_authenticate(self.superuser)

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

    def test_filters_max_depth(self):
        self.client.force_authenticate(self.superuser)

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

    @skip("IA-5599")
    def test_should_raise_404_if_planning_is_deleted_or_does_not_exist(self):
        self.planning.delete()
        self.planning.refresh_from_db()
        self.assertIsNone(self.planning.deleted_at)

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
        # |── children_2_1
        #     |── children_2_1_1
        #     |── children_2_1_2

        # getting first child which should be root
        root = res_data[0]

        self.assertCountEqual(
            list(root.keys()),
            ["id", "name", "depth", "parent", "org_unit_type", "has_geo_json", "has_location", "children"],
        )
        self.assertEqual(root.get("id"), self.ou_root.pk)
        self.assertEqual(root.get("name"), "Root")
        self.assertEqual(root.get("depth"), 1)
        self.assertIsNone(root.get("parent"))
        self.assertIsNone(root.get("org_unit_type"))
        self.assertFalse(root.get("has_geo_json"))
        self.assertFalse(root.get("has_location"))

        # checking children_2
        children = root.get("children")
        self.assertEqual(len(children), 1)
        children = children[0]

        self.assertEqual(children.get("id"), self.children_2.pk)
        self.assertEqual(children.get("name"), "Child 2")
        self.assertEqual(children.get("depth"), 2)
        self.assertEqual(children.get("parent"), self.ou_root.pk)
        self.assertEqual(
            children.get("org_unit_type"),
            {
                "id": self.org_unit_type.pk,
                "name": self.org_unit_type.name,
                "short_name": "TCT",
                "category": self.org_unit_type.category,
            },
        )
        self.assertTrue(children.get("has_geo_json"))
        self.assertTrue(children.get("has_location"))

        # checking children_2_1
        sub_children = children.get("children")
        self.assertEqual(len(sub_children), 1)
        sub_children = sub_children[0]

        self.assertEqual(sub_children.get("id"), self.children_2_1.pk)
        self.assertEqual(sub_children.get("name"), "Child 2.1")
        self.assertEqual(sub_children.get("depth"), 3)
        self.assertEqual(sub_children.get("parent"), self.children_2.pk)
        self.assertEqual(
            sub_children.get("org_unit_type"),
            {
                "id": self.org_unit_type_2.pk,
                "name": self.org_unit_type_2.name,
                "short_name": "TCT2",
                "category": self.org_unit_type_2.category,
            },
        )
        self.assertFalse(sub_children.get("has_geo_json"))
        self.assertFalse(sub_children.get("has_location"))

        # checking children_2_1_1 and children_2_1_2
        sub_sub_children = sub_children.get("children")
        self.assertEqual(len(sub_sub_children), 2)

        first_sub_sub_children = sub_sub_children[0]
        self.assertEqual(first_sub_sub_children.get("id"), self.children_2_1_1.pk)
        self.assertEqual(first_sub_sub_children.get("name"), "Child 2.1.1")
        self.assertEqual(first_sub_sub_children.get("depth"), 4)
        self.assertEqual(first_sub_sub_children.get("parent"), self.children_2_1.pk)
        self.assertIsNone(first_sub_sub_children.get("org_unit_type"))
        self.assertFalse(first_sub_sub_children.get("has_geo_json"))
        self.assertFalse(first_sub_sub_children.get("has_location"))

        second_sub_sub_children = sub_sub_children[1]
        self.assertEqual(second_sub_sub_children.get("id"), self.children_2_1_2.pk)
        self.assertEqual(second_sub_sub_children.get("name"), "Child 2.1.2")
        self.assertEqual(second_sub_sub_children.get("depth"), 4)
        self.assertEqual(second_sub_sub_children.get("parent"), self.children_2_1.pk)
        self.assertIsNone(second_sub_sub_children.get("org_unit_type"))
        self.assertFalse(second_sub_sub_children.get("has_geo_json"))
        self.assertFalse(second_sub_sub_children.get("has_location"))

    def test_build_org_unit_tree_should_remove_orphan(self):
        """
        Considering the setup

        A -> B -> C

        Where A and C are valid, but not B

        Then the build tree should return only A
        """

        res = PlanningViewSet._build_org_unit_tree(
            OrgUnit.objects.annotate(depth=F("path__depth")).filter(pk__in=[self.ou_root.pk, self.children_2_1.pk])
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
