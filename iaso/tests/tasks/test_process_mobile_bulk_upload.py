import datetime
import os
import pytz
import uuid
import zipfile

from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.core.files import File
from django.test import TestCase
from unittest import mock

from hat.api_import.models import APIImport
from hat.audit.models import BULK_UPLOAD, BULK_UPLOAD_MERGED_ENTITY, Modification
from iaso import models as m
from iaso.api.deduplication.entity_duplicate import merge_entities
from iaso.tasks.process_mobile_bulk_upload import process_mobile_bulk_upload

CATT_TABLET_DIR = "catt_one_test_with_image"
LABO_TABLET_DIR = "labo_update_registration_form"
DISASI_ONLY_TABLET_DIR = "disasi_only"

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
CORRECT_FILES_FOR_DISASI_ONLY_ZIP = [
    DISASI_MAKULO_REGISTRATION,
    DISASI_MAKULO_CATT,
    "instances.json",
    "orgUnits.json",
]

DEFAULT_CREATED_AT = datetime.datetime(2024, 4, 1, 0, 0, 5, tzinfo=pytz.UTC)
DEFAULT_CREATED_AT_STR = "2024-04-01"


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


def create_entity_with_registration(
    self,
    name,
    uuid,
    creation_timestamp=DEFAULT_CREATED_AT,
    deleted=False,
):
    entity = m.Entity.objects.create(
        name=name,
        uuid=uuid,
        entity_type=self.default_entity_type,
        account=m.Account.objects.first(),
    )
    if deleted:
        entity.deleted_at = datetime.datetime.now(pytz.UTC)

    with open("iaso/fixtures/instance_form_1_1.xml", "rb") as form_instance_file:
        instance = m.Instance.objects.create(
            uuid=uuid,
            entity=entity,
            form=self.form_registration,
            deleted=deleted,
            file=File(form_instance_file),
            json={"some": "thing"},
            source_created_at=creation_timestamp,
            source_updated_at=creation_timestamp,
        )
    entity.attributes = instance
    entity.save()

    return entity


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
        self.account = m.Account.objects.first()
        self.task = m.Task.objects.create(
            name="process_mobile_bulk_upload",
            launcher=self.user,
            account=self.account,
        )

        # Create 2 forms: Registration + CATT
        self.form_registration = m.Form.objects.create(id=1, name="Enregistrement", single_per_period=False)
        self.form_catt = m.Form.objects.create(id=2, name="CATT", single_per_period=False)

        self.default_entity_type = m.EntityType.objects.create(
            id=1, name="Participant", reference_form=self.form_registration
        )

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
        ent_disasi = m.Entity.objects.get(uuid=DISASI_MAKULO_REGISTRATION)
        entity_patrice = m.Entity.objects.get(uuid=PATRICE_AKAMBU_REGISTRATION)
        self.assertEquals(m.Instance.objects.count(), 4)
        self.assertEquals(m.InstanceFile.objects.count(), 2)

        # Entity 1: Disasi Makulo
        reg_instance = m.Instance.objects.get(uuid=DISASI_MAKULO_REGISTRATION)
        self.assertEquals(reg_instance.json.get("_full_name"), "Disasi Makulo")
        self.assertEquals(reg_instance.entity, ent_disasi)
        self.assertEquals(reg_instance.instancefile_set.count(), 0)

        catt_instance = m.Instance.objects.get(uuid=DISASI_MAKULO_CATT)
        self.assertEquals(catt_instance.json.get("result"), "positive")
        self.assertEquals(catt_instance.entity, ent_disasi)
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

        # Verify we leave an audit trail of the update
        content_type = ContentType.objects.get_by_natural_key("iaso", "instance")
        modifications = Modification.objects.filter(
            object_id=instance_disasi.id,
            content_type=content_type,
        )
        self.assertEquals(len(modifications), 1)
        modif = modifications[0]
        self.assertEquals(modif.source, BULK_UPLOAD)
        self.assertEquals(modif.past_value[0]["fields"]["source_updated_at"].split("T")[0], "2024-04-05")
        self.assertEquals(modif.new_value[0]["fields"]["source_updated_at"].split("T")[0], "2024-04-17")

    def test_soft_deleted_entity(self, mock_download_file):
        # Create soft-deleted entity Disasi with only registration form
        ent_disasi = create_entity_with_registration(
            self,
            name="Disasi",
            uuid=DISASI_MAKULO_REGISTRATION,
            deleted=True,
        )
        reg_disasi = ent_disasi.attributes

        with zipfile.ZipFile(f"/tmp/{CATT_TABLET_DIR}.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir(CATT_TABLET_DIR), CORRECT_FILES_FOR_ZIP)

        mock_download_file.return_value = f"/tmp/{CATT_TABLET_DIR}.zip"

        self.assertEquals(m.Entity.objects.count(), 0)
        self.assertEquals(m.Instance.objects.exclude(deleted=True).count(), 0)
        self.assertEquals(m.Instance.objects.filter(deleted=True).count(), 1)
        self.assertEquals(m.InstanceFile.objects.count(), 0)
        self.assertEquals(reg_disasi.source_updated_at.date().isoformat(), DEFAULT_CREATED_AT_STR)

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

        # Patrice entity was created, new CATT form is added as deleted to Disasi
        self.assertEquals(m.Entity.objects_only_deleted.count(), 1)
        self.assertEquals(m.Entity.objects.count(), 1)
        self.assertEquals(m.Instance.objects.exclude(deleted=True).count(), 2)
        self.assertEquals(m.Instance.objects.filter(deleted=True).count(), 2)
        self.assertEquals(m.InstanceFile.objects.count(), 2)

        # Entity 1: Disasi Makulo stays soft-deleted, registration is updated
        # and CATT form is added
        reg_disasi.refresh_from_db()
        self.assertEquals(reg_disasi.source_updated_at.date().isoformat(), "2024-04-05")
        catt_instance = m.Instance.objects.get(uuid=DISASI_MAKULO_CATT)
        self.assertTrue(catt_instance.deleted)

        # Entity 2: Patrice Akambu is created as before, make sure the image is
        # duplicated as should be
        catt_instance = m.Instance.objects.get(uuid=PATRICE_AKAMBU_CATT)
        image = catt_instance.instancefile_set.first()
        self.assertEquals(image.name, "1712326156339.webp")

    def test_merged_entity(self, mock_download_file):
        # Setup: Create entity Disasi (with uuid as in bulk upload), along with a
        # duplicate, then merge them.
        ent_disasi_A = create_entity_with_registration(self, name="Disasi A", uuid=DISASI_MAKULO_REGISTRATION)
        ent_disasi_B = create_entity_with_registration(self, name="Disasi B", uuid=uuid.uuid4())

        ent_disasi_C = merge_entities(ent_disasi_A, ent_disasi_B, {}, self.user)
        ent_disasi_C.name = "Disasi C"
        ent_disasi_C.save()
        self.assertEquals(m.Instance.objects.count(), 3)

        # Only add data for Disasi to avoid confusion
        with zipfile.ZipFile(f"/tmp/{DISASI_ONLY_TABLET_DIR}.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir(DISASI_ONLY_TABLET_DIR), CORRECT_FILES_FOR_DISASI_ONLY_ZIP)
        mock_download_file.return_value = f"/tmp/{DISASI_ONLY_TABLET_DIR}.zip"

        for ent in [ent_disasi_A, ent_disasi_B, ent_disasi_C]:
            self.assertEquals(ent.attributes.source_updated_at.date().isoformat(), DEFAULT_CREATED_AT_STR)

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

        # Disasi A and B have no changes
        # Disasi C has reg form updated + new CATT form (not deleted)
        self.assertEquals(m.Instance.objects.count(), 4)
        ent_disasi_A.refresh_from_db()
        ent_disasi_B.refresh_from_db()
        ent_disasi_C.refresh_from_db()

        self.assertEquals(ent_disasi_A.instances.count(), 1)
        self.assertEquals(ent_disasi_A.attributes.source_updated_at.date().isoformat(), "2024-04-05")

        self.assertEquals(ent_disasi_B.instances.count(), 1)
        self.assertEquals(ent_disasi_B.attributes.source_updated_at.date().isoformat(), DEFAULT_CREATED_AT_STR)

        self.assertEquals(ent_disasi_C.instances.count(), 2)
        reg_disasi_C = ent_disasi_C.attributes
        self.assertEquals(reg_disasi_C.source_updated_at.date().isoformat(), "2024-04-05")
        catt_disasi_C = ent_disasi_C.instances.get(form=self.form_catt)
        self.assertEquals(catt_disasi_C.uuid, DISASI_MAKULO_CATT)
        self.assertFalse(catt_disasi_C.deleted)

        # Verify we leave an audit trail of the update
        content_type = ContentType.objects.get_by_natural_key("iaso", "instance")
        modifications = Modification.objects.filter(
            object_id=reg_disasi_C.id,
            content_type=content_type,
        )
        self.assertEquals(len(modifications), 1)
        modif = modifications[0]
        self.assertEquals(modif.source, BULK_UPLOAD_MERGED_ENTITY)
        self.assertEquals(modif.past_value[0]["fields"]["source_updated_at"].split("T")[0], DEFAULT_CREATED_AT_STR)
        self.assertEquals(modif.new_value[0]["fields"]["source_updated_at"].split("T")[0], "2024-04-05")

    def test_double_merged_entity(self, mock_download_file):
        """
        When we merge a merged entity, we should still receive the data on the
        correct (final) entity.
        """
        # Setup: Create entity Disasi (with uuid as in bulk upload), along with two
        # duplicates. Merge Disasi with the first duplicate, then merge that one with
        # with the second.
        # A --
        #     X-- Merged 1 --
        # B --                X-- Merged 2
        # C ------------------
        # Now when we receive data for A, it should end up on Merged 2.
        ent_disasi_A = create_entity_with_registration(self, name="Disasi A", uuid=DISASI_MAKULO_REGISTRATION)
        ent_disasi_B = create_entity_with_registration(self, name="Disasi B", uuid=uuid.uuid4())
        ent_disasi_C = create_entity_with_registration(self, name="Disasi C", uuid=uuid.uuid4())

        ent_disasi_merged_1 = merge_entities(ent_disasi_A, ent_disasi_B, {}, self.user)
        ent_disasi_merged_1.name = "Disasi Merged 1"
        ent_disasi_merged_1.save()

        # Override the file, had some issues with the generated one and calling the
        # merge_entities again in the test.
        attrs = ent_disasi_merged_1.attributes
        with open("iaso/fixtures/instance_form_1_1.xml", "rb") as f:
            attrs.file = File(f)
            attrs.save()
        ent_disasi_merged_2 = merge_entities(ent_disasi_merged_1, ent_disasi_C, {}, self.user)
        ent_disasi_merged_2.name = "Disasi Merged 2"
        ent_disasi_merged_2.save()

        self.assertEquals(m.Instance.objects.count(), 5)

        # Only add data for Disasi to avoid confusion
        with zipfile.ZipFile(f"/tmp/{DISASI_ONLY_TABLET_DIR}.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir(DISASI_ONLY_TABLET_DIR), CORRECT_FILES_FOR_DISASI_ONLY_ZIP)

        mock_download_file.return_value = f"/tmp/{DISASI_ONLY_TABLET_DIR}.zip"

        all_entities = [ent_disasi_A, ent_disasi_B, ent_disasi_C, ent_disasi_merged_1, ent_disasi_merged_2]
        for ent in all_entities:
            self.assertEquals(ent.attributes.source_updated_at.date().isoformat(), DEFAULT_CREATED_AT_STR)

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

        # Disasi A, B, C and Merged 1 have no changes
        # Disasi Merged 2 has reg form updated + new CATT form (not deleted)
        self.assertEquals(m.Instance.objects.count(), 6)

        for ent in all_entities:
            ent.refresh_from_db()

        self.assertEquals(ent_disasi_A.instances.count(), 1)
        self.assertEquals(ent_disasi_A.attributes.source_updated_at.date().isoformat(), "2024-04-05")

        for ent in [ent_disasi_B, ent_disasi_C, ent_disasi_merged_1]:
            self.assertEquals(ent.instances.count(), 1)
            self.assertEquals(ent.attributes.source_updated_at.date().isoformat(), DEFAULT_CREATED_AT_STR)

        self.assertEquals(ent_disasi_merged_2.instances.count(), 2)
        reg_disasi_merged_2 = ent_disasi_merged_2.attributes
        self.assertEquals(reg_disasi_merged_2.source_updated_at.date().isoformat(), "2024-04-05")
        catt_disasi_merged_2 = ent_disasi_merged_2.instances.get(form=self.form_catt)
        self.assertEquals(catt_disasi_merged_2.uuid, DISASI_MAKULO_CATT)
        self.assertFalse(catt_disasi_merged_2.deleted)

        # Verify we leave an audit trail of the update
        content_type = ContentType.objects.get_by_natural_key("iaso", "instance")
        modifications = Modification.objects.filter(
            object_id=reg_disasi_merged_2.id,
            content_type=content_type,
        )
        self.assertEquals(len(modifications), 1)
        modif = modifications[0]
        self.assertEquals(modif.source, BULK_UPLOAD_MERGED_ENTITY)
        self.assertEquals(modif.past_value[0]["fields"]["source_updated_at"].split("T")[0], DEFAULT_CREATED_AT_STR)
        self.assertEquals(modif.new_value[0]["fields"]["source_updated_at"].split("T")[0], "2024-04-05")

    # WC2-580: Don't break on duplicate uuid if they're soft deleted
    # Scenarios:
    # - 1 active, 1 deleted -> take the active one
    # - 0 active, 1 delete -> covered by test_soft_deleted_entity
    # - 0 active, 2 deleted -> take the most "correc" deleted one
    # - More than 1 active, n deleted -> take an active one, log Sentry exception
    def test_duplicate_uuids_1_active_1_deleted(self, mock_download_file):
        # Create active + soft-deleted entity Disasi with same uuid
        ent_active = create_entity_with_registration(self, name="Disasi", uuid=DISASI_MAKULO_REGISTRATION)
        # create it with a different uuid to avoid clash on instance uuid
        ent_deleted = create_entity_with_registration(self, name="Disasi", uuid=uuid.uuid4(), deleted=True)
        # then set it to same uuid as active entity
        ent_deleted.uuid = DISASI_MAKULO_REGISTRATION
        ent_deleted.save()

        # Only add data for Disasi to avoid confusion
        with zipfile.ZipFile(f"/tmp/{DISASI_ONLY_TABLET_DIR}.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir(DISASI_ONLY_TABLET_DIR), CORRECT_FILES_FOR_DISASI_ONLY_ZIP)
        mock_download_file.return_value = f"/tmp/{DISASI_ONLY_TABLET_DIR}.zip"

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id, project_id=self.project.id, task=self.task, _immediate=True
        )

        mock_download_file.assert_called_once()

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEquals(self.task.status, m.SUCCESS)
        self.api_import.refresh_from_db()
        self.assertFalse(self.api_import.has_problem)

        # Active entity was updated, deleted one stays the same
        self.assertEquals(ent_active.instances.count(), 2)
        self.assertEquals(ent_deleted.instances.count(), 1)

    def test_duplicate_uuids_0_active_2_deleted(self, mock_download_file):
        # Create two soft-deleted entities Disasi with same uuid.
        ent1 = create_entity_with_registration(self, name="Disasi", uuid=DISASI_MAKULO_REGISTRATION, deleted=True)
        ent2 = create_entity_with_registration(self, name="Disasi", uuid=uuid.uuid4(), deleted=True)
        ent2.uuid = DISASI_MAKULO_REGISTRATION
        ent2.save()

        # Only add data for Disasi to avoid confusion
        with zipfile.ZipFile(f"/tmp/{DISASI_ONLY_TABLET_DIR}.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir(DISASI_ONLY_TABLET_DIR), CORRECT_FILES_FOR_DISASI_ONLY_ZIP)
        mock_download_file.return_value = f"/tmp/{DISASI_ONLY_TABLET_DIR}.zip"

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id, project_id=self.project.id, task=self.task, _immediate=True
        )

        mock_download_file.assert_called_once()

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEquals(self.task.status, m.SUCCESS)
        self.api_import.refresh_from_db()
        self.assertFalse(self.api_import.has_problem)

        # New instance was added to the first entity
        self.assertEquals(ent1.instances.count(), 2)
        self.assertEquals(ent2.instances.count(), 1)

    @mock.patch("iaso.api.instances.logger")
    def test_duplicate_uuids_multiple_active(self, mock_logger, mock_download_file):
        # Create two active Disasi with same uuid
        ent1 = create_entity_with_registration(self, name="Disasi", uuid=DISASI_MAKULO_REGISTRATION)
        ent2 = create_entity_with_registration(self, name="Disasi", uuid=uuid.uuid4())
        ent2.uuid = DISASI_MAKULO_REGISTRATION
        ent2.save()

        # Only add data for Disasi to avoid confusion
        with zipfile.ZipFile(f"/tmp/{DISASI_ONLY_TABLET_DIR}.zip", "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir(DISASI_ONLY_TABLET_DIR), CORRECT_FILES_FOR_DISASI_ONLY_ZIP)
        mock_download_file.return_value = f"/tmp/{DISASI_ONLY_TABLET_DIR}.zip"

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id, project_id=self.project.id, task=self.task, _immediate=True
        )

        mock_download_file.assert_called_once()

        # The job passes without error
        self.task.refresh_from_db()
        self.assertEquals(self.task.status, m.SUCCESS)
        self.api_import.refresh_from_db()
        self.assertFalse(self.api_import.has_problem)

        # One of the 2 entities was updated, we get notified with a Sentry
        self.assertEquals(ent1.instances.count() + ent2.instances.count(), 3)
        err_msg = f"Multiple non-deleted entities for UUID {ent1.uuid}, entity_type_id {self.default_entity_type.id}"
        mock_logger.exception.assert_called_once_with(err_msg)
