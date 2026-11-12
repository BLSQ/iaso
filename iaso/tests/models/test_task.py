import datetime

from iaso.models import Account, Task
from iaso.models.base import RUNNING, SUCCESS
from iaso.services.tasks import TaskResultFile
from iaso.test import TestCase


EXPIRES_AT = datetime.datetime(2023, 12, 27, 15, 0, 0, 0, tzinfo=datetime.UTC)


class TaskResultFileModelTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="Account")

    def setUp(self):
        self.task = Task.objects.create(account=self.account, name="Export", status=RUNNING)

    def test_report_success_with_file(self):
        self.task.report_success_with_file(message="Exported", file_name="export-files/export.zip")

        self.task.refresh_from_db()
        self.assertEqual(self.task.status, SUCCESS)
        self.assertEqual(self.task.progress_message, "Exported")
        self.assertEqual(self.task.result, {"result": SUCCESS, "data": "file:export-files/export.zip"})
        self.assertEqual(self.task.result_file, TaskResultFile(file="export-files/export.zip"))

    def test_report_success_with_file_and_expiry(self):
        self.task.report_success_with_file(
            message="Exported", file_name="export-files/export.zip", expires_at=EXPIRES_AT
        )

        self.task.refresh_from_db()
        self.assertEqual(
            self.task.result,
            {"result": SUCCESS, "data": {"file": "export-files/export.zip", "expires_at": "2023-12-27T15:00:00+00:00"}},
        )
        self.assertEqual(self.task.result_file, TaskResultFile(file="export-files/export.zip", expires_at=EXPIRES_AT))

    def test_result_file_without_file(self):
        for result in [None, {"result": SUCCESS, "message": "Done"}, {"result": SUCCESS, "data": {"rows": 12}}]:
            with self.subTest(result=result):
                self.task.result = result
                self.assertIsNone(self.task.result_file)
