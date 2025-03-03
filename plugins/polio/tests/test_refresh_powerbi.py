from datetime import datetime
from iaso import models as m
from iaso.api.tasks.views import ExternalTaskModelViewSet
from iaso.test import APITestCase
from iaso.models.base import RUNNING, KILLED, SUCCESS, SKIPPED
from iaso.models.json_config import Config
from iaso.utils.powerbi import get_openhexa_config_for_data_set_id, launch_external_task, monitor_task_and_raise_if_fail
from plugins.polio.tasks.api.refresh_lqas_data import LQAS_CONFIG_SLUG, RefreshLQASDataViewset
from unittest.mock import patch

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
                "config": f"{cls.slug}",
                "user_id": cls.user.pk,
                "task_name": "Refresh dashboard",
                "timeout_count": 2,
                "expected_run_time": 1,
                "additional_timeout": 1,
            }
        }
        cls.openhexa_config = Config.objects.create(slug="openhexa_powerbi", content=cls.dataset_json)

    def mock_openhexa_call_success(slug=None, config=None, id_field=None, task_id=None):
        return SUCCESS

    def mock_openhexa_call_skipped(slug=None, config=None, id_field=None, task_id=None):
        return SKIPPED

    def mock_openhexa_call_running(slug=None, config=None, id_field=None, task_id=None):
        return RUNNING

    def test_get_openhexa_config_for_data_set_id(self):
        dataset_config = get_openhexa_config_for_data_set_id(self.dataset_id)
        self.assertDictEqual(dataset_config, self.dataset_json[self.dataset_id])

    @patch.object(ExternalTaskModelViewSet, "launch_task", mock_openhexa_call_running)
    def test_launch_external_task(self):
        dataset_config = self.dataset_json[self.dataset_id]
        task = launch_external_task(dataset_config)
        self.assertEqual(task.status, RUNNING)
        self.assertTrue(task.external)
        self.assertEqual(task.account, self.account)
        self.assertEqual(task.launcher, self.user)
        self.assertEqual(task.created_by, self.user)

    @patch.object(ExternalTaskModelViewSet, "launch_task", mock_openhexa_call_running)
    def test_monitor_task_and_fail(self):
        dataset_config = self.dataset_json[self.dataset_id]
        task = launch_external_task(dataset_config)
        with self.assertRaises(Exception) as raisedException:
            monitor_task_and_raise_if_fail(dataset_config, task)
        exception_message = raisedException.exception
        self.assertEqual("Refresh dashboard failed with status RUNNING", str(exception_message))

    @patch.object(ExternalTaskModelViewSet, "launch_task", mock_openhexa_call_success)
    def test_monitor_task_and_success(self):
        dataset_config = self.dataset_json[self.dataset_id]
        task = launch_external_task(dataset_config)
        hasException = False
        try:
            monitor_task_and_raise_if_fail(dataset_config, task)
        except:
            hasException = True
        self.assertFalse(hasException)
