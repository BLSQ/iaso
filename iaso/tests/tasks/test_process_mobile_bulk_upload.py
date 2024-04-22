import os
import zipfile

from django.contrib.auth.models import User
from django.test import TestCase
from unittest import mock

from hat.api_import.models import APIImport
from iaso import models as m
from iaso.tasks.process_mobile_bulk_upload import process_mobile_bulk_upload

ZIP_FIXTURE_DIR = "iaso/tests/fixtures/mobile_bulk_uploads/one_test_with_image_zip"
CORRECT_FILES_FOR_ZIP = [
    "3f0ed68e-bfcf-4395-a2a5-a5821390ae1b",  # Disasi Makulo CATT
    "a5362052-408f-44f8-8abc-2a520c01ea10",  # Disasi Makulo registration
    "f55b0eff-b353-49ea-93b9-0257b6b807c4",  # Patrice Akambu CATT
    "90619ebe-4aa5-4eca-ae66-bf989bfb1539",  # Patrice Akambu registration
    "instances.json",
    "orgUnits.json",
]


def add_to_zip(zipf, directory, subset):
    for root, _dirs, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            relative_path = os.path.relpath(file_path, directory)
            dir_path = os.path.dirname(relative_path)
            if relative_path in subset or any(dir_path.startswith(path) for path in subset):
                zipf.write(file_path, relative_path)


@mock.patch("iaso.tasks.process_mobile_bulk_upload.download_file")
class ProcessMobileBulkUploadTest(TestCase):
    fixtures = ["user.yaml", "orgunit.yaml"]

    def setUp(self):
        self.user = User.objects.first()
        self.project = m.Project.objects.first()
        self.task = m.Task.objects.create(
            name="process_mobile_bulk_upload",
            launcher=self.user,
            account=m.Account.objects.first(),
        )

        # Create 2 forms: Registration + CATT
        self.form_registration = m.Form.objects.create(id=1, name="Enregistrement", single_per_period=False)
        self.form_catt = m.Form.objects.create(id=2, name="CATT", single_per_period=False)

        self.entity_type = m.EntityType.objects.create(id=1, name="Participant", reference_form=self.form_registration)

    def test_success(self, mock_download_file):
        # Create the zip file: we create it on the fly to be able to clearly
        # see the contents in our repo. We then mock the file download method
        # to return the filepath to this zip.
        with zipfile.ZipFile("/tmp/one_test_with_image.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, ZIP_FIXTURE_DIR, CORRECT_FILES_FOR_ZIP)

        mock_download_file.return_value = "/tmp/one_test_with_image.zip"

        self.assertEquals(APIImport.objects.count(), 0)
        self.assertEquals(m.Entity.objects.count(), 0)
        self.assertEquals(m.Instance.objects.count(), 0)
        self.assertEquals(m.InstanceFile.objects.count(), 0)

        process_mobile_bulk_upload(
            user_id=self.user.id,
            project_id=self.project.id,
            zip_file_object_name="one_test_with_image_zip",
            task=self.task,
            _immediate=True,
        )

        mock_download_file.assert_called_once()

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEquals(self.task.status, m.SUCCESS)

        self.assertEquals(APIImport.objects.count(), 1)
        api_import = APIImport.objects.first()
        self.assertEquals(api_import.import_type, "bulk")
        self.assertFalse(api_import.has_problem)

        # Org unit was created
        ou = m.OrgUnit.objects.get(name="New Org Unit")
        self.assertIsNotNone(ou)
        self.assertEquals(ou.validation_status, m.OrgUnit.VALIDATION_NEW)

        # Instances (Submissions) + Entity were created
        self.assertEquals(m.Entity.objects.count(), 2)
        entity_disasi = m.Entity.objects.get(uuid="3f0ed68e-bfcf-4395-a2a5-a5821390ae1b")
        entity_patrice = m.Entity.objects.get(uuid="90619ebe-4aa5-4eca-ae66-bf989bfb1539")
        self.assertEquals(m.Instance.objects.count(), 4)
        self.assertEquals(m.InstanceFile.objects.count(), 2)

        # Entity 1: Disasi Makulo
        reg_instance = m.Instance.objects.get(uuid="3f0ed68e-bfcf-4395-a2a5-a5821390ae1b")
        self.assertEquals(reg_instance.json.get("_full_name"), "Disasi Makulo")
        self.assertEquals(reg_instance.entity, entity_disasi)
        self.assertEquals(reg_instance.instancefile_set.count(), 0)

        catt_instance = m.Instance.objects.get(uuid="a5362052-408f-44f8-8abc-2a520c01ea10")
        self.assertEquals(catt_instance.json.get("result"), "positive")
        self.assertEquals(catt_instance.entity, entity_disasi)
        self.assertEquals(catt_instance.instancefile_set.count(), 1)
        image = catt_instance.instancefile_set.first()
        self.assertEquals(image.name, "1712326156339.webp")

        # Entity 2: Patrice Akambu
        reg_instance = m.Instance.objects.get(uuid="90619ebe-4aa5-4eca-ae66-bf989bfb1539")
        self.assertEquals(reg_instance.json.get("_full_name"), "Patrice Akambu")
        self.assertEquals(reg_instance.entity, entity_patrice)
        self.assertEquals(reg_instance.instancefile_set.count(), 0)

        catt_instance = m.Instance.objects.get(uuid="f55b0eff-b353-49ea-93b9-0257b6b807c4")
        self.assertEquals(catt_instance.json.get("result"), "positive")
        self.assertEquals(catt_instance.entity, entity_patrice)
        self.assertEquals(catt_instance.instancefile_set.count(), 1)
        # image from Disasi's CATT was duplicated to this test
        image = catt_instance.instancefile_set.first()
        self.assertEquals(image.name, "1712326156339.webp")

    def test_fail_in_the_middle_of_import(self, mock_download_file):
        # Add all correct files as well as a wrong one. The job will fail, then
        # verify that nothing was created.
        with zipfile.ZipFile("/tmp/one_test_with_image.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, ZIP_FIXTURE_DIR, CORRECT_FILES_FOR_ZIP + ["incorrect-folder"])
        mock_download_file.return_value = "/tmp/one_test_with_image.zip"

        self.assertEquals(APIImport.objects.count(), 0)
        self.assertEquals(m.Entity.objects.count(), 0)
        self.assertEquals(m.Instance.objects.count(), 0)

        process_mobile_bulk_upload(
            user_id=self.user.id,
            project_id=self.project.id,
            zip_file_object_name="one_test_with_image_zip",
            task=self.task,
            _immediate=True,
        )

        mock_download_file.assert_called_once()

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEquals(self.task.status, m.ERRORED)

        self.assertEquals(APIImport.objects.count(), 1)
        api_import = APIImport.objects.first()
        self.assertEquals(api_import.import_type, "bulk")
        self.assertTrue(api_import.has_problem)

        # Nothing was created
        self.assertFalse(m.OrgUnit.objects.filter(name="New Org Unit").exists())
        self.assertEquals(m.Entity.objects.count(), 0)
        self.assertEquals(m.Instance.objects.count(), 0)
        self.assertEquals(m.InstanceFile.objects.count(), 0)
