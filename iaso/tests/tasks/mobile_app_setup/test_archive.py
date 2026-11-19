import io
import json
import zipfile

from django.test import SimpleTestCase

from iaso.tasks.mobile_app_setup.archive import ZipArchive


class ZipArchiveTest(SimpleTestCase):
    def test_round_trip(self):
        payload = {"name": "Kinshasa – Gombé", "ids": [1, 2]}
        content = bytes(range(256))  # binary content, written as is
        buffer = io.BytesIO()
        with ZipArchive(buffer) as archive:
            archive.write_json("a.json", payload)
            archive.write_bytes("b.bin", content)

        zip_file = zipfile.ZipFile(buffer)
        written = zip_file.read("a.json")
        self.assertEqual(json.loads(written), payload)
        # ASCII JSON with default separators
        self.assertEqual(written, json.dumps(payload).encode())
        self.assertEqual(written, b'{"name": "Kinshasa \\u2013 Gomb\\u00e9", "ids": [1, 2]}')
        self.assertEqual(zip_file.read("b.bin"), content)

    def test_entries_are_compressed(self):
        buffer = io.BytesIO()
        with ZipArchive(buffer) as archive:
            archive.write_json("a.json", {"a": 1})
            archive.write_bytes("b.bin", b"b")

        infos = zipfile.ZipFile(buffer).infolist()
        self.assertEqual([info.compress_type for info in infos], [zipfile.ZIP_DEFLATED] * 2)
