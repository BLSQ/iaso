from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase

from iaso.utils.encryption import calculate_md5, file_content_changed


class EncryptionTestCase(SimpleTestCase):
    def test_calculate_md5(self):
        content = b"Some file content"
        zip_file = SimpleUploadedFile("file.zip", content)
        expected_md5 = "92bbcf620ceb5f5bf38f08e9a1f31e7b"
        md5 = calculate_md5(zip_file)
        self.assertEqual(md5, expected_md5)

    def test_file_content_changed_empty_md5(self):
        new_file = SimpleUploadedFile("file.zip", b"Some file content")
        self.assertTrue(file_content_changed("", new_file))
        self.assertTrue(file_content_changed(None, new_file))

    def test_file_content_changed_same_content(self):
        content = b"Some file content"
        md5 = calculate_md5(SimpleUploadedFile("file.zip", content))
        new_file = SimpleUploadedFile("renamed.zip", content)
        self.assertFalse(file_content_changed(md5, new_file))

    def test_file_content_changed_different_content(self):
        old_md5 = calculate_md5(SimpleUploadedFile("file.zip", b"Some file content"))
        new_file = SimpleUploadedFile("file.zip", b"Different content!!")
        self.assertTrue(file_content_changed(old_md5, new_file))
