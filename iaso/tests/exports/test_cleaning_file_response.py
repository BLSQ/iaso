import os
import tempfile

from django.test import SimpleTestCase

from iaso.exports import CleaningFileResponse


class CleaningFileResponseTestCase(SimpleTestCase):
    def create_file(self, content: bytes) -> str:
        tmp = tempfile.NamedTemporaryFile(suffix=".csv", delete=False)
        tmp.write(content)
        tmp.close()
        self.addCleanup(lambda: os.path.exists(tmp.name) and os.remove(tmp.name))
        return tmp.name

    def test_file_removed_once_served(self):
        path = self.create_file(b"id\n1\n")
        response = CleaningFileResponse(path, as_attachment=True, filename="export.csv")

        self.assertEqual(b"".join(response.streaming_content), b"id\n1\n")
        self.assertTrue(os.path.exists(path), "the file must be kept while it is being served")
        response.close()

        self.assertFalse(os.path.exists(path), "the temporary export file must be removed once the response is closed")

    def test_close_when_file_already_removed(self):
        path = self.create_file(b"id\n")
        response = CleaningFileResponse(path)
        os.remove(path)

        response.close()  # no FileNotFoundError

        self.assertFalse(os.path.exists(path))
