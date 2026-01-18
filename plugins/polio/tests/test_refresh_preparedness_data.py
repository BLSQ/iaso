from datetime import datetime
from unittest.mock import patch

from iaso import models as m
from iaso.models.base import KILLED, RUNNING, SKIPPED, SUCCESS
from iaso.models.json_config import Config
from iaso.test import APITestCase
from plugins.polio.models import Campaign
from plugins.polio.permissions import POLIO_PERMISSION
from plugins.polio.tasks.api.refresh_preparedness_dashboard_data import (
    PREPAREDNESS_CONFIG_SLUG,
    PREPAREDNESS_TASK_NAME,
    RefreshPreparednessDataViewset,
)


class RefreshPreparednessTestCase(APITestCase):
    @classmethod
    def setUp(cls):
        cls.url = "/api/tasks/create/refreshpreparedness/"
        cls.account = account = m.Account.objects.create(name="test account")
        cls.other_account = m.Account.objects.create(name="other account")
        cls.user = cls.create_user_with_profile(username="test user", account=account, permissions=[POLIO_PERMISSION])
        cls.campaign = Campaign.objects.create(obr_name="right_campaign", account=account)
        cls.wrong_campaign = Campaign.objects.create(obr_name="wrong_campaign", account=cls.other_account)

    def test_no_perm(self):
        user_no_perm = self.create_user_with_profile(username="test user2", account=self.account, permissions=[])
        self.client.force_authenticate(user_no_perm)
        response = self.client.post(
            self.url,
            format="json",
            data={"obr_name": self.campaign.obr_name},
        )
        jr = self.assertJSONResponse(response, 403)
        self.assertEqual({"detail": "You do not have permission to perform this action."}, jr)

    def test_wrong_obr_name(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            format="json",
            data={"obr_name": "Bleh"},
        )
        jr = self.assertJSONResponse(response, 400)
        self.assertEqual({"non_field_errors": ["Invalid campaign name"]}, jr)

    def test_wrong_account(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            format="json",
            data={"obr_name": self.wrong_campaign.obr_name},
        )
        jr = self.assertJSONResponse(response, 400)
        self.assertEqual({"non_field_errors": ["Invalid campaign name"]}, jr)

    def test_ok(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            format="json",
            data={"obr_name": self.campaign.obr_name},
        )
        jr = self.assertJSONResponse(response, 200)
        task = self.assertValidTaskAndInDB(jr)
        self.assertEqual(task.launcher, self.user)
        self.assertEqual(task.params["kwargs"]["campaigns"], [self.campaign.obr_name])


class RefreshPreparednessDataTestCase(APITestCase):
    @classmethod
    def setUp(cls):
        cls.url = "/api/polio/tasks/refreshpreparedness/"
        cls.account = account = m.Account.objects.create(name="test account")
        cls.user = cls.create_user_with_profile(username="test user", account=account, permissions=[POLIO_PERMISSION])

        cls.external_task1 = m.Task.objects.create(
            status=RUNNING, account=account, launcher=cls.user, name="external task 1", external=True
        )
        cls.external_task2 = m.Task.objects.create(
            status=RUNNING, account=account, launcher=cls.user, name="external task 2", external=True
        )
        cls.project = m.Project.objects.create(name="Polio", app_id="polio.rapid.outbreak.taskforce", account=account)
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.data_source.projects.add(cls.project)
        cls.data_source.save()
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account.default_version = cls.source_version
        cls.account.save()

        cls.task1 = m.Task.objects.create(
            status=RUNNING,
            account=account,
            launcher=cls.user,
            name=PREPAREDNESS_CONFIG_SLUG,
            started_at=datetime.now(),
            external=True,
        )
        cls.task2 = m.Task.objects.create(
            status=RUNNING, account=account, launcher=cls.user, name="task 2", external=True
        )

        cls.json_config = {
            "pipeline": "pipeline",
            "openhexa_url": "https://yippie.openhexa.xyz/",
            "openhexa_token": "token",
            "pipeline_version": 1,
            "oh_pipeline_target": "staging",
        }
        cls.preparedness_config = Config.objects.create(slug=PREPAREDNESS_CONFIG_SLUG, content=cls.json_config)

    def mock_openhexa_call_success(self, slug=None, config=None, id_field=None, task_id=None, pipeline_config=None):
        return SUCCESS

    def mock_openhexa_call_skipped(self, slug=None, config=None, id_field=None, task_id=None, pipeline_config=None):
        return SKIPPED

    def mock_openhexa_call_running(self, slug=None, config=None, id_field=None, task_id=None, pipeline_config=None):
        return RUNNING

    def test_no_auth_needed(self):
        user_no_perm = self.create_user_with_profile(username="test user2", account=self.account, permissions=[])
        self.client.force_authenticate(user_no_perm)
        response = self.client.get(
            self.url,
            format="json",
        )
        self.assertJSONResponse(response, 200)

    @patch.object(RefreshPreparednessDataViewset, "launch_task", mock_openhexa_call_running)
    def test_create_external_task(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(
            self.url,
        )
        response = self.assertJSONResponse(response, 200)
        task = response["task"]
        self.assertEqual(task["status"], RUNNING)
        self.assertEqual(task["launcher"]["username"], self.user.username)
        self.assertEqual(task["name"], PREPAREDNESS_TASK_NAME)

    @patch.object(RefreshPreparednessDataViewset, "launch_task", mock_openhexa_call_skipped)
    def test_create_external_task_pipeline_already_running(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(
            self.url,
        )
        response = self.assertJSONResponse(response, 200)
        task = response["task"]
        self.assertEqual(task["status"], SKIPPED)
        self.assertEqual(task["launcher"]["username"], self.user.username)
        self.assertEqual(task["name"], PREPAREDNESS_TASK_NAME)

    @patch.object(RefreshPreparednessDataViewset, "launch_task", mock_openhexa_call_running)
    def test_patch_external_task(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(
            self.url,
        )
        response = self.assertJSONResponse(response, 200)
        task = response["task"]
        task_id = task["id"]
        self.assertEqual(task["status"], RUNNING)
        self.assertEqual(task["progress_value"], 0)
        self.assertEqual(task["end_value"], 0)

        response = self.client.patch(
            f"{self.url}{task_id}/", format="json", data={"status": SUCCESS, "progress_value": 21}
        )
        response = self.assertJSONResponse(response, 200)
        task = response
        self.assertEqual(task["id"], task_id)
        self.assertEqual(task["status"], SUCCESS)
        self.assertEqual(task["progress_value"], 21)
        self.assertEqual(task["end_value"], 0)

    @patch.object(RefreshPreparednessDataViewset, "launch_task", mock_openhexa_call_running)
    def test_kill_external_task(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(
            self.url,
        )
        response = self.assertJSONResponse(response, 200)
        task = response["task"]
        task_id = task["id"]
        self.assertEqual(task["status"], RUNNING)

        response = self.client.patch(
            f"{self.url}{task_id}/",
            format="json",
            data={
                "should_be_killed": True,
            },
        )
        response = self.assertJSONResponse(response, 200)
        task = response
        self.assertEqual(task["id"], task_id)
        self.assertEqual(task["status"], KILLED)
