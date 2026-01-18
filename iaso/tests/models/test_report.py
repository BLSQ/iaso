from django.core.files.uploadedfile import UploadedFile

from iaso.models import ReportVersion
from iaso.test import FileUploadToTestCase


class ReportVersionTestCase(FileUploadToTestCase):
    FILE_NAME = "test.xml"
    FILE_PATH = f"iaso/tests/fixtures/{FILE_NAME}"

    def test_upload_to_happy_path(self):
        # Upload with a user that belongs to a (correctly named) account
        with open(self.FILE_PATH, "rb") as xml_file:
            report_version = ReportVersion.objects.create(
                file=UploadedFile(xml_file),
                name="test report",
                created_by=self.user_1,
            )

        expected_file_name = (
            f"{self.account_1.short_sanitized_name}_{self.account_1.id}/report_versions/{self.FILE_NAME}"
        )
        self.assertEqual(report_version.file.name, expected_file_name)

    def test_upload_to_user_no_profile(self):
        # Upload with a user that does not have a profile (and thus no account)
        with open(self.FILE_PATH, "rb") as xml_file:
            report_version = ReportVersion.objects.create(
                file=UploadedFile(xml_file),
                name="test report",
                created_by=self.user_no_profile,
            )

        expected_file_name = f"unknown_account/report_versions/{self.FILE_NAME}"
        self.assertEqual(report_version.file.name, expected_file_name)

    def test_upload_to_invalid_account_name(self):
        with open(self.FILE_PATH, "rb") as xml_file:
            report_version = ReportVersion.objects.create(
                file=UploadedFile(xml_file),
                name="test report",
                created_by=self.user_2,
            )

        expected_file_name = f"invalid_name_{self.account_2.id}/report_versions/{self.FILE_NAME}"
        self.assertEqual(report_version.file.name, expected_file_name)

    def test_upload_to_anonymous(self):
        # Upload with no user at all (anonymous)
        with open(self.FILE_PATH, "rb") as xml_file:
            report_version = ReportVersion.objects.create(
                file=UploadedFile(xml_file),
                name="test report",
            )

        expected_file_name = f"unknown_account/report_versions/{self.FILE_NAME}"
        self.assertEqual(report_version.file.name, expected_file_name)
