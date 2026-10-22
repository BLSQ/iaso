from typing import Any

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
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION, CORE_SUBMISSIONS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class PlanningConfigUpdateAPITestCase(SwaggerTestCaseMixin, APITestCase):
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
        cls.project_other_account = Project.objects.create(
            name="Test Project other account", app_id="test.app.other_account", account=cls.other_account
        )

        cls.data_source.projects.add(cls.project)
        cls.data_source_other_account.projects.add(cls.project_other_account)

        # Create test org unit types
        cls.org_unit_type = OrgUnitType.objects.create(name="Test Country Type")
        cls.org_unit_type.projects.set([cls.project])

        cls.org_unit_type_2 = OrgUnitType.objects.create(name="Test Country Type 2")
        cls.org_unit_type_2.projects.set([cls.project])

        cls.org_unit_type_other_account = OrgUnitType.objects.create(name="Test Country Type 3")
        cls.org_unit_type_other_account.projects.set([cls.project_other_account])

        # Create test org unit
        cls.ou = OrgUnit.objects.create(
            name="Test Country", org_unit_type=cls.org_unit_type, version=cls.source_version
        )
        cls.org_unit_group = Group.objects.create(name="Test country", source_version=cls.source_version)
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

        cls.planning_config = PlanningConfig.objects.create(
            planning=cls.planning,
            level=1,
        )
        cls.planning_config.org_unit_types.set([cls.org_unit_type.id, cls.org_unit_type_2.id])
        cls.planning_config.org_unit_groups.set([cls.org_unit_group.id, cls.org_unit_group_2.id])

        cls.planning_config_other_account = PlanningConfig.objects.create(
            planning=cls.planning_other_account,
            level=1,
        )

    def assertValidBody(self, body: Any) -> None:
        self.assertResponseCompliantToSwagger(body, "PlanningConfigUpdateRequest")

    def test_permissions(self):
        url = reverse("planning_configs-detail", kwargs={"pk": self.planning_config.pk})

        res = self.client.put(url, data={"level": 2})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user_no_perm)
        res = self.client.put(url, data={"level": 2})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_other_perm)
        res = self.client.put(url, data={"level": 2})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_write_perm)
        res = self.client.put(url, data={})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.superuser)
        res = self.client.put(url, data={})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_happy_path(self):
        self.client.force_authenticate(self.superuser)
        data = {
            "level": 2,
            "org_unit_types": [self.org_unit_type.id],
            "org_unit_groups": [self.org_unit_group.id],
        }
        self.assertValidBody(data)

        res = self.client.put(reverse("planning_configs-detail", kwargs={"pk": self.planning_config.pk}), data=data)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.planning_config.refresh_from_db()
        self.assertEqual(self.planning_config.level, 2)
        self.assertEqual(self.planning_config.planning_id, self.planning.id)

        self.assertCountEqual(
            self.planning_config.org_unit_types.values_list("id", flat=True),
            [self.org_unit_type.id],
        )
        self.assertCountEqual(
            self.planning_config.org_unit_groups.values_list("id", flat=True), [self.org_unit_group.id]
        )

    def test_num_queries(self):
        self.client.force_authenticate(self.superuser)
        data = {
            "level": 2,
            "org_unit_types": [self.org_unit_type.id],
            "org_unit_groups": [self.org_unit_group.id],
        }
        self.assertValidBody(data)

        with self.assertNumQueries(16):
            res = self.client.put(reverse("planning_configs-detail", kwargs={"pk": self.planning_config.pk}), data=data)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.planning_config.refresh_from_db()
        self.assertEqual(self.planning_config.level, 2)
        self.assertEqual(self.planning_config.planning_id, self.planning.id)

        self.assertCountEqual(
            self.planning_config.org_unit_types.values_list("id", flat=True),
            [self.org_unit_type.id],
        )
        self.assertCountEqual(
            self.planning_config.org_unit_groups.values_list("id", flat=True), [self.org_unit_group.id]
        )

    def test_validation_errors(self):
        self.client.force_authenticate(self.superuser)

        with self.subTest("level zero"):
            res = self.client.put(
                reverse("planning_configs-detail", kwargs={"pk": self.planning_config.pk}), data={"level": 0}
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data, "level")

        with self.subTest("negative level"):
            res = self.client.put(
                reverse("planning_configs-detail", kwargs={"pk": self.planning_config.pk}), data={"level": -1}
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data, "level")

        with self.subTest("org unit type out of account"):
            res = self.client.put(
                reverse("planning_configs-detail", kwargs={"pk": self.planning_config.pk}),
                data={"org_unit_types": [self.org_unit_type_other_account.pk]},
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data, "org_unit_types")

        with self.subTest("org unit group out of account"):
            res = self.client.put(
                reverse("planning_configs-detail", kwargs={"pk": self.planning_config.pk}),
                data={"org_unit_groups": [self.org_unit_group_other_account.pk]},
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data, "org_unit_groups")

    def test_level_uniqueness(self):
        PlanningConfig.objects.create(
            planning=self.planning,
            level=2,
        )

        self.client.force_authenticate(self.superuser)
        res = self.client.put(
            reverse("planning_configs-detail", kwargs={"pk": self.planning_config.pk}), data={"level": 2}
        )

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data,
            "level",
            "A planning configuration with this level already exists for this planning.",
        )

    def test_planning_cannot_be_changed(self):
        self.client.force_authenticate(self.superuser)

        data = {
            "level": 2,
            "planning": self.planning_other_account.id,
        }
        self.assertValidBody(data)

        res = self.client.put(reverse("planning_configs-detail", kwargs={"pk": self.planning_config.pk}), data=data)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.planning_config.refresh_from_db()
        self.assertEqual(self.planning_config.planning_id, self.planning.id)
        self.assertEqual(self.planning_config.level, 2)

    def test_partial_update_preserves_unspecified_fields(self):
        self.planning_config.org_unit_types.set([self.org_unit_type])
        self.planning_config.org_unit_groups.set([self.org_unit_group])

        self.client.force_authenticate(self.superuser)
        res = self.client.patch(
            reverse("planning_configs-detail", kwargs={"pk": self.planning_config.pk}), data={"level": 2}
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.planning_config.refresh_from_db()
        self.assertEqual(self.planning_config.level, 2)
        self.assertCountEqual(
            self.planning_config.org_unit_types.values_list("id", flat=True),
            [self.org_unit_type.id],
        )
        self.assertCountEqual(
            self.planning_config.org_unit_groups.values_list("id", flat=True),
            [self.org_unit_group.id],
        )

    def test_cannot_update_another_planning_config(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.patch(
            reverse("planning_configs-detail", kwargs={"pk": self.planning_config_other_account.pk}), data={}
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
