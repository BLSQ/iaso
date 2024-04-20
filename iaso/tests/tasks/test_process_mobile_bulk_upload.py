import shutil

from django.contrib.auth.models import User
from django.test import TestCase
from unittest import mock

from hat.api_import.models import APIImport
from iaso import models as m
from iaso.tasks.process_mobile_bulk_upload import process_mobile_bulk_upload


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
        self.form_registration = m.Form.objects.create(
            id=1,
            name="Enregistrement",
            period_type=m.MONTH,
            single_per_period=False,
        )
        self.form_catt = m.Form.objects.create(
            id=2,
            name="Enregistrement",
            period_type=m.MONTH,
            single_per_period=False,
        )

        self.entity_type = m.EntityType.objects.create(
            id=1,
            name="Participant",
            reference_form=self.form_registration,
        )

        # Create the zip file: we create it on the fly to be able to clearly
        # see the contents in our repo. We then mock the file download method
        # to return the filepath to this zip.
        print(
            shutil.make_archive(
                "/tmp/one_test_with_image",
                "zip",
                root_dir="iaso/tests/fixtures/mobile_bulk_uploads/one_test_with_image_zip",
            )
        )

    @mock.patch("iaso.tasks.process_mobile_bulk_upload.download_file")
    def test_process_one_entity_with_image(self, mock_download_file):
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
        self.assertEquals(m.Entity.objects.count(), 1)
        entity = m.Entity.objects.first()
        self.assertEquals(m.Instance.objects.count(), 2)

        reg_instance = m.Instance.objects.get(name="Enregistrement")
        self.assertEquals(reg_instance.json.get("_full_name"), "Disasi Makulo")
        self.assertEquals(reg_instance.entity, entity)
        self.assertEquals(reg_instance.instancefile_set.count(), 0)

        catt_instance = m.Instance.objects.get(name="CATT")
        self.assertEquals(catt_instance.json.get("result"), "positive")
        self.assertEquals(catt_instance.entity, entity)
        self.assertEquals(catt_instance.instancefile_set.count(), 1)
        image = catt_instance.instancefile_set.first()
        self.assertEquals(image.name, "1712326156339.webp")

    # TODO: test with series and only 1 image, test with error in the middle of import
