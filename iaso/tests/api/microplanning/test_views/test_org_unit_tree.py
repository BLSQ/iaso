from __future__ import annotations

from typing import Any
from unittest import skip

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.urls import reverse
from rest_framework import status

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

        cls.ou_root = OrgUnit.objects.create(name="ou_root", version=cls.source_version)
        cls.children_1 = OrgUnit.objects.create(parent=cls.ou_root, version=cls.source_version, name="Child 1")
        cls.children_2 = OrgUnit.objects.create(
            parent=cls.ou_root,
            version=cls.source_version,
            name="Child 2",
            org_unit_type=cls.org_unit_type,
            location=Point(x=4, y=50, z=100),
            geom=cls.mock_multipolygon,
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
        self.fail()

    def test_filters_max_depth(self):
        self.fail()

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
        print(res_data)

        # getting first child which should be root
        root = res_data[0]

        self.assertEqual(root.get("id"), 1)
        self.assertEqual(root.get("name"), "Planning")

    def test_build_org_unit_tree_should_remove_orphan(self):
        """
        Considering the setup

        A -> B -> C

        Where A and C are valid, but not B

        Then the build tree should return only A
        """

        self.fail()
