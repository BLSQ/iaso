from django.db.models import Q
from rest_framework import status

from iaso.models import ImportGPKG
from iaso.models.import_gpkg import import_gpkg_upload_to
from iaso.models.org_unit import OrgUnit
from iaso.permissions.core_permissions import CORE_SOURCE_PERMISSION
from iaso.tests.tasks.task_api_test_case import TaskAPITestCase


class ImportGpkgAPITestCase(TaskAPITestCase):
    FILE_NAME = "minimal.gpkg"
    FILE_PATH = f"iaso/tests/fixtures/gpkg/{FILE_NAME}"

    @classmethod
    def setUpTestData(cls):
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            source_name="data source 1", account_name="account 1", project_name="project 1"
        )
        cls.user, cls.anon, cls.user_no_perms = cls.create_base_users(cls.account, [CORE_SOURCE_PERMISSION])

    def test_import_gpkg_happy_path(self):
        self.assertEqual(ImportGPKG.objects.count(), 0)

        self.client.force_authenticate(self.user)
        with open(self.FILE_PATH, "rb") as gpkg_file:
            response = self.client.post(
                "/api/tasks/create/importgpkg/",
                {
                    "file": gpkg_file,
                    "data_source": self.data_source.id,
                    "version_number": 1,
                    "description": "test import",
                    "default_valid": True,
                },
                format="multipart",
            )
        data = self.assertJSONResponse(response, status.HTTP_201_CREATED)
        self.assertIn("task", data)
        task_data = data["task"]
        self.assertIn("id", task_data)
        self.assertIn("status", task_data)
        self.assertEqual(task_data["status"], "QUEUED")

        self.assertEqual(ImportGPKG.objects.count(), 1)
        import_gpkg = ImportGPKG.objects.first()
        self.assertEqual(import_gpkg.version_number, 1)
        self.assertEqual(import_gpkg.description, "test import")
        self.assertEqual(import_gpkg.data_source, self.data_source)

        expected_file_name = import_gpkg_upload_to(import_gpkg, self.FILE_NAME)
        self.assertEqual(import_gpkg.file.name, expected_file_name)

        task = self.assertValidTaskAndInDB(task_data, status="QUEUED")

        self.runAndValidateTask(task, "SUCCESS")

        orgUnits = OrgUnit.objects.filter(version=self.source_version.id)
        self.assertEqual(orgUnits.count(), 3)

        for ou in orgUnits:
            self.assertEqual(ou.validation_status, OrgUnit.VALIDATION_VALID)

        self.assertEqual(orgUnits.filter(Q(path__isnull=True) | Q(path=[])).count(), 0)
