import os
import zipfile

from django.contrib.auth.models import User
from django.test import TestCase
from unittest import mock, skip

from hat.api_import.models import APIImport
from iaso import models as m
from iaso.tasks.process_mobile_bulk_upload import process_mobile_bulk_upload

CATT_TABLET_DIR = "catt_one_test_with_image"
LABO_TABLET_DIR = "labo_update_registration_form"

DISASI_MAKULO_REGISTRATION = "3f0ed68e-bfcf-4395-a2a5-a5821390ae1b"
DISASI_MAKULO_CATT = "a5362052-408f-44f8-8abc-2a520c01ea10"
PATRICE_AKAMBU_REGISTRATION = "90619ebe-4aa5-4eca-ae66-bf989bfb1539"
PATRICE_AKAMBU_CATT = "f55b0eff-b353-49ea-93b9-0257b6b807c4"

CORRECT_FILES_FOR_ZIP = [
    DISASI_MAKULO_REGISTRATION,
    DISASI_MAKULO_CATT,
    PATRICE_AKAMBU_REGISTRATION,
    PATRICE_AKAMBU_CATT,
    "instances.json",
    "orgUnits.json",
]


def zip_fixture_dir(tablet_dir):
    return f"iaso/tests/fixtures/mobile_bulk_uploads/{tablet_dir}"


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
        self.api_import = APIImport.objects.create(
            user=self.user,
            import_type="bulk",
            json_body={"file": CATT_TABLET_DIR},
        )
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
        with zipfile.ZipFile(f"/tmp/{CATT_TABLET_DIR}.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir(CATT_TABLET_DIR), CORRECT_FILES_FOR_ZIP)

        mock_download_file.return_value = f"/tmp/{CATT_TABLET_DIR}.zip"

        self.assertEquals(m.Entity.objects.count(), 0)
        self.assertEquals(m.Instance.objects.count(), 0)
        self.assertEquals(m.InstanceFile.objects.count(), 0)

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id,
            project_id=self.project.id,
            task=self.task,
            _immediate=True,
        )

        mock_download_file.assert_called_once()

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEquals(self.task.status, m.SUCCESS)

        self.api_import.refresh_from_db()
        self.assertEquals(self.api_import.import_type, "bulk")
        self.assertFalse(self.api_import.has_problem)

        # Org unit was created
        ou = m.OrgUnit.objects.get(name="New Org Unit")
        self.assertIsNotNone(ou)
        self.assertEquals(ou.validation_status, m.OrgUnit.VALIDATION_NEW)

        # Instances (Submissions) + Entity were created
        self.assertEquals(m.Entity.objects.count(), 2)
        entity_disasi = m.Entity.objects.get(uuid=DISASI_MAKULO_REGISTRATION)
        entity_patrice = m.Entity.objects.get(uuid=PATRICE_AKAMBU_REGISTRATION)
        self.assertEquals(m.Instance.objects.count(), 4)
        self.assertEquals(m.InstanceFile.objects.count(), 2)

        # Entity 1: Disasi Makulo
        reg_instance = m.Instance.objects.get(uuid=DISASI_MAKULO_REGISTRATION)
        self.assertEquals(reg_instance.json.get("_full_name"), "Disasi Makulo")
        self.assertEquals(reg_instance.entity, entity_disasi)
        self.assertEquals(reg_instance.instancefile_set.count(), 0)

        catt_instance = m.Instance.objects.get(uuid=DISASI_MAKULO_CATT)
        self.assertEquals(catt_instance.json.get("result"), "positive")
        self.assertEquals(catt_instance.entity, entity_disasi)
        self.assertEquals(catt_instance.instancefile_set.count(), 1)
        image = catt_instance.instancefile_set.first()
        self.assertEquals(image.name, "1712326156339.webp")

        # Entity 2: Patrice Akambu
        reg_instance = m.Instance.objects.get(uuid=PATRICE_AKAMBU_REGISTRATION)
        self.assertEquals(reg_instance.json.get("_full_name"), "Patrice Akambu")
        self.assertEquals(reg_instance.entity, entity_patrice)
        self.assertEquals(reg_instance.instancefile_set.count(), 0)

        catt_instance = m.Instance.objects.get(uuid=PATRICE_AKAMBU_CATT)
        self.assertEquals(catt_instance.json.get("result"), "positive")
        self.assertEquals(catt_instance.entity, entity_patrice)
        self.assertEquals(catt_instance.instancefile_set.count(), 1)
        # image from Disasi's CATT was duplicated to this test
        image = catt_instance.instancefile_set.first()
        self.assertEquals(image.name, "1712326156339.webp")

    def test_fail_in_the_middle_of_import(self, mock_download_file):
        # Org unit doesn't exist. The job will fail, then verify that
        # nothing was created.
        INCORRECT_FILES_FOR_ZIP = ["instances.json"]
        with zipfile.ZipFile(f"/tmp/{CATT_TABLET_DIR}.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(
                zipf,
                zip_fixture_dir(CATT_TABLET_DIR),
                INCORRECT_FILES_FOR_ZIP,
            )
        mock_download_file.return_value = f"/tmp/{CATT_TABLET_DIR}.zip"

        self.assertEquals(m.Entity.objects.count(), 0)
        self.assertEquals(m.Instance.objects.count(), 0)

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id,
            project_id=self.project.id,
            task=self.task,
            _immediate=True,
        )

        mock_download_file.assert_called_once()

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEquals(self.task.status, m.ERRORED)

        self.api_import.refresh_from_db()
        self.assertEquals(self.api_import.import_type, "bulk")
        self.assertTrue(self.api_import.has_problem)

        # Nothing was created
        self.assertFalse(m.OrgUnit.objects.filter(name="New Org Unit").exists())
        self.assertEquals(m.Entity.objects.count(), 0)
        self.assertEquals(m.Instance.objects.count(), 0)
        self.assertEquals(m.InstanceFile.objects.count(), 0)

    # SLEEP-1448: Update an existing registration form (with a different file path
    # on the already created instance)
    def test_reference_form_update(self, mock_download_file):
        # Do an import with the CATT tablet first to already create Disasi Makulo
        with zipfile.ZipFile(f"/tmp/{CATT_TABLET_DIR}.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir(CATT_TABLET_DIR), CORRECT_FILES_FOR_ZIP)
        mock_download_file.return_value = f"/tmp/{CATT_TABLET_DIR}.zip"
        process_mobile_bulk_upload(
            api_import_id=self.api_import.id,
            project_id=self.project.id,
            task=self.task,
            _immediate=True,
        )

        instance_disasi = m.Instance.objects.get(uuid=DISASI_MAKULO_REGISTRATION)
        instance_patrice = m.Instance.objects.get(uuid=PATRICE_AKAMBU_REGISTRATION)
        self.assertEquals(instance_disasi.source_updated_at.date().isoformat(), "2024-04-05")
        self.assertEquals(instance_disasi.json["is_confirmed_positive"], "0")
        self.assertEquals(instance_patrice.source_updated_at.date().isoformat(), "2024-04-05")
        self.assertEquals(instance_patrice.json["is_confirmed_positive"], "0")

        # Now import with the LABO tablet to update Disasi Makulo.
        # Also contains Patrice Akambu, but with the same updated_at timestamp.
        task_2 = m.Task.objects.create(
            name="process_mobile_bulk_upload",
            launcher=self.user,
            account=m.Account.objects.first(),
        )
        api_import = APIImport.objects.create(
            user=self.user,
            import_type="bulk",
            json_body={"file": LABO_TABLET_DIR},
        )

        with zipfile.ZipFile(f"/tmp/{LABO_TABLET_DIR}.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir(LABO_TABLET_DIR), CORRECT_FILES_FOR_ZIP)
        mock_download_file.return_value = f"/tmp/{LABO_TABLET_DIR}.zip"
        process_mobile_bulk_upload(
            api_import_id=api_import.id,
            project_id=self.project.id,
            task=task_2,
            _immediate=True,
        )

        # check Task status and result
        task_2.refresh_from_db()
        self.assertEquals(task_2.status, m.SUCCESS)

        self.assertEquals(APIImport.objects.count(), 2)
        api_import = APIImport.objects.last()
        self.assertEquals(api_import.import_type, "bulk")
        self.assertFalse(api_import.has_problem)

        # Verify that only Disasi was changed
        instance_disasi.refresh_from_db()
        instance_patrice.refresh_from_db()
        self.assertEquals(instance_disasi.source_updated_at.date().isoformat(), "2024-04-17")
        self.assertEquals(instance_disasi.json["is_confirmed_positive"], "1")
        self.assertEquals(instance_patrice.source_updated_at.date().isoformat(), "2024-04-05")
        self.assertEquals(instance_patrice.json["is_confirmed_positive"], "0")

        # Bug with extra .xml files of other form submissions being in the same
        # folder. Make sure they are not processed.
        self.assertEquals(instance_disasi.instancefile_set.count(), 0)
