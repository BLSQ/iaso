import os
from unittest import skipUnless

import magic

from django.core.exceptions import ValidationError
from django.core.files import File
from django.core.files.uploadedfile import SimpleUploadedFile

from iaso.api.common.validators import FileTypeValidator
from iaso.test import TestCase

BULK_CREATE_ALLOWED_MIMETYPES = [
    "text/csv",
    "text/plain",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

XLSX_FIXTURE = os.path.join(
    "iaso",
    "tests",
    "fixtures",
    "form_rapide_1666691000.xlsx",
)
CSV_FIXTURE = os.path.join(
    "iaso",
    "tests",
    "fixtures",
    "bulk_create_users",
    "test_user_bulk_create_valid.csv",
)


def libmagic_available():
    try:
        magic.from_buffer(b"test", mime=True)
        return True
    except Exception:
        return False


@skipUnless(libmagic_available(), "libmagic is not available")
class FileTypeValidatorTestCase(TestCase):
    def setUp(self):
        self.validator = FileTypeValidator(allowed_mimetypes=BULK_CREATE_ALLOWED_MIMETYPES)

    def test_accepts_bulk_create_csv_fixture(self):
        with open(CSV_FIXTURE, "rb") as file_handle:
            self.validator(File(file_handle, name="users.csv"))

    def test_accepts_bulk_create_xlsx_fixture_from_disk(self):
        with open(XLSX_FIXTURE, "rb") as file_handle:
            self.validator(File(file_handle, name="users.xlsx"))

    def test_accepts_bulk_create_xlsx_fixture_in_memory(self):
        with open(XLSX_FIXTURE, "rb") as file_handle:
            file_content = file_handle.read()

        uploaded_file = SimpleUploadedFile("users.xlsx", file_content, content_type="application/octet-stream")
        self.validator(uploaded_file)

    def test_rejects_unsupported_mime_type(self):
        with self.assertRaises(ValidationError) as error:
            self.validator(SimpleUploadedFile("users.pdf", b"not a spreadsheet or csv", content_type="application/pdf"))

        self.assertEqual(error.exception.code, "invalid_file_type")

    def test_rejects_ambiguous_mime_with_unrelated_extension(self):
        with open(XLSX_FIXTURE, "rb") as file_handle:
            file_content = file_handle.read()

        with self.assertRaises(ValidationError):
            self.validator(SimpleUploadedFile("users.pdf", file_content, content_type="application/octet-stream"))
