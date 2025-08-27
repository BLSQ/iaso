from django.contrib.auth.models import User
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile

from hat.api_import.models import APIImport
from iaso.test import IasoTestCaseMixin, TestCase


class APIImportTestCase(TestCase, IasoTestCaseMixin):
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
        with open("iaso/tests/fixtures/test.xml", "rb") as xml_file:
            api_import = APIImport.objects.create(
                import_type="bulk",
                user=self.user_1,
                json_body={},
                file=UploadedFile(xml_file),
            )

        expected_file_name = f"{self.account_1.short_sanitized_name}_{self.account_1.id}/api_imports/{api_import.created_at.strftime('%Y_%m')}/test.xml"
        self.assertEqual(api_import.file.name, expected_file_name)

    def test_upload_to_anonymous_user(self):
        with open("iaso/tests/fixtures/test.xml", "rb") as xml_file:
            api_import = APIImport.objects.create(
                import_type="bulk",
                json_body={},
                file=UploadedFile(xml_file),
            )

        expected_file_name = f"unknown_account/api_imports/{api_import.created_at.strftime('%Y_%m')}/test.xml"
        self.assertEqual(api_import.file.name, expected_file_name)

    def test_upload_to_invalid_account_name(self):
        with open("iaso/tests/fixtures/test.xml", "rb") as xml_file:
            api_import = APIImport.objects.create(
                import_type="bulk",
                json_body={},
                user=self.user_2,
                file=UploadedFile(xml_file),
            )

        expected_file_name = (
            f"invalid_name_{self.account_2.id}/api_imports/{api_import.created_at.strftime('%Y_%m')}/test.xml"
        )
        self.assertEqual(api_import.file.name, expected_file_name)

    def test_upload_to_user_no_profile(self):
        new_user = User.objects.create(
            username="new_user",
            first_name="New",
            last_name="User",
        )
        with open("iaso/tests/fixtures/test.xml", "rb") as xml_file:
            api_import = APIImport.objects.create(
                import_type="bulk",
                json_body={},
                user=new_user,
                file=UploadedFile(xml_file),
            )
        expected_file_name = f"unknown_account/api_imports/{api_import.created_at.strftime('%Y_%m')}/test.xml"
        self.assertEqual(api_import.file.name, expected_file_name)
