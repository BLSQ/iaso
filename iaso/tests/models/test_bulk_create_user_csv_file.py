import os

from django.core.files.storage import default_storage
from django.core.files.uploadedfile import InMemoryUploadedFile

from iaso.models import BulkCreateUserCsvFile
from iaso.test import IasoTestCaseMixin, TestCase


class BulkCreateUserCsvFileTestCase(TestCase, IasoTestCaseMixin):
    FILE_NAME = "test_user_bulk_create_valid.csv"
    FILE_PATH = f"iaso/tests/fixtures/{FILE_NAME}"

    def setUp(self):
        # Preparing test data
        account_1_name = "test account 1"
        self.account_1, self.data_source_1, self.version_1, self.project_1 = (
            self.create_account_datasource_version_project("source 1", account_1_name, "project 1")
        )
        account_2_name = "***///"
        self.account_2, self.data_source_2, self.version_2, self.project_2 = (
            self.create_account_datasource_version_project("source 2", account_2_name, "project 2")
        )

        self.user_1 = self.create_user_with_profile(account=self.account_1, username="user 1")
        self.user_2 = self.create_user_with_profile(account=self.account_2, username="user 2")

        # Removing all InMemoryFileNodes inside the storage to avoid name conflicts - some can be kept by previous test classes
        default_storage._root._children.clear()  # see InMemoryFileStorage in django/core/files/storage/memory.py
        super().setUp()

    def test_upload_to_happy_path(self):
        # Upload with a user that belongs to a (correctly named) account
        with open(self.FILE_PATH) as opened_file:
            csv_file = InMemoryUploadedFile(
                opened_file,
                field_name="file",
                name=self.FILE_NAME,
                content_type="text/csv",
                size=os.path.getsize(self.FILE_PATH),
                charset="text/csv",
            )
            bulk_create = BulkCreateUserCsvFile.objects.create(
                created_by=self.user_1,
                account=self.account_1,
                file=csv_file,
            )

        expected_file_name = f"{self.account_1.short_sanitized_name}_{self.account_1.id}/bulk_create_user_csv/{bulk_create.created_at.strftime('%Y_%m')}/{self.FILE_NAME}"
        self.assertEqual(bulk_create.file.name, expected_file_name)

    def test_upload_to_no_account(self):
        with open(self.FILE_PATH) as opened_file:
            csv_file = InMemoryUploadedFile(
                opened_file,
                field_name="file",
                name=self.FILE_NAME,
                content_type="text/csv",
                size=os.path.getsize(self.FILE_PATH),
                charset="text/csv",
            )
            bulk_create = BulkCreateUserCsvFile.objects.create(
                file=csv_file,
            )

        expected_file_name = (
            f"unknown_account/bulk_create_user_csv/{bulk_create.created_at.strftime('%Y_%m')}/{self.FILE_NAME}"
        )
        self.assertEqual(bulk_create.file.name, expected_file_name)

    def test_upload_to_invalid_account_name(self):
        with open(self.FILE_PATH) as opened_file:
            csv_file = InMemoryUploadedFile(
                opened_file,
                field_name="file",
                name=self.FILE_NAME,
                content_type="text/csv",
                size=os.path.getsize(self.FILE_PATH),
                charset="text/csv",
            )
            bulk_create = BulkCreateUserCsvFile.objects.create(
                created_by=self.user_2,
                account=self.account_2,
                file=csv_file,
            )

        expected_file_name = f"invalid_name_{self.account_2.id}/bulk_create_user_csv/{bulk_create.created_at.strftime('%Y_%m')}/{self.FILE_NAME}"
        self.assertEqual(bulk_create.file.name, expected_file_name)
