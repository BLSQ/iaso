import hashlib

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase

from iaso.utils.encryption import calculate_md5


class EncryptionTestCase(SimpleTestCase):
    def test_calculate_md5(self):
        content = b"Some file content"
        zip_file = SimpleUploadedFile("file.zip", content)
        expected_md5 = hashlib.md5(content).hexdigest()
        md5 = calculate_md5(zip_file)
        self.assertEqual(md5, expected_md5)
