import datetime
import json
import os
import uuid
import zipfile

from unittest import mock

import pytz

from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.core.files import File
from django.core.files.storage import default_storage
from django.test import TestCase

from beanstalk_worker.services import TestTaskService
from hat.api_import.models import APIImport
from hat.audit.models import BULK_UPLOAD, BULK_UPLOAD_MERGED_ENTITY, Modification
from iaso import models as m
from iaso.api.deduplication.entity_duplicate import merge_entities
from iaso.models.instances import instance_file_upload_to, instance_upload_to
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

DISASI_MAKULO_INSTANCE_FILE_NAME = (
    "a5362052-408f-44f8-8abc-2a520c01ea10/16_12_127775b2-06a2-4ae6-b2bd-cf64143a9dfe_2024-04-05_16-09-42.xml"
)
DISASI_MAKULO_INSTANCE_ATTACHMENT_NAME = "a5362052-408f-44f8-8abc-2a520c01ea10/1712326156339.webp"


def zip_fixture_dir(subdir=""):
    return f"iaso/tests/fixtures/mobile_bulk_uploads/{subdir}"


def add_to_zip(zipf, directory, subset):
    for root, _dirs, files in os.walk(directory):
        for file in files:
            file_path = os.path.join(root, file)
            relative_path = os.path.relpath(file_path, directory)
            dir_path = os.path.dirname(relative_path)
            if relative_path in subset or any(dir_path.startswith(path) for path in subset):
                zipf.write(file_path, relative_path)


def save_file_to_api_import(api_import, file_path):
    assert os.path.exists(file_path)
    with open(file_path, "rb") as f:
        api_import.file = File(f, name=os.path.basename(file_path))
        api_import.save()


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


class ProcessMobileBulkUploadTest(TestCase):
    fixtures = ["user.yaml", "orgunit.yaml"]

    def setUp(self):
        self.user = User.objects.first()
        self.project = m.Project.objects.first()
        self.api_import = APIImport.objects.create(
            user=self.user,
            import_type="bulk",
            json_body={},
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

        # Removing all InMemoryFileNodes inside the storage to avoid name conflicts - some can be kept by previous test classes
        default_storage._root._children.clear()  # see InMemoryFileStorage in django/core/files/storage/memory.py

    def _create_zip_file(self):
        # Create the zip file: we create it on the fly to be able to clearly
        # see the contents in our repo. We then mock the file download method
        # to return the filepath to this zip.
        zip_path = f"/tmp/{CATT_TABLET_DIR}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir(CATT_TABLET_DIR), CORRECT_FILES_FOR_ZIP)
        save_file_to_api_import(self.api_import, zip_path)

    def test_success(self):
        self._create_zip_file()

        self.assertEqual(m.Entity.objects.count(), 0)
        self.assertEqual(m.Instance.objects.count(), 0)
        self.assertEqual(m.InstanceFile.objects.count(), 0)

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id,
            project_id=self.project.id,
            task=self.task,
            _immediate=True,
        )

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, m.SUCCESS)

        self.api_import.refresh_from_db()
        self.assertEqual(self.api_import.import_type, "bulk")
        self.assertFalse(self.api_import.has_problem)

        # Org unit was created
        ou = m.OrgUnit.objects.get(name="New Org Unit")
        self.assertIsNotNone(ou)
        self.assertEqual(ou.validation_status, m.OrgUnit.VALIDATION_NEW)
        self.assertEqual(int(ou.source_created_at.timestamp()), 1712326429)

        # Instances (Submissions) + Entity were created
        self.assertEqual(m.Entity.objects.count(), 2)
        ent_disasi = m.Entity.objects.get(uuid=DISASI_MAKULO_REGISTRATION)
        entity_patrice = m.Entity.objects.get(uuid=PATRICE_AKAMBU_REGISTRATION)
        self.assertEqual(m.Instance.objects.count(), 4)
        self.assertEqual(m.InstanceFile.objects.count(), 2)

        # Entity 1: Disasi Makulo
        reg_instance = m.Instance.objects.get(uuid=DISASI_MAKULO_REGISTRATION)
        self.assertEqual(reg_instance.json.get("_full_name"), "Disasi Makulo")
        self.assertEqual(reg_instance.entity, ent_disasi)
        self.assertEqual(reg_instance.instancefile_set.count(), 0)

        catt_instance = m.Instance.objects.get(uuid=DISASI_MAKULO_CATT)
        self.assertEqual(catt_instance.json.get("result"), "positive")
        self.assertEqual(catt_instance.entity, ent_disasi)
        self.assertEqual(catt_instance.instancefile_set.count(), 1)
        image = catt_instance.instancefile_set.first()
        self.assertEqual(image.name, "1712326156339.webp")

        # Checking if files are uploaded to the correct location
        generated_file_name = instance_upload_to(catt_instance, DISASI_MAKULO_INSTANCE_FILE_NAME)
        # as the generated file name is longer than 100 chars, Django truncates it and adds a random suffix to it
        # it's therefore impossible to strictly check for equality
        expected_file_name = generated_file_name[:85]
        self.assertTrue(catt_instance.file.name.startswith(expected_file_name))
        # same issue about name length for InstanceFile
        generated_attachment_name = instance_file_upload_to(image, DISASI_MAKULO_INSTANCE_ATTACHMENT_NAME)
        expected_attachment_name = generated_attachment_name[:85]
        self.assertTrue(image.file.name.startswith(expected_attachment_name))

        # Entity 2: Patrice Akambu
        reg_instance = m.Instance.objects.get(uuid=PATRICE_AKAMBU_REGISTRATION)
        self.assertEqual(reg_instance.json.get("_full_name"), "Patrice Akambu")
        self.assertEqual(reg_instance.entity, entity_patrice)
        self.assertEqual(reg_instance.instancefile_set.count(), 0)

        catt_instance = m.Instance.objects.get(uuid=PATRICE_AKAMBU_CATT)
        self.assertEqual(catt_instance.json.get("result"), "positive")
        self.assertEqual(catt_instance.entity, entity_patrice)
        self.assertEqual(catt_instance.instancefile_set.count(), 1)
        # image from Disasi's CATT was duplicated to this test
        image = catt_instance.instancefile_set.first()
        self.assertEqual(image.name, "1712326156339.webp")

    def test_success_when_user_is_none(self):
        self.api_import.user = None
        self.api_import.save()
        self.task.launcher = None
        self.task.save()

        self._create_zip_file()

        self.assertEqual(m.Entity.objects.count(), 0)
        self.assertEqual(m.Instance.objects.count(), 0)
        self.assertEqual(m.InstanceFile.objects.count(), 0)

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id,
            project_id=self.project.id,
            task=self.task,
            _immediate=True,
        )

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, m.SUCCESS)

        self.api_import.refresh_from_db()
        self.assertEqual(self.api_import.import_type, "bulk")
        self.assertFalse(self.api_import.has_problem)

        # Org unit was created
        ou = m.OrgUnit.objects.get(name="New Org Unit")
        self.assertIsNotNone(ou)
        self.assertEqual(ou.validation_status, m.OrgUnit.VALIDATION_NEW)

        # Instances (Submissions) + Entity were created
        self.assertEqual(m.Entity.objects.count(), 2)
        ent_disasi = m.Entity.objects.get(uuid=DISASI_MAKULO_REGISTRATION)
        entity_patrice = m.Entity.objects.get(uuid=PATRICE_AKAMBU_REGISTRATION)
        self.assertEqual(m.Instance.objects.count(), 4)
        self.assertEqual(m.InstanceFile.objects.count(), 2)

        # Entity 1: Disasi Makulo
        reg_instance = m.Instance.objects.get(uuid=DISASI_MAKULO_REGISTRATION)
        self.assertEqual(reg_instance.json.get("_full_name"), "Disasi Makulo")
        self.assertEqual(reg_instance.entity, ent_disasi)
        self.assertEqual(reg_instance.instancefile_set.count(), 0)

        catt_instance = m.Instance.objects.get(uuid=DISASI_MAKULO_CATT)
        self.assertEqual(catt_instance.json.get("result"), "positive")
        self.assertEqual(catt_instance.entity, ent_disasi)
        self.assertEqual(catt_instance.instancefile_set.count(), 1)
        image = catt_instance.instancefile_set.first()
        self.assertEqual(image.name, "1712326156339.webp")

        # Entity 2: Patrice Akambu
        reg_instance = m.Instance.objects.get(uuid=PATRICE_AKAMBU_REGISTRATION)
        self.assertEqual(reg_instance.json.get("_full_name"), "Patrice Akambu")
        self.assertEqual(reg_instance.entity, entity_patrice)
        self.assertEqual(reg_instance.instancefile_set.count(), 0)

        catt_instance = m.Instance.objects.get(uuid=PATRICE_AKAMBU_CATT)
        self.assertEqual(catt_instance.json.get("result"), "positive")
        self.assertEqual(catt_instance.entity, entity_patrice)
        self.assertEqual(catt_instance.instancefile_set.count(), 1)
        # image from Disasi's CATT was duplicated to this test
        image = catt_instance.instancefile_set.first()
        self.assertEqual(image.name, "1712326156339.webp")

    def test_success_when_user_is_none_and_task_is_not_immediate(self):
        self.api_import.user = None
        self.api_import.save()

        self.task.delete()

        self._create_zip_file()

        task = process_mobile_bulk_upload(
            api_import_id=self.api_import.id,
            project_id=self.project.id,
            _immediate=False,
        )

        self.assertEqual(m.Task.objects.filter(status="QUEUED").count(), 1)
        task_service = TestTaskService()
        task_service.run_all()
        self.assertEqual(m.Task.objects.filter(status="QUEUED").count(), 0)

        task.refresh_from_db()
        self.assertEqual(task.status, "SUCCESS")
        self.assertEqual(task.created_by, None)
        self.assertEqual(task.account, self.account)

    def test_fail_in_the_middle_of_import(self):
        # Org unit doesn't exist. The job will fail, then verify that
        # nothing was created.
        INCORRECT_FILES_FOR_ZIP = ["instances.json"]
        zip_path = f"/tmp/{CATT_TABLET_DIR}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(
                zipf,
                zip_fixture_dir(CATT_TABLET_DIR),
                INCORRECT_FILES_FOR_ZIP,
            )
        save_file_to_api_import(self.api_import, zip_path)

        self.assertEqual(m.Entity.objects.count(), 0)
        self.assertEqual(m.Instance.objects.count(), 0)

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id,
            project_id=self.project.id,
            task=self.task,
            _immediate=True,
        )

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, m.ERRORED)

        self.api_import.refresh_from_db()
        self.assertEqual(self.api_import.import_type, "bulk")
        self.assertTrue(self.api_import.has_problem)

        # Nothing was created
        self.assertFalse(m.OrgUnit.objects.filter(name="New Org Unit").exists())
        self.assertEqual(m.Entity.objects.count(), 0)
        self.assertEqual(m.Instance.objects.count(), 0)
        self.assertEqual(m.InstanceFile.objects.count(), 0)

    # SLEEP-1448: Update an existing registration form (with a different file path
    # on the already created instance)
    def test_reference_form_update(self):
        # Do an import with the CATT tablet first to already create Disasi Makulo

        self._create_zip_file()

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id,
            project_id=self.project.id,
            task=self.task,
            _immediate=True,
        )

        instance_disasi = m.Instance.objects.get(uuid=DISASI_MAKULO_REGISTRATION)
        instance_patrice = m.Instance.objects.get(uuid=PATRICE_AKAMBU_REGISTRATION)
        self.assertEqual(instance_disasi.source_updated_at.date().isoformat(), "2024-04-05")
        self.assertEqual(instance_disasi.json["is_confirmed_positive"], "0")
        self.assertEqual(instance_patrice.source_updated_at.date().isoformat(), "2024-04-05")
        self.assertEqual(instance_patrice.json["is_confirmed_positive"], "0")

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

        labo_zip_path = f"/tmp/{LABO_TABLET_DIR}.zip"
        with zipfile.ZipFile(labo_zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir(LABO_TABLET_DIR), CORRECT_FILES_FOR_ZIP)
        save_file_to_api_import(api_import, labo_zip_path)

        process_mobile_bulk_upload(
            api_import_id=api_import.id,
            project_id=self.project.id,
            task=task_2,
            _immediate=True,
        )

        # check Task status and result
        task_2.refresh_from_db()
        self.assertEqual(task_2.status, m.SUCCESS)

        self.assertEqual(APIImport.objects.count(), 2)
        api_import = APIImport.objects.last()
        self.assertEqual(api_import.import_type, "bulk")
        self.assertFalse(api_import.has_problem)

        # Verify that only Disasi was changed
        instance_disasi.refresh_from_db()
        instance_patrice.refresh_from_db()
        self.assertEqual(instance_disasi.source_updated_at.date().isoformat(), "2024-04-17")
        self.assertEqual(instance_disasi.json["is_confirmed_positive"], "1")
        self.assertEqual(instance_patrice.source_updated_at.date().isoformat(), "2024-04-05")
        self.assertEqual(instance_patrice.json["is_confirmed_positive"], "0")

        # Bug with extra .xml files of other form submissions being in the same
        # folder. Make sure they are not processed.
        self.assertEqual(instance_disasi.instancefile_set.count(), 0)

        # Verify we leave an audit trail of the update
        content_type = ContentType.objects.get_by_natural_key("iaso", "instance")
        modifications = Modification.objects.filter(
            object_id=instance_disasi.id,
            content_type=content_type,
        )
        self.assertEqual(len(modifications), 1)
        modif = modifications[0]
        self.assertEqual(modif.source, BULK_UPLOAD)
        self.assertEqual(modif.past_value[0]["fields"]["source_updated_at"].split("T")[0], "2024-04-05")
        self.assertEqual(modif.new_value[0]["fields"]["source_updated_at"].split("T")[0], "2024-04-17")

    def test_soft_deleted_entity(self):
        # Create soft-deleted entity Disasi with only registration form
        ent_disasi = create_entity_with_registration(
            self,
            name="Disasi",
            uuid=DISASI_MAKULO_REGISTRATION,
            deleted=True,
        )
        reg_disasi = ent_disasi.attributes

        self._create_zip_file()

        self.assertEqual(m.Entity.objects.count(), 0)
        self.assertEqual(m.Instance.objects.exclude(deleted=True).count(), 0)
        self.assertEqual(m.Instance.objects.filter(deleted=True).count(), 1)
        self.assertEqual(m.InstanceFile.objects.count(), 0)
        self.assertEqual(reg_disasi.source_updated_at.date().isoformat(), DEFAULT_CREATED_AT_STR)

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id,
            project_id=self.project.id,
            task=self.task,
            _immediate=True,
        )

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, m.SUCCESS)

        self.api_import.refresh_from_db()
        self.assertEqual(self.api_import.import_type, "bulk")
        self.assertFalse(self.api_import.has_problem)

        # Patrice entity was created, new CATT form is added as deleted to Disasi
        self.assertEqual(m.Entity.objects_only_deleted.count(), 1)
        self.assertEqual(m.Entity.objects.count(), 1)
        self.assertEqual(m.Instance.objects.exclude(deleted=True).count(), 2)
        self.assertEqual(m.Instance.objects.filter(deleted=True).count(), 2)
        self.assertEqual(m.InstanceFile.objects.count(), 2)

        # Entity 1: Disasi Makulo stays soft-deleted, registration is updated
        # and CATT form is added
        reg_disasi.refresh_from_db()
        self.assertEqual(reg_disasi.source_updated_at.date().isoformat(), "2024-04-05")
        catt_instance = m.Instance.objects.get(uuid=DISASI_MAKULO_CATT)
        self.assertTrue(catt_instance.deleted)

        # Entity 2: Patrice Akambu is created as before, make sure the image is
        # duplicated as should be
        catt_instance = m.Instance.objects.get(uuid=PATRICE_AKAMBU_CATT)
        image = catt_instance.instancefile_set.first()
        self.assertEqual(image.name, "1712326156339.webp")

    def test_merged_entity(self):
        # Setup: Create entity Disasi (with uuid as in bulk upload), along with a
        # duplicate, then merge them.
        ent_disasi_A = create_entity_with_registration(self, name="Disasi A", uuid=DISASI_MAKULO_REGISTRATION)
        ent_disasi_B = create_entity_with_registration(self, name="Disasi B", uuid=uuid.uuid4())

        ent_disasi_C = merge_entities(ent_disasi_A, ent_disasi_B, {}, self.user)
        ent_disasi_C.name = "Disasi C"
        ent_disasi_C.save()
        self.assertEqual(m.Instance.objects.count(), 3)

        # Only add data for Disasi to avoid confusion
        zip_path = f"/tmp/{DISASI_ONLY_TABLET_DIR}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir(DISASI_ONLY_TABLET_DIR), CORRECT_FILES_FOR_DISASI_ONLY_ZIP)
        save_file_to_api_import(self.api_import, zip_path)

        for ent in [ent_disasi_A, ent_disasi_B, ent_disasi_C]:
            self.assertEqual(ent.attributes.source_updated_at.date().isoformat(), DEFAULT_CREATED_AT_STR)

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id,
            project_id=self.project.id,
            task=self.task,
            _immediate=True,
        )

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, m.SUCCESS)
        self.api_import.refresh_from_db()
        self.assertEqual(self.api_import.import_type, "bulk")
        self.assertFalse(self.api_import.has_problem)

        # Disasi A and B have no changes
        # Disasi C has reg form updated + new CATT form (not deleted)
        self.assertEqual(m.Instance.objects.count(), 4)
        ent_disasi_A.refresh_from_db()
        ent_disasi_B.refresh_from_db()
        ent_disasi_C.refresh_from_db()

        self.assertEqual(ent_disasi_A.instances.count(), 1)
        self.assertEqual(ent_disasi_A.attributes.source_updated_at.date().isoformat(), "2024-04-05")

        self.assertEqual(ent_disasi_B.instances.count(), 1)
        self.assertEqual(ent_disasi_B.attributes.source_updated_at.date().isoformat(), DEFAULT_CREATED_AT_STR)

        self.assertEqual(ent_disasi_C.instances.count(), 2)
        reg_disasi_C = ent_disasi_C.attributes
        self.assertEqual(reg_disasi_C.source_updated_at.date().isoformat(), "2024-04-05")
        catt_disasi_C = ent_disasi_C.instances.get(form=self.form_catt)
        self.assertEqual(catt_disasi_C.uuid, DISASI_MAKULO_CATT)
        self.assertFalse(catt_disasi_C.deleted)

        # Verify we leave an audit trail of the update
        content_type = ContentType.objects.get_by_natural_key("iaso", "instance")
        modifications = Modification.objects.filter(
            object_id=reg_disasi_C.id,
            content_type=content_type,
        )
        self.assertEqual(len(modifications), 1)
        modif = modifications[0]
        self.assertEqual(modif.source, BULK_UPLOAD_MERGED_ENTITY)
        self.assertEqual(modif.past_value[0]["fields"]["source_updated_at"].split("T")[0], DEFAULT_CREATED_AT_STR)
        self.assertEqual(modif.new_value[0]["fields"]["source_updated_at"].split("T")[0], "2024-04-05")

    def test_double_merged_entity(self):
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

        self.assertEqual(m.Instance.objects.count(), 5)

        # Only add data for Disasi to avoid confusion
        zip_path = f"/tmp/{DISASI_ONLY_TABLET_DIR}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir(DISASI_ONLY_TABLET_DIR), CORRECT_FILES_FOR_DISASI_ONLY_ZIP)
        save_file_to_api_import(self.api_import, zip_path)

        all_entities = [ent_disasi_A, ent_disasi_B, ent_disasi_C, ent_disasi_merged_1, ent_disasi_merged_2]
        for ent in all_entities:
            self.assertEqual(ent.attributes.source_updated_at.date().isoformat(), DEFAULT_CREATED_AT_STR)

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id,
            project_id=self.project.id,
            task=self.task,
            _immediate=True,
        )

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, m.SUCCESS)
        self.api_import.refresh_from_db()
        self.assertEqual(self.api_import.import_type, "bulk")
        self.assertFalse(self.api_import.has_problem)

        # Disasi A, B, C and Merged 1 have no changes
        # Disasi Merged 2 has reg form updated + new CATT form (not deleted)
        self.assertEqual(m.Instance.objects.count(), 6)

        for ent in all_entities:
            ent.refresh_from_db()

        self.assertEqual(ent_disasi_A.instances.count(), 1)
        self.assertEqual(ent_disasi_A.attributes.source_updated_at.date().isoformat(), "2024-04-05")

        for ent in [ent_disasi_B, ent_disasi_C, ent_disasi_merged_1]:
            self.assertEqual(ent.instances.count(), 1)
            self.assertEqual(ent.attributes.source_updated_at.date().isoformat(), DEFAULT_CREATED_AT_STR)

        self.assertEqual(ent_disasi_merged_2.instances.count(), 2)
        reg_disasi_merged_2 = ent_disasi_merged_2.attributes
        self.assertEqual(reg_disasi_merged_2.source_updated_at.date().isoformat(), "2024-04-05")
        catt_disasi_merged_2 = ent_disasi_merged_2.instances.get(form=self.form_catt)
        self.assertEqual(catt_disasi_merged_2.uuid, DISASI_MAKULO_CATT)
        self.assertFalse(catt_disasi_merged_2.deleted)

        # Verify we leave an audit trail of the update
        content_type = ContentType.objects.get_by_natural_key("iaso", "instance")
        modifications = Modification.objects.filter(
            object_id=reg_disasi_merged_2.id,
            content_type=content_type,
        )
        self.assertEqual(len(modifications), 1)
        modif = modifications[0]
        self.assertEqual(modif.source, BULK_UPLOAD_MERGED_ENTITY)
        self.assertEqual(modif.past_value[0]["fields"]["source_updated_at"].split("T")[0], DEFAULT_CREATED_AT_STR)
        self.assertEqual(modif.new_value[0]["fields"]["source_updated_at"].split("T")[0], "2024-04-05")

    # WC2-580: Don't break on duplicate uuid if they're soft deleted
    # Scenarios:
    # - 1 active, 1 deleted -> take the active one
    # - 0 active, 1 delete -> covered by test_soft_deleted_entity
    # - 0 active, 2 deleted -> take the most "correc" deleted one
    # - More than 1 active, n deleted -> take an active one, log Sentry exception
    def test_duplicate_uuids_1_active_1_deleted(self):
        # Create active + soft-deleted entity Disasi with same uuid
        ent_active = create_entity_with_registration(self, name="Disasi Active", uuid=DISASI_MAKULO_REGISTRATION)
        # create it with a different uuid to avoid clash on instance uuid
        ent_deleted = create_entity_with_registration(self, name="Disasi Deleted", uuid=uuid.uuid4(), deleted=True)
        # then set it to same uuid as active entity
        ent_deleted.uuid = DISASI_MAKULO_REGISTRATION
        ent_deleted.save()

        # Only add data for Disasi to avoid confusion
        zip_path = f"/tmp/{DISASI_ONLY_TABLET_DIR}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir(DISASI_ONLY_TABLET_DIR), CORRECT_FILES_FOR_DISASI_ONLY_ZIP)
        save_file_to_api_import(self.api_import, zip_path)

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id, project_id=self.project.id, task=self.task, _immediate=True
        )

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, m.SUCCESS)
        self.api_import.refresh_from_db()
        self.assertFalse(self.api_import.has_problem)

        # Active entity was updated, deleted one stays the same
        self.assertEqual(ent_active.instances.count(), 2)
        self.assertEqual(ent_deleted.instances.count(), 1)

    def test_duplicate_uuids_0_active_2_deleted(self):
        # Create two soft-deleted entities Disasi with same uuid.
        # Make the 1st one the more "correct" one.
        ent1 = create_entity_with_registration(self, name="Disasi 1", uuid=DISASI_MAKULO_REGISTRATION, deleted=True)
        ent2 = create_entity_with_registration(self, name="Disasi 2", uuid=uuid.uuid4(), deleted=True)
        ent2.uuid = DISASI_MAKULO_REGISTRATION
        ent2.save()
        attrs = ent2.attributes
        attrs.file = ""
        attrs.save()

        # Only add data for Disasi to avoid confusion
        zip_path = f"/tmp/{DISASI_ONLY_TABLET_DIR}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir(DISASI_ONLY_TABLET_DIR), CORRECT_FILES_FOR_DISASI_ONLY_ZIP)
        save_file_to_api_import(self.api_import, zip_path)

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id, project_id=self.project.id, task=self.task, _immediate=True
        )

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, m.SUCCESS)
        self.api_import.refresh_from_db()
        self.assertFalse(self.api_import.has_problem)

        # New instance was added to the more correct, second entity
        self.assertEqual(ent1.instances.count(), 2)
        self.assertEqual(ent2.instances.count(), 1)

    @mock.patch("iaso.api.instances.instances.logger")
    def test_duplicate_uuids_multiple_active(self, mock_logger):
        # Create two active Disasi with same uuid
        ent1 = create_entity_with_registration(self, name="Disasi 1", uuid=DISASI_MAKULO_REGISTRATION)
        ent2 = create_entity_with_registration(self, name="Disasi 2", uuid=uuid.uuid4())
        ent2.uuid = DISASI_MAKULO_REGISTRATION
        ent2.save()

        # Only add data for Disasi to avoid confusion
        zip_path = f"/tmp/{DISASI_ONLY_TABLET_DIR}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir(DISASI_ONLY_TABLET_DIR), CORRECT_FILES_FOR_DISASI_ONLY_ZIP)
        save_file_to_api_import(self.api_import, zip_path)

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id, project_id=self.project.id, task=self.task, _immediate=True
        )

        # The job passes without error
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, m.SUCCESS)
        self.api_import.refresh_from_db()
        self.assertFalse(self.api_import.has_problem)

        # One of the 2 entities was updated, we get notified with a Sentry
        self.assertEqual(ent1.instances.count() + ent2.instances.count(), 3)
        err_msg = f"Multiple non-deleted entities for UUID {ent1.uuid}, entity_type_id {self.default_entity_type.id}"
        mock_logger.exception.assert_called_once_with(err_msg)

    def test_storage_logs(self):
        entity_uuid = "5475bfcf-5a3f-4170-9d88-245d89352362"
        files_for_zip = [
            "instances.json",
            "storageLogs.json",
            entity_uuid,  # the folder with XML submission
        ]
        zip_path = f"/tmp/{entity_uuid}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir("storage_logs"), files_for_zip)
        save_file_to_api_import(self.api_import, zip_path)

        self.assertEqual(m.Entity.objects.count(), 0)
        self.assertEqual(m.Instance.objects.count(), 0)
        self.assertEqual(m.StorageDevice.objects.count(), 0)
        self.assertEqual(m.StorageLogEntry.objects.count(), 0)

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id,
            project_id=self.project.id,
            task=self.task,
            _immediate=True,
        )

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, m.SUCCESS)
        self.api_import.refresh_from_db()
        self.assertEqual(self.api_import.import_type, "bulk")
        self.assertFalse(self.api_import.has_problem)

        # Instances (Submissions) + Entity were created
        self.assertEqual(m.Entity.objects.count(), 1)
        entity = m.Entity.objects.get(uuid=entity_uuid)
        self.assertEqual(m.Instance.objects.count(), 1)
        instance = m.Instance.objects.get(uuid=entity_uuid)

        # Storage logs
        self.assertEqual(m.StorageDevice.objects.count(), 1)
        self.assertEqual(m.StorageLogEntry.objects.count(), 2)
        storage_device = m.StorageDevice.objects.first()
        self.assertEqual(storage_device.type, "NFC")
        self.assertEqual(storage_device.org_unit_id, 1)
        self.assertEqual(storage_device.entity, entity)

        reset_log = m.StorageLogEntry.objects.get(operation_type="RESET")
        self.assertEqual(reset_log.org_unit_id, 1)
        self.assertIsNone(reset_log.entity)

        write_log = m.StorageLogEntry.objects.get(operation_type="WRITE_PROFILE")
        self.assertEqual(write_log.org_unit_id, 1)
        self.assertEqual(write_log.entity, entity)
        self.assertEqual(list(write_log.instances.all()), [instance])

    def test_change_requests(self):
        zip_path = "/tmp/change_request.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            add_to_zip(zipf, zip_fixture_dir(), ["changeRequests.json"])
        save_file_to_api_import(self.api_import, zip_path)

        self.assertEqual(m.OrgUnitChangeRequest.objects.count(), 0)

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id,
            project_id=self.project.id,
            task=self.task,
            _immediate=True,
        )

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, m.SUCCESS)
        self.api_import.refresh_from_db()
        self.assertEqual(self.api_import.import_type, "bulk")
        self.assertFalse(self.api_import.has_problem)

        self.assertEqual(m.OrgUnitChangeRequest.objects.count(), 1)
        ou_change_req = m.OrgUnitChangeRequest.objects.first()
        self.assertEqual(ou_change_req.old_name, "LaLaland")
        self.assertEqual(ou_change_req.new_name, "LaLaland Edited")
        self.assertEqual(ou_change_req.org_unit_id, 1)
        self.assertEqual(ou_change_req.created_by, self.user)

    def test_instance_without_entity_creation(self):
        zip_path = "/tmp/instance_without_entity.zip"

        # Create instances.json without entity references
        instance_timestamp = datetime.datetime(2024, 4, 5, 14, 9, 10, tzinfo=pytz.UTC)
        instances_data = [
            {
                "id": "standalone-instance-uuid-1234",
                "created_at": int(instance_timestamp.timestamp() * 1000),
                "updated_at": int(instance_timestamp.timestamp() * 1000),
                "file": "/storage/test/standalone_instance.xml",
                "name": "Enregistrement",
                "formId": "1",
                "orgUnitId": "1",
            }
        ]

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            zipf.writestr("instances.json", json.dumps(instances_data))

            with open("iaso/fixtures/instance_form_1_1.xml", "rb") as xml_file:
                zipf.writestr("standalone-instance-uuid-1234/standalone_instance.xml", xml_file.read())

        save_file_to_api_import(self.api_import, zip_path)

        self.assertEqual(m.Entity.objects.count(), 0)
        self.assertEqual(m.Instance.objects.count(), 0)

        process_mobile_bulk_upload(
            api_import_id=self.api_import.id,
            project_id=self.project.id,
            task=self.task,
            _immediate=True,
        )

        # check Task status and result
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, m.SUCCESS)

        self.api_import.refresh_from_db()
        self.assertEqual(self.api_import.import_type, "bulk")
        self.assertFalse(self.api_import.has_problem)

        # No entities should be created since no entityUuid/entityTypeId provided
        self.assertEqual(m.Entity.objects.count(), 0)

        # But instance should be created without entity reference
        self.assertEqual(m.Instance.objects.count(), 1)
        instance = m.Instance.objects.first()
        self.assertEqual(instance.uuid, "standalone-instance-uuid-1234")
        self.assertIsNone(instance.entity)

    def test_instance_without_entity_update_scenario(self):
        zip_path = "/tmp/instance_without_entity_update.zip"

        # First create an instance without entity in the database directly
        with open("iaso/fixtures/instance_form_1_1.xml", "rb") as form_instance_file:
            instance = m.Instance.objects.create(
                uuid="no-entity-instance-uuid",
                entity=None,  # No entity reference
                form=self.form_registration,
                file=File(form_instance_file),
                json={"some": "data"},
                source_created_at=DEFAULT_CREATED_AT,
                source_updated_at=DEFAULT_CREATED_AT,
            )

        self.assertEqual(m.Instance.objects.count(), 1)
        self.assertIsNone(instance.entity)

        # Now create a bulk upload that tries to update this instance
        # initial_timestamp = datetime.datetime(2024, 4, 5, 14, 9, 10, tzinfo=pytz.UTC)
        updated_timestamp = datetime.datetime(2024, 4, 5, 14, 9, 20, tzinfo=pytz.UTC)
        updated_instances_data = [
            {
                "id": "no-entity-instance-uuid",
                "created_at": int(DEFAULT_CREATED_AT.timestamp() * 1000),
                "updated_at": int(updated_timestamp.timestamp() * 1000),  # Newer timestamp to trigger update
                "file": "/storage/test/no_entity_instance_updated.xml",
                "name": "Enregistrement",
                "formId": "1",
                "orgUnitId": "1",
            }
        ]

        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            zipf.writestr("instances.json", json.dumps(updated_instances_data))
            with open("iaso/fixtures/instance_form_1_1.xml", "rb") as xml_file:
                zipf.writestr("no-entity-instance-uuid/no_entity_instance_updated.xml", xml_file.read())

        save_file_to_api_import(self.api_import, zip_path)

        # This should work without AttributeError after our fix
        process_mobile_bulk_upload(
            api_import_id=self.api_import.id,
            project_id=self.project.id,
            task=self.task,
            _immediate=True,
        )

        # Verify the task succeeded
        self.task.refresh_from_db()
        self.assertEqual(self.task.status, m.SUCCESS)

        # Still only one instance, but it should be updated
        self.assertEqual(m.Instance.objects.count(), 1)
        instance.refresh_from_db()
        self.assertIsNone(instance.entity)  # Still no entity

        # Verify the instance was actually updated with the newer timestamp
        self.assertEqual(instance.source_updated_at, updated_timestamp)
        self.assertEqual(instance.last_modified_by, self.user)
