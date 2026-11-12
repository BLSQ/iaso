import datetime

import time_machine

from django.test import SimpleTestCase

from iaso.services.tasks import TaskResultFile


EXPIRES_AT = datetime.datetime(2023, 12, 27, 15, 0, 0, 0, tzinfo=datetime.UTC)


class TaskResultFileTestCase(SimpleTestCase):
    def test_to_json_without_expiry(self):
        self.assertEqual(TaskResultFile(file="export-files/export.zip").to_json(), "file:export-files/export.zip")

    def test_to_json_with_expiry(self):
        self.assertEqual(
            TaskResultFile(file="export-files/export.zip", expires_at=EXPIRES_AT).to_json(),
            {"file": "export-files/export.zip", "expires_at": "2023-12-27T15:00:00+00:00"},
        )

    def test_from_json(self):
        for data, expected in [
            (None, None),
            ("Some message", None),
            ("file:export-files/export.zip", TaskResultFile(file="export-files/export.zip")),
            ({"rows": 12}, None),
            ({"file": ""}, None),
            ({"file": 12}, None),
            ({"file": "export.zip"}, TaskResultFile(file="export.zip")),
            ({"file": "export.zip", "expires_at": None}, TaskResultFile(file="export.zip")),
            (["export.zip"], None),
        ]:
            with self.subTest(data=data):
                self.assertEqual(TaskResultFile.from_json(data), expected)

    def test_from_json_expires_at(self):
        for raw_expires_at, expected in [
            ("2023-12-27T15:00:00+00:00", EXPIRES_AT),
            ("2023-12-27T15:00:00Z", EXPIRES_AT),
            ("2023-12-27T16:00:00+01:00", EXPIRES_AT),
            ("2023-12-27T15:00:00", EXPIRES_AT),  # fallback to UTC
            ("next week", None),
            ("2023-13-45T15:00:00Z", None),
            (1703689200, None),
        ]:
            with self.subTest(expires_at=raw_expires_at):
                result_file = TaskResultFile.from_json({"file": "export.zip", "expires_at": raw_expires_at})
                self.assertEqual(result_file, TaskResultFile(file="export.zip", expires_at=expected))

    def test_round_trip(self):
        for result_file in [
            TaskResultFile(file="export-files/export.zip"),
            TaskResultFile(file="export-files/export.zip", expires_at=EXPIRES_AT),
        ]:
            with self.subTest(result_file=result_file):
                self.assertEqual(TaskResultFile.from_json(result_file.to_json()), result_file)

    def test_expired(self):
        self.assertFalse(TaskResultFile(file="export.zip").expired)
        result_file = TaskResultFile(file="export.zip", expires_at=EXPIRES_AT)
        for now, expected_expired in [
            (EXPIRES_AT - datetime.timedelta(seconds=1), False),
            (EXPIRES_AT, True),
            (EXPIRES_AT + datetime.timedelta(days=1), True),
        ]:
            with self.subTest(now=now), time_machine.travel(now, tick=False):
                self.assertEqual(result_file.expired, expected_expired)
