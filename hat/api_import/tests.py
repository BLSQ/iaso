from django.contrib.auth.models import User
from django.core.files.uploadedfile import UploadedFile

from hat.api_import.models import APIImport
from iaso.test import FileUploadToTestCase


class APIImportTestCase(FileUploadToTestCase):
    FILE_NAME = "test.xml"
    FILE_PATH = f"iaso/tests/fixtures/{FILE_NAME}"

    def test_upload_to_happy_path(self):
        # Upload with a user that belongs to a (correctly named) account
        with open(self.FILE_PATH, "rb") as xml_file:
            api_import = APIImport.objects.create(
                import_type="bulk",
                user=self.user_1,
                json_body={},
                file=UploadedFile(xml_file),
            )

        expected_file_name = f"{self.account_1.short_sanitized_name}_{self.account_1.id}/api_imports/{api_import.created_at.strftime('%Y_%m')}/{self.FILE_NAME}"
        self.assertEqual(api_import.file.name, expected_file_name)

    def test_upload_to_anonymous_user(self):
        with open(self.FILE_PATH, "rb") as xml_file:
            api_import = APIImport.objects.create(
                import_type="bulk",
                json_body={},
                file=UploadedFile(xml_file),
            )

        expected_file_name = f"unknown_account/api_imports/{api_import.created_at.strftime('%Y_%m')}/{self.FILE_NAME}"
        self.assertEqual(api_import.file.name, expected_file_name)

    def test_upload_to_invalid_account_name(self):
        with open(self.FILE_PATH, "rb") as xml_file:
            api_import = APIImport.objects.create(
                import_type="bulk",
                json_body={},
                user=self.user_2,
                file=UploadedFile(xml_file),
            )

        expected_file_name = (
            f"invalid_name_{self.account_2.id}/api_imports/{api_import.created_at.strftime('%Y_%m')}/{self.FILE_NAME}"
        )
        self.assertEqual(api_import.file.name, expected_file_name)

    def test_upload_to_user_no_profile(self):
        new_user = User.objects.create(
            username="new_user",
            first_name="New",
            last_name="User",
        )
        with open(self.FILE_PATH, "rb") as xml_file:
            api_import = APIImport.objects.create(
                import_type="bulk",
                json_body={},
                user=new_user,
                file=UploadedFile(xml_file),
            )
        expected_file_name = f"unknown_account/api_imports/{api_import.created_at.strftime('%Y_%m')}/{self.FILE_NAME}"
        self.assertEqual(api_import.file.name, expected_file_name)
