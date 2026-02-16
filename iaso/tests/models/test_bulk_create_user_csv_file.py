from django.core.files.uploadedfile import UploadedFile

from iaso.models import BulkCreateUserCsvFile
from iaso.test import FileUploadToTestCase


class BulkCreateUserCsvFileTestCase(FileUploadToTestCase):
    FILE_NAME = "test_user_bulk_create_valid.csv"
    FILE_PATH = f"iaso/tests/fixtures/{FILE_NAME}"

    def test_upload_to_happy_path(self):
        # Upload with a user that belongs to a (correctly named) account
        with open(self.FILE_PATH) as csv_file:
            bulk_create = BulkCreateUserCsvFile.objects.create(
                created_by=self.user_1,
                account=self.account_1,
                file=UploadedFile(csv_file),
            )

        expected_file_name = f"{self.account_1.short_sanitized_name}_{self.account_1.id}/bulk_create_user_csv/{bulk_create.created_at.strftime('%Y_%m')}/{self.FILE_NAME}"
        self.assertEqual(bulk_create.file.name, expected_file_name)

    def test_upload_to_no_account(self):
        with open(self.FILE_PATH) as csv_file:
            bulk_create = BulkCreateUserCsvFile.objects.create(
                file=UploadedFile(csv_file),
            )

        expected_file_name = (
            f"unknown_account/bulk_create_user_csv/{bulk_create.created_at.strftime('%Y_%m')}/{self.FILE_NAME}"
        )
        self.assertEqual(bulk_create.file.name, expected_file_name)

    def test_upload_to_invalid_account_name(self):
        with open(self.FILE_PATH) as csv_file:
            bulk_create = BulkCreateUserCsvFile.objects.create(
                created_by=self.user_2,
                account=self.account_2,
                file=UploadedFile(csv_file),
            )

        expected_file_name = f"invalid_name_{self.account_2.id}/bulk_create_user_csv/{bulk_create.created_at.strftime('%Y_%m')}/{self.FILE_NAME}"
        self.assertEqual(bulk_create.file.name, expected_file_name)

    def test_upload_to_user_no_profile(self):
        with open(self.FILE_PATH) as csv_file:
            bulk_create = BulkCreateUserCsvFile.objects.create(
                created_by=self.user_no_profile,
                file=UploadedFile(csv_file),
            )

        expected_file_name = (
            f"unknown_account/bulk_create_user_csv/{bulk_create.created_at.strftime('%Y_%m')}/{self.FILE_NAME}"
        )
        self.assertEqual(bulk_create.file.name, expected_file_name)

    def test_csv_contains_same_user_name_twice(self):
        pass

    def test_csv_contains_org_units_from_wrong_account(self):
        # name
        # id
        pass

    def test_csv_contains_inaccessible_org_units(self):
        # for geo-restricted user
        # name
        # id
        pass

    def test_csv_contains_nonexistent_org_unit(self):
        # name
        # id
        pass

    def test_csv_contains_unknown_language(self):
        pass

    def test_csv_contains_wrong_project(self):
        # project does not exists
        # project from wrong account
        pass

    def test_csv_contains_wrong_org_unit_types(self):
        # org unit types does not exist
        # org unit type incompatible with project
        # org unit type incompatible with account
        # org unit type not editable by user
        pass

    def test_csv_contains_unknown_permission(self):
        # permission from inactive plugin
        # wrong permission name
        pass

    def test_csv_lacks_mandatory_fields(self):
        # username
        # password
        # both
        pass
