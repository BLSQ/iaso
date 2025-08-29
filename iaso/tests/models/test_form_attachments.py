from django.core.files.uploadedfile import UploadedFile

from iaso.models import Form, FormAttachment
from iaso.test import FileUploadToTestCase


class FormAttachmentTestCase(FileUploadToTestCase):
    def setUp(self):
        super().setUp()
        self.form_1 = Form.objects.create(name="Form 1")
        self.project_1.forms.set([self.form_1])

        self.form_2 = Form.objects.create(name="Form-2***///")
        self.project_2.forms.set([self.form_2])

    def test_upload_to_happy_path(self):
        # Upload with a user that belongs to a (correctly named) account
        with open("iaso/tests/fixtures/clamav/safe.jpg", "rb") as jpg_file:
            form_attachment = FormAttachment.objects.create(
                file=UploadedFile(jpg_file),
                name="test file",
                form=self.form_1,
            )

        expected_file_name = (
            f"{self.account_1.short_sanitized_name}_{self.account_1.id}/form_attachments/form_1/safe.jpg"
        )
        self.assertEqual(form_attachment.file.name, expected_file_name)

    def test_upload_to_no_account(self):
        # Removing links to projects to simulate a form without account
        self.project_1.forms.set([])

        with open("iaso/tests/fixtures/clamav/safe.jpg", "rb") as jpg_file:
            form_attachment = FormAttachment.objects.create(
                file=UploadedFile(jpg_file),
                name="test file",
                form=self.form_1,
            )

        expected_file_name = "unknown_account/form_attachments/form_1/safe.jpg"
        self.assertEqual(form_attachment.file.name, expected_file_name)

    def test_upload_to_invalid_account_name(self):
        with open("iaso/tests/fixtures/clamav/safe.jpg", "rb") as jpg_file:
            form_attachment = FormAttachment.objects.create(
                file=UploadedFile(jpg_file),
                name="test file",
                form=self.form_2,
            )

        expected_file_name = f"invalid_name_{self.account_2.id}/form_attachments/form_2/safe.jpg"
        self.assertEqual(form_attachment.file.name, expected_file_name)
