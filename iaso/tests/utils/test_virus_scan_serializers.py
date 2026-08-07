from unittest.mock import MagicMock, patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import models

from iaso.test import TestCase
from iaso.utils.encryption import calculate_md5
from iaso.utils.virus_scan.model import ModelWithFile, VirusScanStatus
from iaso.utils.virus_scan.serializers import ModelWithFileSerializer


class DummyModel(ModelWithFile):
    int_value = models.IntegerField(blank=True, null=True)


class DummyModelSerializer(ModelWithFileSerializer):
    class Meta:
        model = DummyModel
        fields = ["file", "int_value"]


class ModelWithFileSerializerScanTestCase(TestCase):
    def setUp(self):
        self.serializer = DummyModelSerializer()

    def test_create_always_needs_scanning(self):
        file = SimpleUploadedFile("doc.pdf", b"content")
        self.assertTrue(self.serializer._check_if_file_exists_and_needs_scanning({"file": file}, obj=None))

    def test_update_needs_scanning_when_md5_empty(self):
        file = SimpleUploadedFile("doc.pdf", b"content")
        obj = MagicMock(spec=DummyModel)
        obj.file = SimpleUploadedFile("doc.pdf", b"content")
        obj.md5 = ""
        self.assertTrue(self.serializer._check_if_file_exists_and_needs_scanning({"file": file}, obj=obj))

    def test_update_skips_scanning_when_md5_matches(self):
        content = b"same content"
        file = SimpleUploadedFile("doc.pdf", content)
        obj = MagicMock(spec=DummyModel)
        obj.file = SimpleUploadedFile("old.pdf", content)
        obj.md5 = calculate_md5(SimpleUploadedFile("x.pdf", content))
        self.assertFalse(self.serializer._check_if_file_exists_and_needs_scanning({"file": file}, obj=obj))

    def test_update_needs_scanning_when_md5_differs(self):
        file = SimpleUploadedFile("doc.pdf", b"new content")
        obj = MagicMock(spec=DummyModel)
        obj.file = SimpleUploadedFile("doc.pdf", b"old content")
        obj.md5 = calculate_md5(SimpleUploadedFile("x.pdf", b"old content"))
        self.assertTrue(self.serializer._check_if_file_exists_and_needs_scanning({"file": file}, obj=obj))

    def test_update_needs_scanning_when_no_previous_file(self):
        file = SimpleUploadedFile("doc.pdf", b"content")
        obj = MagicMock(spec=DummyModel)
        obj.file = None
        obj.md5 = ""
        self.assertTrue(self.serializer._check_if_file_exists_and_needs_scanning({"file": file}, obj=obj))

    @patch("iaso.utils.virus_scan.serializers.scan_uploaded_file_for_virus")
    def test_scan_file_if_exists_sets_md5(self, mock_scan):
        mock_scan.return_value = (VirusScanStatus.CLEAN, None)
        file = SimpleUploadedFile("doc.pdf", b"content")
        validated_data = {"file": file}

        scanned = self.serializer.scan_file_if_exists(validated_data)

        self.assertTrue(scanned)
        self.assertEqual(validated_data["md5"], calculate_md5(SimpleUploadedFile("doc.pdf", b"content")))
        self.assertEqual(validated_data["file_scan_status"], VirusScanStatus.CLEAN)

    @patch("iaso.utils.virus_scan.serializers.scan_uploaded_file_for_virus")
    def test_scan_file_if_exists_sets_md5_on_update(self, mock_scan):
        mock_scan.return_value = (VirusScanStatus.CLEAN, None)
        file = SimpleUploadedFile("doc.pdf", b"new content")
        obj = MagicMock(spec=DummyModel)
        obj.file = SimpleUploadedFile("doc.pdf", b"old content")
        obj.md5 = calculate_md5(SimpleUploadedFile("x.pdf", b"old content"))
        validated_data = {"file": file}

        scanned = self.serializer.scan_file_if_exists(validated_data, obj=obj)

        self.assertTrue(scanned)
        self.assertEqual(validated_data["md5"], calculate_md5(SimpleUploadedFile("doc.pdf", b"new content")))
        self.assertEqual(validated_data["file_scan_status"], VirusScanStatus.CLEAN)

    def test_scan_file_if_exists_removing_file_resets_scan_fields(self):
        obj = MagicMock(spec=DummyModel)
        obj.file = SimpleUploadedFile("doc.pdf", b"content")
        obj.md5 = calculate_md5(SimpleUploadedFile("x.pdf", b"content"))
        validated_data = {"file": None}

        scanned = self.serializer.scan_file_if_exists(validated_data, obj=obj)

        self.assertFalse(scanned)
        self.assertEqual(validated_data["md5"], "")
        self.assertEqual(validated_data["file_scan_status"], VirusScanStatus.PENDING)
        self.assertIsNone(validated_data["file_last_scan"])

    def test_scan_file_if_exists_removing_file_with_no_previous_file_does_not_touch_scan_fields(self):
        obj = MagicMock(spec=DummyModel)
        obj.file = None
        obj.md5 = ""
        validated_data = {"file": None}

        scanned = self.serializer.scan_file_if_exists(validated_data, obj=obj)

        self.assertFalse(scanned)
        self.assertNotIn("md5", validated_data)
        self.assertNotIn("file_scan_status", validated_data)
        self.assertNotIn("file_last_scan", validated_data)
