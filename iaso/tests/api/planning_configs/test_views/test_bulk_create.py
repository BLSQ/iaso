from typing import Any

from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings

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
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION, CORE_SUBMISSIONS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class PlanningConfigBulkCreateAPITestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()

        # create accounts
        cls.account = Account.objects.create(name="account")

        cls.data_source = DataSource.objects.create(name="Test Data Source")
        cls.source_version = SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account.default_version = cls.source_version
        cls.account.save()

        cls.other_account = Account.objects.create(name="other_account")
        cls.data_source_other_account = DataSource.objects.create(name="Test Data Source 2")
        cls.source_version_other_account = SourceVersion.objects.create(
            data_source=cls.data_source_other_account, number=1
        )
        cls.other_account.default_version = cls.source_version_other_account
        cls.other_account.save()

        # set up users
        cls.user_no_perm = cls.create_user_with_profile(username="user_no_perm", account=cls.account, permissions=[])
        cls.user_write_perm = cls.create_user_with_profile(
            username="user_read_perm", account=cls.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
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
        cls.project2 = Project.objects.create(name="Test Project2", app_id="test.app2", account=cls.account)
        cls.project_other_account = Project.objects.create(
            name="Test Project other account", app_id="test.app.other_account", account=cls.other_account
        )

        cls.data_source.projects.add(cls.project)
        cls.data_source_other_account.projects.add(cls.project_other_account)

        # Create test org unit types
        cls.org_unit_type = OrgUnitType.objects.create(name="Test Country Type")
        # setting up two projects to be sure that the queryset in serializer PK field is returning distinct values
        cls.org_unit_type.projects.set([cls.project, cls.project2])

        cls.org_unit_type_2 = OrgUnitType.objects.create(name="Test Country Type 2")
        cls.org_unit_type_2.projects.set([cls.project])

        cls.org_unit_type_other_account = OrgUnitType.objects.create(name="Test Country Type 3")
        cls.org_unit_type_other_account.projects.set([cls.project_other_account])

        # Create test org unit groups
        cls.ou = OrgUnit.objects.create(
            name="Test Country", org_unit_type=cls.org_unit_type, version=cls.source_version
        )
        cls.org_unit_group = Group.objects.create(name="Test Country", source_version=cls.source_version)
        cls.org_unit_group_2 = Group.objects.create(name="Test Country", source_version=cls.source_version)
        cls.org_unit_group_other_account = Group.objects.create(
            name="Test Country", source_version=cls.source_version_other_account
        )

        # Create test team
        cls.team = Team.objects.create(name="Test Team", project=cls.project, manager=cls.superuser)
        cls.team_other_account = Team.objects.create(
            name="Test Team Other Account", project=cls.project_other_account, manager=cls.user_other_account
        )

        # create plannings

        cls.planning = Planning.objects.create(name="planning", project=cls.project, team=cls.team, org_unit=cls.ou)

        cls.planning_other_account = Planning.objects.create(
            name="planning_other_account",
            project=cls.project_other_account,
            team=cls.team_other_account,
            org_unit=cls.ou,
        )

    def assertValidBody(self, body: list[dict[str, Any]]):
        self.assertResponseCompliantToSwagger(body, "PlanningConfigBulkCreateRequest", True)

    def assertValidResponse(self, data: list[dict[str, Any]], expected_length: int):
        self.assertResponseCompliantToSwagger(data, "PlanningConfigBulkCreate", True)
        self.assertEqual(len(data), expected_length)

    def test_permissions(self):
        res = self.client.post(reverse("planning_configs-bulk-create"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user_no_perm)
        res = self.client.post(reverse("planning_configs-bulk-create"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_other_perm)
        res = self.client.post(reverse("planning_configs-bulk-create"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_write_perm)
        res = self.client.post(reverse("planning_configs-bulk-create"), data={})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.superuser)
        res = self.client.post(reverse("planning_configs-bulk-create"), data={})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validation(self):
        self.client.force_authenticate(self.superuser)

        with self.subTest("planning other account"):
            data = [
                {
                    "planning": self.planning_other_account.pk,
                    "level": 2,
                    "org_unit_types": [self.org_unit_type.pk],
                    "org_unit_groups": [self.org_unit_group.pk],
                }
            ]
            self.assertValidBody(data)
            res = self.client.post(reverse("planning_configs-bulk-create"), data=data)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data[0], "planning")

        with self.subTest("org_unit_types other account"):
            data = [
                {
                    "planning": self.planning.pk,
                    "level": 2,
                    "org_unit_types": [self.org_unit_type_other_account.pk],
                    "org_unit_groups": [self.org_unit_group.pk],
                }
            ]
            self.assertValidBody(data)
            res = self.client.post(reverse("planning_configs-bulk-create"), data=data)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data[0], "org_unit_types")

        with self.subTest("org_unit_groups other account"):
            data = [
                {
                    "planning": self.planning.pk,
                    "level": 2,
                    "org_unit_types": [self.org_unit_type.pk],
                    "org_unit_groups": [self.org_unit_group_other_account.pk],
                }
            ]
            self.assertValidBody(data)
            res = self.client.post(reverse("planning_configs-bulk-create"), data=data)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data[0], "org_unit_groups")

        with self.subTest("level"):
            for level in [-1, 0]:
                data = [
                    {
                        "planning": self.planning.pk,
                        "level": level,
                        "org_unit_types": [self.org_unit_type.pk],
                        "org_unit_groups": [self.org_unit_group.pk],
                    }
                ]
                # self.assertValidBody(data) # will crash , logic
                res = self.client.post(reverse("planning_configs-bulk-create"), data=data)
                res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
                self.assertHasError(res_data[0], "level")

    def test_level_planning_uniqueness_within_data(self):
        self.client.force_authenticate(self.superuser)
        data = [
            {
                "planning": self.planning.pk,
                "level": 2,
                "org_unit_types": [self.org_unit_type.pk],
                "org_unit_groups": [self.org_unit_group.pk],
            },
            {
                "planning": self.planning.pk,
                "level": 2,
                "org_unit_types": [self.org_unit_type.pk, self.org_unit_type_2.pk],
                "org_unit_groups": [self.org_unit_group.pk, self.org_unit_group_2.pk],
            },
        ]
        self.assertValidBody(data)

        res = self.client.post(reverse("planning_configs-bulk-create"), data)

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(res_data, api_settings.NON_FIELD_ERRORS_KEY, "Level and planning must be unique together")

    def test_level_planning_uniqueness_with_existing_data(self):
        PlanningConfig.objects.create(level=2, planning=self.planning)

        self.client.force_authenticate(self.superuser)
        data = [
            {
                "planning": self.planning.pk,
                "level": 2,
                "org_unit_types": [self.org_unit_type.pk],
                "org_unit_groups": [self.org_unit_group.pk],
            }
        ]
        self.assertValidBody(data)

        res = self.client.post(reverse("planning_configs-bulk-create"), data)

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(
            res_data[0], api_settings.NON_FIELD_ERRORS_KEY, "The fields planning, level must make a unique set."
        )

    def test_num_queries(self):
        self.client.force_authenticate(self.superuser)
        data = [
            {
                "planning": self.planning.pk,
                "level": 1,
                "org_unit_types": [self.org_unit_type.pk],
                "org_unit_groups": [self.org_unit_group.pk],
            },
            {
                "planning": self.planning.pk,
                "level": 2,
                "org_unit_types": [self.org_unit_type.pk, self.org_unit_type_2.pk],
                "org_unit_groups": [self.org_unit_group.pk, self.org_unit_group_2.pk],
            },
        ]
        self.assertValidBody(data)

        with self.assertNumQueries(33):
            res = self.client.post(reverse("planning_configs-bulk-create"), data)

        res_data = self.assertJSONResponse(res, status.HTTP_201_CREATED)

        self.assertValidResponse(res_data, 2)

        # check in db
        self.assertEqual(PlanningConfig.objects.filter(pk__in=[x["id"] for x in res_data]).count(), 2)

    def test_happy_path(self):
        self.client.force_authenticate(self.superuser)
        data = [
            {
                "planning": self.planning.pk,
                "level": 1,
                "org_unit_types": [self.org_unit_type.pk],
                "org_unit_groups": [self.org_unit_group.pk],
            },
            {
                "planning": self.planning.pk,
                "level": 2,
                "org_unit_types": [self.org_unit_type.pk, self.org_unit_type_2.pk],
                "org_unit_groups": [self.org_unit_group.pk, self.org_unit_group_2.pk],
            },
        ]
        self.assertValidBody(data)
        res = self.client.post(reverse("planning_configs-bulk-create"), data)
        res_data = self.assertJSONResponse(res, status.HTTP_201_CREATED)

        self.assertValidResponse(res_data, 2)

        # check in db
        first_planning_config = PlanningConfig.objects.get(pk=res_data[0]["id"])

        self.assertEqual(first_planning_config.planning_id, self.planning.pk)
        self.assertEqual(first_planning_config.level, 1)
        self.assertEqual(
            list(first_planning_config.org_unit_types.values_list("id", flat=True)), [self.org_unit_type.pk]
        )
        self.assertEqual(
            list(first_planning_config.org_unit_groups.values_list("id", flat=True)), [self.org_unit_group.pk]
        )

        second_planning_config = PlanningConfig.objects.get(pk=res_data[1]["id"])

        self.assertEqual(second_planning_config.planning_id, self.planning.pk)
        self.assertEqual(second_planning_config.level, 2)
        self.assertEqual(
            list(second_planning_config.org_unit_types.values_list("id", flat=True)),
            [self.org_unit_type.pk, self.org_unit_type_2.pk],
        )
        self.assertEqual(
            list(second_planning_config.org_unit_groups.values_list("id", flat=True)),
            [self.org_unit_group.pk, self.org_unit_group_2.pk],
        )
