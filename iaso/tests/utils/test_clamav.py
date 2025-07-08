import datetime
import os.path

from unittest.mock import MagicMock, patch

import time_machine

from django.core.files.uploadedfile import InMemoryUploadedFile
from django.test import override_settings

from hat import settings
from iaso.test import TestCase
from iaso.utils.virus_scan.clamav import VirusScanStatus, scan_disk_file_for_virus, scan_uploaded_file_for_virus


@override_settings(
    CLAMAV_ACTIVE=True,
    CLAMAV_CONFIGURATION={
        **settings.CLAMAV_CONFIGURATION,
        "address": "hey.this-is-likely-not-a-valid-clamav-server.com:3310",
        "timeout": 2,
    },
)
class ClamAVTestCase(TestCase):
    SAFE_FILE_PATH = "iaso/tests/fixtures/clamav/safe.jpg"
    EICAR_FILE_PATH = "iaso/tests/fixtures/clamav/eicar.txt"
    DT = datetime.datetime(2024, 10, 9, 16, 45, 27, tzinfo=datetime.timezone.utc)

    @time_machine.travel(DT, tick=False)
    @patch("clamav_client.get_scanner")
    def test_negative_uploaded_file(self, mock_get_scanner):
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockResults(
            state="OK",
            details="",
            passed=True,
        )
        mock_get_scanner.return_value = mock_scanner

        with open(self.SAFE_FILE_PATH, "rb") as file:
            uploaded_file = InMemoryUploadedFile(
                file=file,
                field_name="file",
                name="safe.jpg",
                content_type="image/jpg",
                size=os.path.getsize(self.SAFE_FILE_PATH),
                charset=None,
            )
            result, timestamp_scan = scan_uploaded_file_for_virus(uploaded_file)

            self.assertEqual(result, VirusScanStatus.CLEAN)
            self.assertEqual(timestamp_scan, self.DT)

    @time_machine.travel(DT, tick=False)
    @patch("clamav_client.get_scanner")
    def test_positive_uploaded_file(self, mock_get_scanner):
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockResults(
            state="FOUND",
            details="Eicar-signature",
            passed=False,
        )
        mock_get_scanner.return_value = mock_scanner

        with open(self.EICAR_FILE_PATH, "rb") as file:
            uploaded_file = InMemoryUploadedFile(
                file=file,
                field_name="file",
                name="eicar.txt",
                content_type="text/plain",
                size=os.path.getsize(self.EICAR_FILE_PATH),
                charset=None,
            )
            result, timestamp_scan = scan_uploaded_file_for_virus(uploaded_file)

            self.assertEqual(result, VirusScanStatus.INFECTED)
            self.assertEqual(timestamp_scan, self.DT)

    @time_machine.travel(DT, tick=False)
    @patch("clamav_client.get_scanner")
    def test_negative_disk_file(self, mock_get_scanner):
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockResults(
            state="OK",
            details="",
            passed=True,
        )
        mock_get_scanner.return_value = mock_scanner

        absolute_path = os.path.abspath(self.SAFE_FILE_PATH)
        result, timestamp_scan = scan_disk_file_for_virus(absolute_path)

        self.assertEqual(result, VirusScanStatus.CLEAN)
        self.assertEqual(timestamp_scan, self.DT)

    @time_machine.travel(DT, tick=False)
    @patch("clamav_client.get_scanner")
    def test_positive_disk_file(self, mock_get_scanner):
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockResults(
            state="FOUND",
            details="Eicar-signature",
            passed=False,
        )
        mock_get_scanner.return_value = mock_scanner

        absolute_path = os.path.abspath(self.SAFE_FILE_PATH)
        result, timestamp_scan = scan_disk_file_for_virus(absolute_path)

        self.assertEqual(result, VirusScanStatus.INFECTED)
        self.assertEqual(timestamp_scan, self.DT)

    @override_settings(CLAMAV_ACTIVE=False)
    def test_skipping_scan(self):
        absolute_path = os.path.abspath(self.EICAR_FILE_PATH)
        result, timestamp_scan = scan_disk_file_for_virus(absolute_path)

        self.assertEqual(result, VirusScanStatus.PENDING)
        self.assertIsNone(timestamp_scan)

    def test_scanning_but_no_clamav_server_reachable(self):
        absolute_path = os.path.abspath(self.SAFE_FILE_PATH)
        result, timestamp_scan = scan_disk_file_for_virus(absolute_path)

        self.assertEqual(result, VirusScanStatus.ERROR)
        self.assertIsNone(timestamp_scan)


class MockResults:
    def __init__(self, state, details, passed):
        self.state = state
        self.details = details
        self.passed = passed
