from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase

from iaso.utils.encryption import calculate_md5


class EncryptionTestCase(SimpleTestCase):
    def test_calculate_md5(self):
        zip_file = SimpleUploadedFile("file.zip", b"Some file content")
        md5 = calculate_md5(zip_file)
        expected_md5 = "92bbcf620ceb5f5bf38f08e9a1f31e7b"
        self.assertEqual(md5, expected_md5)
