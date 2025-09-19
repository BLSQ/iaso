from datetime import datetime
from unittest.mock import patch

from iaso import models as m
from iaso.api.tasks.views import ExternalTaskModelViewSet
from iaso.models.base import RUNNING, SKIPPED, SUCCESS
from iaso.models.json_config import Config
from iaso.test import APITestCase
from iaso.utils.powerbi import (
    get_extra_config_for_data_set_id,
    launch_dataset_refresh,
    launch_external_task,
    monitor_task_and_raise_if_fail,
)
from plugins.polio.tasks.api.refresh_lqas_data import LQAS_CONFIG_SLUG


# ('/api/polio/powerbirefresh/', {
#           method: 'POST',
#           headers: {
#             'Content-Type': 'application/json'
#           },
#           body: JSON.stringify(data)
#         })


class RefreshPowerBITestCase(APITestCase):
    @classmethod
    def setUp(cls):
        cls.url = "/api/polio/powerbirefresh/"
        cls.account = account = m.Account.objects.create(name="test account")
        cls.user = cls.create_user_with_profile(username="test user", account=account, permissions=["iaso_polio"])

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
            name=LQAS_CONFIG_SLUG,
            started_at=datetime.now(),
            external=True,
        )
        cls.task2 = m.Task.objects.create(
            status=RUNNING, account=account, launcher=cls.user, name="task 2", external=True
        )

        cls.pipeline_json = {
            "pipeline": "pipeline",
            "openhexa_url": "https://yippie.openhexa.xyz/",
            "openhexa_token": "token",
            "pipeline_version": 1,
            "oh_pipeline_target": "staging",
        }
        cls.slug = "slug"
        cls.dataset_id = "dataset_id"
        cls.pipeline_config = Config.objects.create(slug=cls.slug, content=cls.pipeline_json)
        cls.dataset_json = {
            f"{cls.dataset_id}": {
                "openhexa": {
                    "config": f"{cls.slug}",
                    "user_id": cls.user.pk,
                    "task_name": "Refresh dashboard",
                    "timeout_count": 2,
                    "expected_run_time": 1,
                    "additional_timeout": 1,
                },
                "sync_refresh": ["some_dataset_id", "some_other_dataset_id"],
            }
        }
        cls.powerbi_config_json = {"client_id": "Who", "tenant_id": "David", "secret_value": "Victoria"}
        cls.openhexa_config = Config.objects.create(slug="powerbi_dataset_configs", content=cls.dataset_json)
        cls.powerbi_config = Config.objects.create(slug="powerbi_sp", content=cls.powerbi_config_json)

    def mock_openhexa_call_success(slug=None, config=None, id_field=None, task_id=None, pipeline_config=None):
        return SUCCESS

    def mock_openhexa_call_skipped(slug=None, config=None, id_field=None, task_id=None, pipeline_config=None):
        return SKIPPED

    def mock_openhexa_call_running(slug=None, config=None, id_field=None, task_id=None, pipeline_config=None):
        return RUNNING

    def mock_get_powerbi_service_principal_token(self, tenant_id=None, client_id=None, secret_value=None):
        return "token"

    def mock_launch_external_task(self, dataset_config=None):
        pass

    def mock_monitor_task_and_raise_if_fail(self, dataset_config=None, task=None):
        pass

    def test_get_extra_config_for_data_set_id(self):
        dataset_config = get_extra_config_for_data_set_id(self.dataset_id)
        self.assertDictEqual(dataset_config, self.dataset_json[self.dataset_id])

    @patch.object(ExternalTaskModelViewSet, "launch_task", mock_openhexa_call_running)
    def test_launch_external_task(self):
        dataset_config = self.dataset_json[self.dataset_id]["openhexa"]
        task = launch_external_task(dataset_config)
        self.assertEqual(task.status, RUNNING)
        self.assertTrue(task.external)
        self.assertEqual(task.account, self.account)
        self.assertEqual(task.launcher, self.user)
        self.assertEqual(task.created_by, self.user)

    @patch.object(ExternalTaskModelViewSet, "launch_task", mock_openhexa_call_running)
    def test_monitor_task_and_fail(self):
        dataset_config = self.dataset_json[self.dataset_id]["openhexa"]
        task = launch_external_task(dataset_config)
        with self.assertRaises(Exception) as raisedException:
            monitor_task_and_raise_if_fail(dataset_config, task)
        exception_message = raisedException.exception
        self.assertEqual("Refresh dashboard failed with status RUNNING", str(exception_message))

    @patch.object(ExternalTaskModelViewSet, "launch_task", mock_openhexa_call_success)
    def test_monitor_task_and_success(self):
        dataset_config = self.dataset_json[self.dataset_id]["openhexa"]
        task = launch_external_task(dataset_config)
        hasException = False
        try:
            monitor_task_and_raise_if_fail(dataset_config, task)
        except:
            hasException = True
        self.assertFalse(hasException)

    @patch("requests.post")
    @patch("iaso.utils.powerbi.get_powerbi_service_principal_token", mock_get_powerbi_service_principal_token)
    @patch("iaso.utils.powerbi.launch_external_task", mock_launch_external_task)
    @patch("iaso.utils.powerbi.monitor_task_and_raise_if_fail", mock_launch_external_task)
    @patch.object(ExternalTaskModelViewSet, "launch_task", mock_openhexa_call_success)
    def test_powerbi_updates(self, mock_post):
        group_id = "some_group_id"
        data_set_id = self.dataset_id
        extra_dataset_ids = self.dataset_json[data_set_id]["sync_refresh"]

        # Mock the PowerBI API responses for the main dataset and extra datasets
        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {}

        launch_dataset_refresh(group_id, data_set_id)

        # Assert that the correct number of API calls were made
        self.assertEqual(mock_post.call_count, 1 + len(extra_dataset_ids))
        # Assert that the API calls were made with the correct URLs
        expected_urls = [f"https://api.powerbi.com/v1.0/myorg/groups/{group_id}/datasets/{data_set_id}/refreshes"] + [
            f"https://api.powerbi.com/v1.0/myorg/groups/{group_id}/datasets/{extra_dataset_id}/refreshes"
            for extra_dataset_id in extra_dataset_ids
        ]
        actual_urls = [call[1]["url"] for call in mock_post.call_args_list]
        self.assertEqual(actual_urls, expected_urls)
