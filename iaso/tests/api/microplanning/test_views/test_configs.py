from typing import Any

from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Group, OrgUnit, OrgUnitType, Planning, PlanningConfig, Project, Team
from iaso.permissions.core_permissions import CORE_PLANNING_READ_PERMISSION, CORE_SUBMISSIONS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class NestedPlanningConfigAPITestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()

        # create accounts
        cls.account = Account.objects.create(name="account")
        cls.other_account = Account.objects.create(name="other_account")

        # create users
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

        # Create test project
        cls.project = Project.objects.create(name="Test Project", app_id="test.app", account=cls.account)
        cls.project_other_account = Project.objects.create(
            name="Test Project other account", app_id="test.app.other_account", account=cls.other_account
        )

        # Create test org unit type
        cls.org_unit_type = OrgUnitType.objects.create(name="Test Country Type")
        cls.org_unit_type.projects.set([cls.project, cls.project_other_account])

        cls.org_unit_type_2 = OrgUnitType.objects.create(name="Test Country Type 2")
        cls.org_unit_type_2.projects.set([cls.project, cls.project_other_account])

        cls.org_unit_type_3 = OrgUnitType.objects.create(name="Test Country Type 3")
        cls.org_unit_type_3.projects.set([cls.project, cls.project_other_account])

        # Create test org unit and groups
        cls.org_unit = OrgUnit.objects.create(name="Test Country", org_unit_type=cls.org_unit_type)

        cls.org_unit_group = Group.objects.create(name="Test Country")
        cls.org_unit_group_2 = Group.objects.create(name="Test Country 2")
        cls.org_unit_group_3 = Group.objects.create(name="Test Country 3")

        # Create test team
        cls.team = Team.objects.create(name="Test Team", project=cls.project, manager=cls.superuser)
        cls.team_other_account = Team.objects.create(
            name="Test Team Other Account", project=cls.project_other_account, manager=cls.user_other_account
        )

        # create planning
        cls.planning = Planning.objects.create(
            name="planning", project=cls.project, team=cls.team, org_unit=cls.org_unit
        )

        cls.planning_other_account = Planning.objects.create(
            name="planning_other_account",
            project=cls.project_other_account,
            team=cls.team_other_account,
            org_unit=cls.org_unit,
        )

        # create configs

        cls.planning_config = PlanningConfig.objects.create(level=1, planning=cls.planning)
        cls.planning_config.org_unit_types.set([cls.org_unit_type, cls.org_unit_type_2])
        cls.planning_config.org_unit_groups.set([cls.org_unit_group, cls.org_unit_group_2])

        cls.planning_config_2 = PlanningConfig.objects.create(level=2, planning=cls.planning)
        cls.planning_config_2.org_unit_types.set([cls.org_unit_type_3])
        cls.planning_config_2.org_unit_groups.set([cls.org_unit_group_3])

    def assertValidData(self, data: Any, expected_length: int) -> None:
        self.assertResponseCompliantToSwagger(data, "PaginatedPlanningConfigList")
        self.assertEqual(len(data["results"]), expected_length)

    def test_permissions(self) -> None:
        res = self.client.get(reverse("planning-configs", kwargs={"pk": self.planning.pk}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user_no_perm)
        res = self.client.get(reverse("planning-configs", kwargs={"pk": self.planning.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_other_perm)
        res = self.client.get(reverse("planning-configs", kwargs={"pk": self.planning.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_read_perm)
        res = self.client.get(reverse("planning-configs", kwargs={"pk": self.planning.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(self.superuser)
        res = self.client.get(reverse("planning-configs", kwargs={"pk": self.planning.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_should_raise_a_404_if_planning_does_not_exist(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(reverse("planning-configs", kwargs={"pk": 1000}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_should_raise_a_404_if_planning_does_not_belong_to_user(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(reverse("planning-configs", kwargs={"pk": self.planning_other_account.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_num_queries(self):
        self.client.force_authenticate(self.superuser)
        with self.assertNumQueries(4):
            res = self.client.get(reverse("planning-configs", kwargs={"pk": self.planning.pk}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 2)

    def test_response(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(reverse("planning-configs", kwargs={"pk": self.planning.pk}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 2)

        results = res_data["results"]

        with self.subTest("assert ordering"):
            self.assertEqual([x["level"] for x in results], [1, 2])

        with self.subTest("assert content"):
            self.assertEqual(
                results[0],
                {
                    "id": self.planning_config.pk,
                    "level": 1,
                    "org_unit_types": [
                        {"id": self.org_unit_type.id, "name": self.org_unit_type.name},
                        {"id": self.org_unit_type_2.id, "name": self.org_unit_type_2.name},
                    ],
                    "org_unit_groups": [
                        {"id": self.org_unit_group.id, "name": self.org_unit_group.name},
                        {"id": self.org_unit_group_2.id, "name": self.org_unit_group_2.name},
                    ],
                },
            )

            self.assertEqual(
                results[1],
                {
                    "id": self.planning_config_2.pk,
                    "level": 2,
                    "org_unit_types": [
                        {"id": self.org_unit_type_3.id, "name": self.org_unit_type_3.name},
                    ],
                    "org_unit_groups": [
                        {"id": self.org_unit_group_3.id, "name": self.org_unit_group_3.name},
                    ],
                },
            )
