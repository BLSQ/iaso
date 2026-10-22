from typing import Any, Optional

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


class NestedPlanningConfigBulkAPITestCase(SwaggerTestCaseMixin, APITestCase):
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

        # create users
        cls.user_no_perm = cls.create_user_with_profile(username="user_no_perm", account=cls.account, permissions=[])
        cls.user_write_perm = cls.create_user_with_profile(
            username="user_write_perm", account=cls.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
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
        cls.data_source_other_account.projects.add(cls.project_other_account)

        # Create test org unit type
        cls.org_unit_type = OrgUnitType.objects.create(name="Test Country Type")
        cls.org_unit_type.projects.set([cls.project])

        cls.org_unit_type_2 = OrgUnitType.objects.create(name="Test Country Type 2")
        cls.org_unit_type_2.projects.set([cls.project])

        cls.org_unit_type_3 = OrgUnitType.objects.create(name="Test Country Type 3")
        cls.org_unit_type_3.projects.set([cls.project])

        cls.org_unit_type_other_account = OrgUnitType.objects.create(name="Test Country Type 4")
        cls.org_unit_type_other_account.projects.set([cls.project_other_account])

        # Create test org unit and groups
        cls.org_unit = OrgUnit.objects.create(name="Test Country", org_unit_type=cls.org_unit_type)

        cls.org_unit_group = Group.objects.create(name="Test Country", source_version=cls.source_version)
        cls.org_unit_group_2 = Group.objects.create(name="Test Country 2", source_version=cls.source_version)
        cls.org_unit_group_3 = Group.objects.create(name="Test Country 3", source_version=cls.source_version)
        cls.org_unit_group_other_account = Group.objects.create(
            name="Test Country 4", source_version=cls.source_version_other_account
        )

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

        cls.planning_config_other_account = PlanningConfig.objects.create(level=1, planning=cls.planning_other_account)

    def assertValidBody(self, data: Any) -> None:
        self.assertResponseCompliantToSwagger(data, "NestedPlanningConfigBulkRequest", as_array=True)

    def assertValidResponse(self, data: Any, expected_length: int) -> None:
        self.assertResponseCompliantToSwagger(data, "NestedPlanningConfigBulk", as_array=True)
        self.assertEqual(len(data), expected_length)

    def get_url(self, planning_pk: Optional[int] = None) -> str:
        if not planning_pk:
            planning_pk = self.planning.pk

        return reverse("planning-planning-configs-bulk", kwargs={"pk": planning_pk})

    def test_permissions(self) -> None:
        res = self.client.put(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user_no_perm)
        res = self.client.put(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_other_perm)
        res = self.client.put(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_write_perm)
        res = self.client.put(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.superuser)
        res = self.client.put(self.get_url())
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_should_raise_a_404_if_planning_does_not_exist(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.put(self.get_url(1000))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_should_raise_a_404_if_planning_does_not_belong_to_user(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.put(self.get_url(self.planning_other_account.pk))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_num_queries(self):
        self.client.force_authenticate(self.superuser)
        data = [
            {
                "id": self.planning_config.pk,
                "level": 2,
                "org_unit_types": [self.org_unit_type_3.pk],
                "org_unit_groups": [self.org_unit_group_3.pk],
            },
            {"level": 3, "org_unit_types": [self.org_unit_type_2.pk], "org_unit_groups": [self.org_unit_group_2.pk]},
        ]
        self.assertValidBody(data)

        with self.assertNumQueries(37):
            res = self.client.put(self.get_url(), data=data)

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 2)

        # check in db
        self.planning.refresh_from_db()
        planning_configs = self.planning.configs.all()

        self.assertEqual(len(planning_configs), 2)
        self.assertCountEqual(planning_configs.values_list("id", flat=True), [x["id"] for x in res_data])

    def test_response(self):
        planning_config_2_pk = self.planning_config_2.pk

        self.client.force_authenticate(self.superuser)
        data = [
            {
                "id": self.planning_config.pk,
                "level": 2,
                "org_unit_types": [self.org_unit_type_3.pk],
                "org_unit_groups": [self.org_unit_group_3.pk],
            },
            {"level": 3, "org_unit_types": [self.org_unit_type_2.pk], "org_unit_groups": [self.org_unit_group_2.pk]},
        ]
        self.assertValidBody(data)
        res = self.client.put(self.get_url(), data=data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 2)

        # check in db
        self.planning.refresh_from_db()
        planning_configs = self.planning.configs.all()

        self.assertEqual(len(planning_configs), 2)
        self.assertCountEqual(planning_configs.values_list("id", flat=True), [x["id"] for x in res_data])

        self.assertFalse(PlanningConfig.objects.filter(pk=planning_config_2_pk).exists())

        first_planning_config = PlanningConfig.objects.get(pk=res_data[0]["id"])
        self.assertEqual(first_planning_config.planning, self.planning)
        self.assertEqual(first_planning_config.level, 2)
        self.assertCountEqual(
            list(first_planning_config.org_unit_types.values_list("id", flat=True)), [self.org_unit_type_3.pk]
        )
        self.assertCountEqual(
            list(first_planning_config.org_unit_groups.values_list("id", flat=True)), [self.org_unit_group_3.pk]
        )

        second_planning_config = PlanningConfig.objects.get(pk=res_data[1]["id"])
        self.assertEqual(second_planning_config.planning, self.planning)
        self.assertEqual(second_planning_config.level, 3)
        self.assertCountEqual(
            list(second_planning_config.org_unit_types.values_list("id", flat=True)), [self.org_unit_type_2.pk]
        )
        self.assertCountEqual(
            list(second_planning_config.org_unit_groups.values_list("id", flat=True)), [self.org_unit_group_2.pk]
        )

    def test_validation(self):
        self.client.force_authenticate(self.superuser)

        with self.subTest("planning config other account"):
            data = [{"id": self.planning_config_other_account.pk, "level": 2}]
            self.assertValidBody(data)
            res = self.client.put(self.get_url(), data=data)
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
                    "org_unit_groups": [self.org_unit_group.pk],
                }
            ]
            self.assertValidBody(data)
            res = self.client.put(self.get_url(), data=data)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data[0], "org_unit_types")

        with self.subTest("org_unit_groups other account"):
            data = [
                {
                    "id": self.planning_config.pk,
                    "level": 2,
                    "org_unit_types": [self.org_unit_type.pk],
                    "org_unit_groups": [self.org_unit_group_other_account.pk],
                }
            ]
            self.assertValidBody(data)
            res = self.client.put(self.get_url(), data=data)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data[0], "org_unit_groups")

        with self.subTest("level"):
            for level in [-1, 0]:
                data = [
                    {
                        "id": self.planning_config.pk,
                        "level": level,
                        "org_unit_types": [self.org_unit_type.pk],
                        "org_unit_groups": [self.org_unit_group.pk],
                    }
                ]
                # self.assertValidBody(data) # will fail obviously
                res = self.client.put(self.get_url(), data=data)
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
        res = self.client.put(self.get_url(), data)
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, api_settings.NON_FIELD_ERRORS_KEY, "ids provided are not unique")

    def test_level_planning_uniqueness_within_data(self):
        self.client.force_authenticate(self.superuser)
        data = [
            {
                "id": self.planning_config.pk,
                "level": 2,
                "org_unit_types": [self.org_unit_type.pk],
                "org_unit_groups": [self.org_unit_group.pk],
            },
            {
                "id": self.planning_config_2.pk,
                "level": 2,
                "org_unit_types": [self.org_unit_type.pk, self.org_unit_type_2.pk],
                "org_unit_groups": [self.org_unit_group.pk, self.org_unit_group_2.pk],
            },
        ]
        self.assertValidBody(data)

        res = self.client.put(self.get_url(), data)

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
                "id": self.planning_config.pk,
                "level": 2,
                "org_unit_types": [self.org_unit_type.pk],
                "org_unit_groups": [self.org_unit_group.pk],
            },
            {
                "level": 2,
                "org_unit_types": [self.org_unit_type.pk],
                "org_unit_groups": [self.org_unit_group.pk],
            },
        ]
        self.assertValidBody(data)

        res = self.client.put(self.get_url(), data)
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(
            res_data,
            api_settings.NON_FIELD_ERRORS_KEY,
            "A planning configuration with this level already exists for this planning.",
        )

    def test_bulk_same_values(self):
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
        res = self.client.put(self.get_url(), data)
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data, 2)

        # check in db
        self.planning.refresh_from_db()
        planning_configs = self.planning.configs.all()

        self.assertEqual(len(planning_configs), 2)
        self.assertCountEqual(planning_configs.values_list("id", flat=True), [x["id"] for x in res_data])

        first_planning_config = PlanningConfig.objects.get(pk=res_data[0]["id"])
        self.assertEqual(first_planning_config.planning, self.planning)
        self.assertEqual(first_planning_config.pk, self.planning_config.pk)
        self.assertEqual(first_planning_config.level, 1)
        self.assertCountEqual(
            list(first_planning_config.org_unit_types.values_list("id", flat=True)),
            [self.org_unit_type.pk, self.org_unit_type_2.pk],
        )
        self.assertCountEqual(
            list(first_planning_config.org_unit_groups.values_list("id", flat=True)),
            [self.org_unit_group.pk, self.org_unit_group_2.pk],
        )

        second_planning_config = PlanningConfig.objects.get(pk=res_data[1]["id"])
        self.assertEqual(second_planning_config.planning, self.planning)
        self.assertEqual(second_planning_config.pk, self.planning_config_2.pk)
        self.assertEqual(second_planning_config.level, 2)
        self.assertCountEqual(
            list(second_planning_config.org_unit_types.values_list("id", flat=True)),
            [self.org_unit_type_3.pk],
        )
        self.assertCountEqual(
            list(second_planning_config.org_unit_groups.values_list("id", flat=True)),
            [self.org_unit_group_3.pk],
        )
