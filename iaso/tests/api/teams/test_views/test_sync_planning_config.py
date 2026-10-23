import logging

from unittest import mock

from django.urls import reverse
from rest_framework import status

from iaso.models import Account, OrgUnit, Planning, PlanningConfig, Team
from iaso.test import APITestCase


class TeamSyncPlanningConfigAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.account = Account.objects.create(name="account")
        cls.other_account = Account.objects.create(name="other_account")

        cls.user = cls.create_user_with_profile(username="user", is_superuser=True, account=cls.account)
        cls.user_other_account = cls.create_user_with_profile(
            username="other_user", is_superuser=True, account=cls.other_account
        )

        # project

        cls.project = cls.account.project_set.create(name="project1")
        cls.project_other_account = cls.other_account.project_set.create(name="project3")

        # create teams

        cls.team = Team.objects.create(name="root", manager=cls.user, project=cls.project)
        cls.sub_team = Team.objects.create(name="sub_team", manager=cls.user, parent=cls.team, project=cls.project)
        cls.sub_sub_team_1 = Team.objects.create(
            name="sub_sub_team", manager=cls.user, parent=cls.sub_team, project=cls.project
        )

        cls.sub_sub_team_2 = Team.objects.create(
            name="sub_sub_team_2", manager=cls.user, parent=cls.sub_team, project=cls.project
        )

        cls.team_other_account = Team.objects.create(
            name="root", manager=cls.user_other_account, project=cls.project_other_account
        )
        cls.sub_team_other_account = Team.objects.create(
            name="sub_team",
            manager=cls.user_other_account,
            parent=cls.team_other_account,
            project=cls.project_other_account,
        )
        cls.sub_sub_team_other_account = Team.objects.create(
            name="sub_sub_team",
            manager=cls.user_other_account,
            parent=cls.sub_team_other_account,
            project=cls.project_other_account,
        )

        # create plannings
        cls.org_unit = OrgUnit.objects.create(name="ou")
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
        cls.planning_config_2 = PlanningConfig.objects.create(level=2, planning=cls.planning)
        cls.planning_config_3 = PlanningConfig.objects.create(level=3, planning=cls.planning)

        cls.planning_config_other_account = PlanningConfig.objects.create(level=1, planning=cls.planning_other_account)
        cls.planning_config_other_account_2 = PlanningConfig.objects.create(
            level=2, planning=cls.planning_other_account
        )
        cls.planning_config_other_account_3 = PlanningConfig.objects.create(
            level=3, planning=cls.planning_other_account
        )

    def setUp(self):
        super().setUp()
        logging.disable(logging.NOTSET)

    def tearDown(self):
        super().tearDown()
        logging.disable(logging.CRITICAL)

    def get_url(self, team_id: int) -> str:
        return reverse("teams-detail", kwargs={"pk": team_id})

    def test_delete_that_does_not_trigger_depth_change(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.delete(self.get_url(self.sub_sub_team_2.pk))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        # check in db it was deleted
        self.sub_sub_team_2.refresh_from_db()
        self.assertIsNotNone(self.sub_sub_team_2.deleted_at)

        # check planning configs are still there
        self.assertEqual(PlanningConfig.objects.all().count(), 6)

    def test_delete_that_does_trigger_depth_change(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.delete(self.get_url(self.sub_team.pk))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        # check in db it was deleted
        self.sub_team.refresh_from_db()
        self.assertIsNotNone(self.sub_team.deleted_at)

        # check planning configs are still there
        # todo : bug here, the children are not cascade deleted, either we suppose it's ok or we fix the team delete
        self.assertEqual(PlanningConfig.objects.all().count(), 5)

        self.assertCountEqual(
            list(PlanningConfig.objects.values_list("id", flat=True)),
            [
                self.planning_config.pk,
                self.planning_config_3.pk,
                self.planning_config_other_account.pk,
                self.planning_config_other_account_2.pk,
                self.planning_config_other_account_3.pk,
            ],
        )

    @mock.patch("iaso.services.planning_config.PlanningConfigService.sync_planning_configs")
    def test_sync_in_delete_that_raises_a_500_does_not_stop_api_call(self, m):
        m.side_effect = Exception("oops")
        self.client.force_authenticate(user=self.user)
        with self.assertLogs("iaso.api.teams.views", level="ERROR") as l:
            res = self.client.delete(self.get_url(self.sub_team.pk))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        # check in db it was deleted
        self.sub_team.refresh_from_db()
        self.assertIsNotNone(self.sub_team.deleted_at)

        self.assertEqual(PlanningConfig.objects.all().count(), 6)

        # check logs content
        log_record = l.records[-1]
        self.assertEqual(log_record.message, "Exception occurred during the sync with planning configs")
        self.assertIsNotNone(log_record.exception)
        self.assertEqual(log_record.team_pk, self.sub_team.pk)

    def test_update_that_does_not_trigger_depth_change(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.patch(self.get_url(self.sub_sub_team_2.pk), data={"name": "new name"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # check in db it was updated
        self.sub_sub_team_2.refresh_from_db()
        self.assertEqual(self.sub_sub_team_2.name, "new name")

        # check planning configs are still there
        self.assertEqual(PlanningConfig.objects.all().count(), 6)

    def test_update_that_does_trigger_depth_change(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.patch(self.get_url(self.sub_team.pk), data={"parent": None})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # check in db it was updated
        self.sub_team.refresh_from_db()
        self.assertIsNone(self.sub_team.parent)

        # check planning configs are still there
        self.assertEqual(PlanningConfig.objects.all().count(), 5)

        self.assertCountEqual(
            list(PlanningConfig.objects.values_list("id", flat=True)),
            [
                self.planning_config.pk,
                self.planning_config_2.pk,
                self.planning_config_other_account.pk,
                self.planning_config_other_account_2.pk,
                self.planning_config_other_account_3.pk,
            ],
        )

    @mock.patch("iaso.services.planning_config.PlanningConfigService.sync_planning_configs")
    def test_sync_in_update_that_raises_a_500_does_not_stop_api_call(self, m):
        m.side_effect = Exception("oops")
        self.client.force_authenticate(user=self.user)
        with self.assertLogs("iaso.api.teams.views", level="ERROR") as l:
            res = self.client.patch(self.get_url(self.sub_team.pk), data={"parent": None})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # check in db it was updated
        self.sub_team.refresh_from_db()
        self.assertIsNone(self.sub_team.parent)

        self.assertEqual(PlanningConfig.objects.all().count(), 6)
        # check logs content
        log_record = l.records[-1]
        self.assertEqual(log_record.message, "Exception occurred during the sync with planning configs")
        self.assertIsNotNone(log_record.exception)
        self.assertEqual(log_record.team_pk, self.sub_team.pk)
