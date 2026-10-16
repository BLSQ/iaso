from django.urls import reverse
from rest_framework import status

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
from iaso.test import APITestCase


class PlanningConfigDeleteAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
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

        cls.org_unit_type_other_account = OrgUnitType.objects.create(name="Test Country Type 3")
        cls.org_unit_type_other_account.projects.set([cls.project_other_account])

        # Create test org unit
        cls.org_unit = OrgUnit.objects.create(
            name="Test Country", org_unit_type=cls.org_unit_type, version=cls.source_version
        )
        cls.org_unit_2 = OrgUnit.objects.create(
            name="Test Country", org_unit_type=cls.org_unit_type_2, version=cls.source_version
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

        # create planning configs
        cls.planning_config = PlanningConfig.objects.create(planning=cls.planning, level=1)
        cls.planning_config.org_unit_types.set([cls.org_unit_type, cls.org_unit_type_2])
        cls.planning_config.org_unit_groups.set([cls.org_unit, cls.org_unit_2])

        cls.planning_config_other_account = PlanningConfig.objects.create(planning=cls.planning_other_account, level=1)

    def test_permissions(self):
        res = self.client.delete(reverse("planning_configs-detail", kwargs={"pk": self.planning_config.id}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user_no_perm)
        res = self.client.delete(reverse("planning_configs-detail", kwargs={"pk": self.planning_config.id}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_other_perm)
        res = self.client.delete(reverse("planning_configs-detail", kwargs={"pk": self.planning_config.id}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_write_perm)
        res = self.client.delete(reverse("planning_configs-detail", kwargs={"pk": self.planning_config.id}))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        self.client.force_authenticate(self.superuser)
        res = self.client.delete(reverse("planning_configs-detail", kwargs={"pk": self.planning_config.id}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_num_queries(self):
        planning_config_pk = self.planning_config.pk

        self.client.force_authenticate(self.superuser)
        with self.assertNumQueries(4):
            res = self.client.delete(reverse("planning_configs-detail", kwargs={"pk": self.planning_config.id}))

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        # check in db
        self.assertFalse(PlanningConfig.objects.filter(pk=planning_config_pk).exists())

    def test_delete_planning_config_out_of_account(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.delete(
            reverse("planning_configs-detail", kwargs={"pk": self.planning_config_other_account.id})
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_happy_path(self):
        planning_config_pk = self.planning_config.pk

        self.client.force_authenticate(self.superuser)
        res = self.client.delete(reverse("planning_configs-detail", kwargs={"pk": self.planning_config.id}))

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        # check in db
        self.assertFalse(PlanningConfig.objects.filter(pk=planning_config_pk).exists())
