from django.core.files.uploadedfile import UploadedFile

from iaso.models import ImportGPKG
from iaso.test import FileUploadToTestCase


class ImportGpkgTestCase(FileUploadToTestCase):
    FILE_NAME = "minimal.gpkg"
    FILE_PATH = f"iaso/tests/fixtures/gpkg/{FILE_NAME}"

    def test_upload_to_happy_path(self):
        # Upload with a user that belongs to a (correctly named) account
        with open(self.FILE_PATH, "rb") as gpkg_file:
            import_gpkg = ImportGPKG.objects.create(
                file=UploadedFile(gpkg_file),
                version_number=1,
                data_source=self.data_source_1,
            )

        expected_file_name = f"{self.account_1.short_sanitized_name}_{self.account_1.id}/import_gpkgs/{import_gpkg.created_at.strftime('%Y_%m')}/{self.FILE_NAME}"
        self.assertEqual(import_gpkg.file.name, expected_file_name)

    def test_upload_to_invalid_account_name(self):
        with open(self.FILE_PATH, "rb") as gpkg_file:
            import_gpkg = ImportGPKG.objects.create(
                file=UploadedFile(gpkg_file),
                version_number=1,
                data_source=self.data_source_2,
            )

        expected_file_name = (
            f"invalid_name_{self.account_2.id}/import_gpkgs/{import_gpkg.created_at.strftime('%Y_%m')}/{self.FILE_NAME}"
        )
        self.assertEqual(import_gpkg.file.name, expected_file_name)

    def test_upload_to_no_projects_in_data_source(self):
        self.project_1.data_sources.set([])
        with open(self.FILE_PATH, "rb") as gpkg_file:
            import_gpkg = ImportGPKG.objects.create(
                file=UploadedFile(gpkg_file),
                version_number=1,
                data_source=self.data_source_1,
            )
        expected_file_name = f"unknown_account/import_gpkgs/{import_gpkg.created_at.strftime('%Y_%m')}/{self.FILE_NAME}"
        self.assertEqual(import_gpkg.file.name, expected_file_name)
