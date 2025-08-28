from django.contrib.auth.models import User
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile

from iaso.models import Form, FormAttachment
from iaso.test import TestCase, IasoTestCaseMixin


class FormAttachmentTestCase(TestCase, IasoTestCaseMixin):
    def setUp(self):
        # Preparing test data
        account_1_name = "test account 1"
        self.account_1, self.data_source_1, self.version_1, self.project_1 = (
            self.create_account_datasource_version_project("source 1", account_1_name, "project 1")
        )
        account_2_name = "***///"
        self.account_2, self.data_source_2, self.version_2, self.project_2 = (
            self.create_account_datasource_version_project("source 2", account_2_name, "project 2")
        )

        self.form_1 = Form.objects.create(name="Form 1")
        self.project_1.forms.set([self.form_1])

        self.form_2 = Form.objects.create(name="Form-2***///")
        self.project_2.forms.set([self.form_2])

        # Removing all InMemoryFileNodes inside the storage to avoid name conflicts - some can be kept by previous test classes
        default_storage._root._children.clear()  # see InMemoryFileStorage in django/core/files/storage/memory.py
        super().setUp()

    def test_upload_to_happy_path(self):
        # Upload with a user that belongs to a (correctly named) account
        with open("iaso/tests/fixtures/clamav/safe.jpg", "rb") as jpg_file:
            form_attachment = FormAttachment.objects.create(
                file=UploadedFile(jpg_file),
                name="test file",
                form=self.form_1,
            )

        expected_file_name = f"{self.account_1.short_sanitized_name}_{self.account_1.id}/form_attachments/form_1/safe.jpg"
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

        expected_file_name = f"unknown_account/form_attachments/form_1/safe.jpg"
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
