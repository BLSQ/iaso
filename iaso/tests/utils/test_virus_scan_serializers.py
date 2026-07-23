from unittest.mock import MagicMock, patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase

from iaso.utils.encryption import calculate_md5
from iaso.utils.virus_scan.model import ModelWithFile, VirusScanStatus
from plugins.polio.api.vaccines.stock_management.destructions.serializers import DestructionReportSerializer


class ModelWithFileSerializerScanTestCase(SimpleTestCase):
    def setUp(self):
        self.serializer = DestructionReportSerializer()

    def test_create_always_needs_scanning(self):
        file = SimpleUploadedFile("doc.pdf", b"content")
        self.assertTrue(self.serializer._check_if_file_exists_and_needs_scanning({"file": file}, obj=None))

    def test_update_needs_scanning_when_md5_empty(self):
        file = SimpleUploadedFile("doc.pdf", b"content")
        obj = MagicMock(spec=ModelWithFile)
        obj.file = SimpleUploadedFile("doc.pdf", b"content")
        obj.md5 = ""
        self.assertTrue(self.serializer._check_if_file_exists_and_needs_scanning({"file": file}, obj=obj))

    def test_update_skips_scanning_when_md5_matches(self):
        content = b"same content"
        file = SimpleUploadedFile("doc.pdf", content)
        obj = MagicMock(spec=ModelWithFile)
        obj.file = SimpleUploadedFile("old.pdf", content)
        obj.md5 = calculate_md5(SimpleUploadedFile("x.pdf", content))
        self.assertFalse(self.serializer._check_if_file_exists_and_needs_scanning({"file": file}, obj=obj))

    def test_update_needs_scanning_when_md5_differs(self):
        file = SimpleUploadedFile("doc.pdf", b"new content")
        obj = MagicMock(spec=ModelWithFile)
        obj.file = SimpleUploadedFile("doc.pdf", b"old content")
        obj.md5 = calculate_md5(SimpleUploadedFile("x.pdf", b"old content"))
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
