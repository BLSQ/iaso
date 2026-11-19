import base64
import io

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase

from iaso.utils.encryption import PasswordCipher, StreamingEncryptionWriter, calculate_md5, file_content_changed


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


class StreamingEncryptionWriterTestCase(SimpleTestCase):
    # Sample data encrypted with a version of the code confirmed to work with the mobile app.
    ENCRYPTED_PAYLOAD = base64.b64decode(
        "coMxltwiMLLbXfZt67i5gBOLgJz+QsolCai9HhIwwltqgmvXabJF8qUgt1Z9siud"
        "3aKq06VO2uUyOE3zJLA/QtER0mZuw/H5CbUCELy5o6qv9HuILuCbj9UfX8ja8L7P"
    )

    def encrypt(self, data: bytes, chunk_size: int) -> bytes:
        output = io.BytesIO()
        with StreamingEncryptionWriter(output, "secret") as writer:
            for start in range(0, len(data), chunk_size):
                writer.write(data[start : start + chunk_size])
        return output.getvalue()

    def test_decrypts_the_format_used_by_the_mobile_app(self):
        decrypted = PasswordCipher.decrypt(self.ENCRYPTED_PAYLOAD, "secret")

        self.assertEqual(decrypted, b"Hello from the mobile app setup export")

    def test_wrong_password(self):
        with self.assertRaises(ValueError):
            PasswordCipher.decrypt(self.ENCRYPTED_PAYLOAD, "wrong")

    def test_round_trip(self):
        # Test with misc. chunk sizes that don't always line up with the AES block size to test padding logic
        for size in [0, 15, 16, 17, 1000]:
            for chunk_size in [1, 7, 1024]:
                with self.subTest(size=size, chunk_size=chunk_size):
                    data = bytes(i % 251 for i in range(size))

                    encrypted = self.encrypt(data, chunk_size)

                    self.assertEqual(PasswordCipher.decrypt(encrypted, "secret"), data)

    def test_leaves_the_output_open(self):
        output = io.BytesIO()
        writer = StreamingEncryptionWriter(output, "secret")
        writer.write(b"data")
        writer.close()
        writer.close()  # Check that closing twice doesn't write the last block twice.

        self.assertFalse(output.closed)
        self.assertEqual(PasswordCipher.decrypt(output.getvalue(), "secret"), b"data")
        with self.assertRaises(ValueError):
            writer.write(b"more")
