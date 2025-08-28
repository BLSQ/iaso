from django.contrib.auth.models import User
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile

from iaso.models import Form, FormVersion
from iaso.test import IasoTestCaseMixin, TestCase


class FormVersionTestCase(TestCase, IasoTestCaseMixin):
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

        self.user_1 = self.create_user_with_profile(account=self.account_1, username="user 1")
        self.user_2 = self.create_user_with_profile(account=self.account_2, username="user 2")
        self.user_no_profile = User.objects.create(username="user no profile", first_name="User", last_name="NoProfile")

        self.form_1 = Form.objects.create(name="Form 1")
        self.project_1.forms.set([self.form_1])

        self.form_2 = Form.objects.create(name="Form-2***///")
        self.project_2.forms.set([self.form_2])

        # Removing all InMemoryFileNodes inside the storage to avoid name conflicts - some can be kept by previous test classes
        default_storage._root._children.clear()  # see InMemoryFileStorage in django/core/files/storage/memory.py
        super().setUp()

    def test_upload_to_happy_path(self):
        # Upload with a user that belongs to a (correctly named) account
        version_id = "20250828"
        with open("iaso/tests/fixtures/edit_existing_submission.xml", "rb") as xml_file:
            with open("iaso/tests/fixtures/edit_existing_submission_xlsform.xlsx", "rb") as xlsx_file:
                form_version = FormVersion.objects.create(
                    form=self.form_1,
                    created_by=self.user_1,
                    version_id=version_id,
                    file=UploadedFile(xml_file),
                    xls_file=UploadedFile(xlsx_file),
                )

        expected_xml_file_name = (
            f"{self.account_1.short_sanitized_name}_{self.account_1.id}/form_versions/form_1_{version_id}.xml"
        )
        self.assertEqual(form_version.file.name, expected_xml_file_name)
        expected_xls_file_name = (
            f"{self.account_1.short_sanitized_name}_{self.account_1.id}/form_versions/form_1_{version_id}.xlsx"
        )
        self.assertEqual(form_version.xls_file.name, expected_xls_file_name)

    def test_upload_to_no_account(self):
        version_id = "20250828"
        with open("iaso/tests/fixtures/edit_existing_submission.xml", "rb") as xml_file:
            with open("iaso/tests/fixtures/edit_existing_submission_xlsform.xlsx", "rb") as xlsx_file:
                form_version = FormVersion.objects.create(
                    form=self.form_1,
                    version_id=version_id,  # no created_by
                    file=UploadedFile(xml_file),
                    xls_file=UploadedFile(xlsx_file),
                )

        expected_xml_file_name = f"unknown_account/form_versions/form_1_{version_id}.xml"
        self.assertEqual(form_version.file.name, expected_xml_file_name)
        expected_xls_file_name = f"unknown_account/form_versions/form_1_{version_id}.xlsx"
        self.assertEqual(form_version.xls_file.name, expected_xls_file_name)

    def test_upload_to_invalid_account_name(self):
        version_id = "20250828"
        with open("iaso/tests/fixtures/edit_existing_submission.xml", "rb") as xml_file:
            with open("iaso/tests/fixtures/edit_existing_submission_xlsform.xlsx", "rb") as xlsx_file:
                form_version = FormVersion.objects.create(
                    form=self.form_2,
                    created_by=self.user_2,
                    version_id=version_id,
                    file=UploadedFile(xml_file),
                    xls_file=UploadedFile(xlsx_file),
                )

        expected_xml_file_name = f"invalid_name_{self.account_2.id}/form_versions/form_2_{version_id}.xml"
        self.assertEqual(form_version.file.name, expected_xml_file_name)
        expected_xls_file_name = f"invalid_name_{self.account_2.id}/form_versions/form_2_{version_id}.xlsx"
        self.assertEqual(form_version.xls_file.name, expected_xls_file_name)

    def test_upload_to_user_no_profile(self):
        version_id = "20250828"
        with open("iaso/tests/fixtures/edit_existing_submission.xml", "rb") as xml_file:
            with open("iaso/tests/fixtures/edit_existing_submission_xlsform.xlsx", "rb") as xlsx_file:
                form_version = FormVersion.objects.create(
                    form=self.form_1,
                    created_by=self.user_no_profile,
                    version_id=version_id,
                    file=UploadedFile(xml_file),
                    xls_file=UploadedFile(xlsx_file),
                )

        expected_xml_file_name = f"unknown_account/form_versions/form_1_{version_id}.xml"
        self.assertEqual(form_version.file.name, expected_xml_file_name)
        expected_xls_file_name = f"unknown_account/form_versions/form_1_{version_id}.xlsx"
        self.assertEqual(form_version.xls_file.name, expected_xls_file_name)
