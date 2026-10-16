from typing import Any, Dict, List

from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings

from iaso.models import (
    Account,
    DataSource,
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


class PlanningConfigBulkUpdateAPITestCase(SwaggerTestCaseMixin, APITestCase):
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
        cls.project_other_account = Project.objects.create(
            name="Test Project other account", app_id="test.app.other_account", account=cls.other_account
        )

        cls.data_source.projects.add(cls.project)

        # Create test org unit types
        cls.org_unit_type = OrgUnitType.objects.create(name="Test Country Type")
        cls.org_unit_type.projects.set([cls.project])

        cls.org_unit_type_2 = OrgUnitType.objects.create(name="Test Country Type 2")
        cls.org_unit_type_2.projects.set([cls.project])

        cls.org_unit_type_3 = OrgUnitType.objects.create(name="Test Country Type 3")
        cls.org_unit_type_3.projects.set([cls.project])

        cls.org_unit_type_4 = OrgUnitType.objects.create(name="Test Country Type 4")
        cls.org_unit_type_4.projects.set([cls.project])

        cls.org_unit_type_other_account = OrgUnitType.objects.create(name="Test Country Type 3")
        cls.org_unit_type_other_account.projects.set([cls.project_other_account])

        # Create test org unit
        cls.org_unit = OrgUnit.objects.create(
            name="Test Country", org_unit_type=cls.org_unit_type, version=cls.source_version
        )
        cls.org_unit_2 = OrgUnit.objects.create(
            name="Test Country", org_unit_type=cls.org_unit_type_2, version=cls.source_version
        )
        cls.org_unit_3 = OrgUnit.objects.create(
            name="Test Country", org_unit_type=cls.org_unit_type_3, version=cls.source_version
        )
        cls.org_unit_4 = OrgUnit.objects.create(
            name="Test Country", org_unit_type=cls.org_unit_type_4, version=cls.source_version
        )
        cls.org_unit_other_account = OrgUnit.objects.create(
            name="Test Country", org_unit_type=cls.org_unit_type_other_account
        )

        # Create test team
        cls.team = Team.objects.create(name="Test Team", project=cls.project, manager=cls.superuser)
        cls.team_other_account = Team.objects.create(
            name="Test Team Other Account", project=cls.project_other_account, manager=cls.user_other_account
        )

        # create plannings

        cls.planning = Planning.objects.create(
            name="planning", project=cls.project, team=cls.team, org_unit=cls.org_unit
        )

        cls.planning_other_account = Planning.objects.create(
            name="planning_other_account",
            project=cls.project_other_account,
            team=cls.team_other_account,
            org_unit=cls.org_unit,
        )

        # create some planning configs

        cls.planning_config = PlanningConfig.objects.create(level=1, planning=cls.planning)
        cls.planning_config.org_unit_types.add(cls.org_unit_type)
        cls.planning_config.org_unit_groups.add(cls.org_unit)

        cls.planning_config_2 = PlanningConfig.objects.create(level=2, planning=cls.planning)

        cls.planning_config_other_account = PlanningConfig.objects.create(level=1, planning=cls.planning_other_account)

    def assertValidBody(self, body: List[Dict[str, Any]]):
        self.assertResponseCompliantToSwagger(body, "PlanningConfigBulkUpdateRequest", True)

    def test_permissions(self):
        res = self.client.put(reverse("planning_configs-bulk-update"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user_no_perm)
        res = self.client.put(reverse("planning_configs-bulk-update"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_other_perm)
        res = self.client.put(reverse("planning_configs-bulk-update"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_write_perm)
        res = self.client.put(reverse("planning_configs-bulk-update"), data={})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.superuser)
        res = self.client.put(reverse("planning_configs-bulk-update"), data={})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validation(self):
        self.client.force_authenticate(self.superuser)

        with self.subTest("planning config other account"):
            data = [{"id": self.planning_config_other_account.pk, "level": 2}]
            self.assertValidBody(data)
            res = self.client.put(reverse("planning_configs-bulk-update"), data=data)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(
                res_data[0], "id", f'Invalid pk "{self.planning_config_other_account.pk}" - object does not exist.'
            )

        with self.subTest("org_unit_types other account"):
            data = [
                {
                    "id": self.planning_config.pk,
                    "level": 2,
                    "org_unit_types": [self.org_unit_type_other_account.pk],
                    "org_unit_groups": [self.org_unit.pk],
                }
            ]
            self.assertValidBody(data)
            res = self.client.put(reverse("planning_configs-bulk-update"), data=data)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data[0], "org_unit_types")

        with self.subTest("org_unit_groups other account"):
            data = [
                {
                    "id": self.planning_config.pk,
                    "level": 2,
                    "org_unit_types": [self.org_unit_type.pk],
                    "org_unit_groups": [self.org_unit_other_account.pk],
                }
            ]
            self.assertValidBody(data)
            res = self.client.put(reverse("planning_configs-bulk-update"), data=data)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data[0], "org_unit_groups")

        with self.subTest("level"):
            for level in [-1, 0]:
                data = [
                    {
                        "id": self.planning_config.pk,
                        "level": level,
                        "org_unit_types": [self.org_unit_type.pk],
                        "org_unit_groups": [self.org_unit.pk],
                    }
                ]
                self.assertValidBody(data)
                res = self.client.put(reverse("planning_configs-bulk-update"), data=data)
                res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
                self.assertHasError(res_data[0], "level")

    def test_unique_ids(self):
        self.client.force_authenticate(self.superuser)
        data = [
            {
                "id": self.planning_config.pk,
                "level": 3,
                "org_unit_types": [],
                "org_unit_groups": [],
            },
            {
                "id": self.planning_config.pk,
                "level": 3,
                "org_unit_types": [],
                "org_unit_groups": [],
            },
        ]
        self.assertValidBody(data)
        res = self.client.put(reverse("planning_configs-bulk-update"), data)
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, api_settings.NON_FIELD_ERRORS_KEY, "ids provided are not unique")

    def test_level_planning_uniqueness_within_data(self):
        self.client.force_authenticate(self.superuser)
        data = [
            {
                "id": self.planning_config.pk,
                "level": 2,
                "org_unit_types": [self.org_unit_type.pk],
                "org_unit_groups": [self.org_unit.pk],
            },
            {
                "id": self.planning_config_2.pk,
                "level": 2,
                "org_unit_types": [self.org_unit_type.pk, self.org_unit_type_2.pk],
                "org_unit_groups": [self.org_unit.pk, self.org_unit_2.pk],
            },
        ]
        self.assertValidBody(data)

        res = self.client.put(reverse("planning_configs-bulk-update"), data)

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(
            res_data,
            api_settings.NON_FIELD_ERRORS_KEY,
            "A planning configuration with this level already exists for this planning.",
        )

    def test_level_planning_uniqueness_with_existing_data(self):
        self.client.force_authenticate(self.superuser)
        data = [
            {
                "id": self.planning.pk,
                "level": 2,
                "org_unit_types": [self.org_unit_type.pk],
                "org_unit_groups": [self.org_unit.pk],
            }
        ]
        self.assertValidBody(data)

        res = self.client.put(reverse("planning_configs-bulk-update"), data)

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(res_data[0], "id")

    def test_num_queries(self):
        self.client.force_authenticate(self.superuser)
        data = [
            {
                "id": self.planning_config.pk,
                "level": 3,
                "org_unit_types": [],
                "org_unit_groups": [],
            },
            {
                "id": self.planning_config_2.pk,
                "level": 1,
                "org_unit_types": [self.org_unit_type.pk, self.org_unit_type_2.pk],
                "org_unit_groups": [self.org_unit.pk, self.org_unit_2.pk],
            },
        ]
        self.assertValidBody(data)

        with self.assertNumQueries(31):
            res = self.client.put(reverse("planning_configs-bulk-update"), data)

        self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

        # check in db
        self.planning_config.refresh_from_db()

        self.assertEqual(self.planning_config.level, 3)
        self.assertEqual(list(self.planning_config.org_unit_types.values_list("id", flat=True)), [])
        self.assertEqual(list(self.planning_config.org_unit_groups.values_list("id", flat=True)), [])

        self.planning_config_2.refresh_from_db()

        self.assertEqual(self.planning_config_2.level, 1)
        self.assertEqual(
            list(self.planning_config_2.org_unit_types.values_list("id", flat=True)),
            [self.org_unit_type.pk, self.org_unit_type_2.pk],
        )
        self.assertEqual(
            list(self.planning_config_2.org_unit_groups.values_list("id", flat=True)),
            [self.org_unit.pk, self.org_unit_2.pk],
        )

    def test_happy_path(self):
        self.client.force_authenticate(self.superuser)
        data = [
            {
                "id": self.planning_config.pk,
                "level": 3,
                "org_unit_types": [],
                "org_unit_groups": [],
            },
            {
                "id": self.planning_config_2.pk,
                "level": 1,
                "org_unit_types": [self.org_unit_type.pk, self.org_unit_type_2.pk],
                "org_unit_groups": [self.org_unit.pk, self.org_unit_2.pk],
            },
        ]
        self.assertValidBody(data)
        res = self.client.put(reverse("planning_configs-bulk-update"), data)
        self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

        # check in db
        self.planning_config.refresh_from_db()

        self.assertEqual(self.planning_config.level, 3)
        self.assertEqual(list(self.planning_config.org_unit_types.values_list("id", flat=True)), [])
        self.assertEqual(list(self.planning_config.org_unit_groups.values_list("id", flat=True)), [])

        self.planning_config_2.refresh_from_db()

        self.assertEqual(self.planning_config_2.level, 1)
        self.assertEqual(
            list(self.planning_config_2.org_unit_types.values_list("id", flat=True)),
            [self.org_unit_type.pk, self.org_unit_type_2.pk],
        )
        self.assertEqual(
            list(self.planning_config_2.org_unit_groups.values_list("id", flat=True)),
            [self.org_unit.pk, self.org_unit_2.pk],
        )

    def test_update_same_values(self):
        """
        Testing that bulk updating with the same values does not trigger any error (e.g unique together constraints)
        """

        self.client.force_authenticate(self.superuser)
        data = [
            {
                "id": self.planning_config.pk,
                "level": self.planning_config.level,
                "org_unit_types": list(self.planning_config.org_unit_types.values_list("id", flat=True)),
                "org_unit_groups": list(self.planning_config.org_unit_groups.values_list("id", flat=True)),
            },
            {
                "id": self.planning_config_2.pk,
                "level": self.planning_config_2.level,
                "org_unit_types": list(self.planning_config_2.org_unit_types.values_list("id", flat=True)),
                "org_unit_groups": list(self.planning_config_2.org_unit_groups.values_list("id", flat=True)),
            },
        ]
        self.assertValidBody(data)
        res = self.client.put(reverse("planning_configs-bulk-update"), data)
        self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)
