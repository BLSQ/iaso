from unittest import mock

from beanstalk_worker.services import TestTaskService
from iaso import models as m
from iaso.tasks.dummy_task import dummy_task
from iaso.test import TestCase


@mock.patch("iaso.tasks.dummy_task.time.sleep")
class DummyTaskTestCase(TestCase):
    def setUp(self):
        account = m.Account.objects.create(name="A")
        self.user = self.create_user_with_profile(username="user", account=account)

    def test_success(self, sleep):
        task = dummy_task(duration=3, label="test", user=self.user)

        TestTaskService().run_all()

        task.refresh_from_db()
        self.assertEqual(task.status, m.SUCCESS)
        self.assertEqual(task.result["data"]["label"], "test")
        self.assertEqual(sleep.call_count, 3)

    def test_failure(self, sleep):
        task = dummy_task(duration=1, fail=True, user=self.user)

        TestTaskService().run_all()

        task.refresh_from_db()
        self.assertEqual(task.status, m.ERRORED)
        self.assertIn("failed on purpose", task.result["message"])

    @mock.patch("iaso.tasks.dummy_task.os._exit", side_effect=SystemExit)
    def test_crash(self, _exit, sleep):
        dummy_task(duration=4, crash=True, user=self.user)

        with self.assertRaises(SystemExit):
            TestTaskService().run_all()

        _exit.assert_called_once_with(1)
        self.assertEqual(sleep.call_count, 2)
