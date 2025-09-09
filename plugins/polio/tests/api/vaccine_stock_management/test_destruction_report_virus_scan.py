import datetime

from unittest.mock import MagicMock, patch

import time_machine

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status

from hat import settings
from iaso.test import MockClamavScanResults
from iaso.utils.virus_scan.model import VirusScanStatus
from plugins.polio import models as pm
from plugins.polio.tests.test_vaccine_stock_management import VaccineStockManagementAPITestCase


BASE_URL_SUB_RESOURCES = "/api/polio/vaccine/stock/"


class DestructionReportVirusScanAPITestCase(VaccineStockManagementAPITestCase):
    DT = datetime.datetime(2024, 10, 9, 16, 45, 27, tzinfo=datetime.timezone.utc)
    SAFE_FILE_PATH = "plugins/polio/tests/fixtures/virus_scan/safe_file.pdf"
    INFECTED_FILE_PATH = "plugins/polio/tests/fixtures/virus_scan/infected_file.pdf"

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_create_destruction_report_with_safe_file(self, mock_get_scanner):
        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockClamavScanResults(
            state="OK",
            details=None,
            passed=True,
        )
        mock_get_scanner.return_value = mock_scanner

        # Use a non-admin user
        self.client.force_authenticate(self.user_rw_perms)

        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()

            data = {
                "vaccine_stock": self.vaccine_stock.pk,
                "destruction_report_date": "2024-01-01",
                "rrt_destruction_report_reception_date": "2024-01-02",
                "unusable_vials_destroyed": 5,
                "action": "Destroyed due to expiration",
                "file": SimpleUploadedFile(
                    "safe_file.pdf",
                    safe_file_content,
                    content_type="application/pdf",
                ),
            }

            response = self.client.post(
                f"{BASE_URL_SUB_RESOURCES}destruction_report/",
                data=data,
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get the created destruction report
        destruction_report = pm.DestructionReport.objects.latest("id")
        self.assertEqual(destruction_report.file_scan_status, VirusScanStatus.CLEAN)
        self.assertEqual(destruction_report.file_last_scan, self.DT)
        self.assertEqual(destruction_report.unusable_vials_destroyed, 5)

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_create_destruction_report_with_infected_file(self, mock_get_scanner):
        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockClamavScanResults(
            state="FOUND",
            details="Virus found :(",
            passed=False,
        )
        mock_get_scanner.return_value = mock_scanner

        # Use a non-admin user
        self.client.force_authenticate(self.user_rw_perms)

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            data = {
                "vaccine_stock": self.vaccine_stock.pk,
                "destruction_report_date": "2024-01-01",
                "rrt_destruction_report_reception_date": "2024-01-02",
                "unusable_vials_destroyed": 5,
                "action": "Destroyed due to expiration",
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

            response = self.client.post(
                f"{BASE_URL_SUB_RESOURCES}destruction_report/",
                data=data,
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get the created destruction report
        destruction_report = pm.DestructionReport.objects.latest("id")
        self.assertEqual(destruction_report.file_scan_status, VirusScanStatus.INFECTED)
        self.assertEqual(destruction_report.file_last_scan, self.DT)
        self.assertEqual(destruction_report.unusable_vials_destroyed, 5)

    def test_create_destruction_report_without_scanning(self):
        # Use a non-admin user
        self.client.force_authenticate(self.user_rw_perms)

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            data = {
                "vaccine_stock": self.vaccine_stock.pk,
                "destruction_report_date": "2024-01-01",
                "rrt_destruction_report_reception_date": "2024-01-02",
                "unusable_vials_destroyed": 5,
                "action": "Destroyed due to expiration",
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

            response = self.client.post(
                f"{BASE_URL_SUB_RESOURCES}destruction_report/",
                data=data,
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get the created destruction report
        destruction_report = pm.DestructionReport.objects.latest("id")
        self.assertEqual(destruction_report.file_scan_status, VirusScanStatus.PENDING)
        self.assertIsNone(destruction_report.file_last_scan)
        self.assertEqual(destruction_report.unusable_vials_destroyed, 5)

    @override_settings(
        CLAMAV_ACTIVE=True,
        CLAMAV_CONFIGURATION={
            **settings.CLAMAV_CONFIGURATION,
            "address": "hey.this-is-likely-not-a-valid-clamav-server.com:3310",
            "timeout": 2,
        },
    )
    def test_create_destruction_report_scan_connection_error(self):
        # Use a non-admin user
        self.client.force_authenticate(self.user_rw_perms)

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            data = {
                "vaccine_stock": self.vaccine_stock.pk,
                "destruction_report_date": "2024-01-01",
                "rrt_destruction_report_reception_date": "2024-01-02",
                "unusable_vials_destroyed": 5,
                "action": "Destroyed due to expiration",
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

            response = self.client.post(
                f"{BASE_URL_SUB_RESOURCES}destruction_report/",
                data=data,
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get the created destruction report
        destruction_report = pm.DestructionReport.objects.latest("id")
        self.assertEqual(destruction_report.file_scan_status, VirusScanStatus.ERROR)
        self.assertIsNone(destruction_report.file_last_scan)
        self.assertEqual(destruction_report.unusable_vials_destroyed, 5)

    def test_retrieve_destruction_reports_with_various_statuses(self):
        # Create destruction reports with various statuses
        with open(self.INFECTED_FILE_PATH, "rb") as file:
            file_content = file.read()

            destruction_report_safe = pm.DestructionReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                destruction_report_date="2024-01-01",
                rrt_destruction_report_reception_date="2024-01-02",
                action="Destroyed due to expiration",
                unusable_vials_destroyed=3,
                file_scan_status=VirusScanStatus.CLEAN,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="safe_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )
            destruction_report_infected = pm.DestructionReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                destruction_report_date="2024-01-01",
                rrt_destruction_report_reception_date="2024-01-02",
                action="Destroyed due to expiration",
                unusable_vials_destroyed=3,
                file_scan_status=VirusScanStatus.INFECTED,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="infected_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )
            destruction_report_pending = pm.DestructionReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                destruction_report_date="2024-01-01",
                rrt_destruction_report_reception_date="2024-01-02",
                action="Destroyed due to expiration",
                unusable_vials_destroyed=3,
                file_scan_status=VirusScanStatus.PENDING,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="pending_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )
            destruction_report_error = pm.DestructionReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                destruction_report_date="2024-01-01",
                rrt_destruction_report_reception_date="2024-01-02",
                action="Destroyed due to expiration",
                unusable_vials_destroyed=3,
                file_scan_status=VirusScanStatus.ERROR,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="error_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )

        # Use a non-admin user
        self.client.force_authenticate(self.user_rw_perms)

        response = self.client.get(f"{BASE_URL_SUB_RESOURCES}destruction_report/")
        data = response.json()["results"]
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Find our test reports in the response
        safe_report = next((r for r in data if r["id"] == destruction_report_safe.id), None)
        infected_report = next((r for r in data if r["id"] == destruction_report_infected.id), None)
        pending_report = next((r for r in data if r["id"] == destruction_report_pending.id), None)
        error_report = next((r for r in data if r["id"] == destruction_report_error.id), None)

        self.assertIsNotNone(safe_report)
        self.assertEqual(safe_report["scan_result"], VirusScanStatus.CLEAN)
        self.assertEqual(safe_report["scan_timestamp"], self.DT.timestamp())

        self.assertIsNotNone(infected_report)
        self.assertEqual(infected_report["scan_result"], VirusScanStatus.INFECTED)
        self.assertEqual(infected_report["scan_timestamp"], self.DT.timestamp())

        self.assertIsNotNone(pending_report)
        self.assertEqual(pending_report["scan_result"], VirusScanStatus.PENDING)
        self.assertEqual(pending_report["scan_timestamp"], self.DT.timestamp())

        self.assertIsNotNone(error_report)
        self.assertEqual(error_report["scan_result"], VirusScanStatus.ERROR)
        self.assertEqual(error_report["scan_timestamp"], self.DT.timestamp())

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_update_destruction_report_with_safe_file(self, mock_get_scanner):
        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockClamavScanResults(
            state="OK",
            details=None,
            passed=True,
        )
        mock_get_scanner.return_value = mock_scanner

        # Prepare destruction report with an infected file
        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            destruction_report_infected = pm.DestructionReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                destruction_report_date="2024-01-01",
                rrt_destruction_report_reception_date="2024-01-02",
                action="Destroyed due to expiration",
                unusable_vials_destroyed=3,
                file_scan_status=VirusScanStatus.INFECTED,
                file_last_scan=datetime.datetime(2021, 10, 9, 16, 45, 27, tzinfo=datetime.timezone.utc),
                file=SimpleUploadedFile(
                    name="infected_file.pdf",
                    content=infected_file_content,
                    content_type="application/pdf",
                ),
            )

        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()
            data = {
                "action": "Updated action",
                "unusable_vials_destroyed": 10,
                "file": SimpleUploadedFile(
                    "safe_file.pdf",
                    safe_file_content,
                    content_type="application/pdf",
                ),
            }

        self.client.force_authenticate(self.user_rw_perms)
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/{destruction_report_infected.pk}/",
            data=data,
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        destruction_report_infected.refresh_from_db()
        self.assertEqual(destruction_report_infected.file_scan_status, VirusScanStatus.CLEAN)
        self.assertEqual(destruction_report_infected.file_last_scan, self.DT)
        self.assertEqual(destruction_report_infected.unusable_vials_destroyed, 10)
        self.assertEqual(destruction_report_infected.action, "Updated action")

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_update_destruction_report_with_infected_file(self, mock_get_scanner):
        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockClamavScanResults(
            state="FOUND",
            details="Virus found :(",
            passed=False,
        )
        mock_get_scanner.return_value = mock_scanner

        # Prepare destruction report with a clean file
        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()

            destruction_report_clean = pm.DestructionReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                destruction_report_date="2024-01-01",
                rrt_destruction_report_reception_date="2024-01-02",
                action="Destroyed due to expiration",
                unusable_vials_destroyed=3,
                file_scan_status=VirusScanStatus.CLEAN,
                file_last_scan=datetime.datetime(2021, 10, 9, 16, 45, 27, tzinfo=datetime.timezone.utc),
                file=SimpleUploadedFile(
                    name="clean_file.pdf",
                    content=safe_file_content,
                    content_type="application/pdf",
                ),
            )

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()
            data = {
                "action": "Updated action",
                "unusable_vials_destroyed": 10,
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

        self.client.force_authenticate(self.user_rw_perms)
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/{destruction_report_clean.pk}/",
            data=data,
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        destruction_report_clean.refresh_from_db()
        self.assertEqual(destruction_report_clean.file_scan_status, VirusScanStatus.INFECTED)
        self.assertEqual(destruction_report_clean.file_last_scan, self.DT)
        self.assertEqual(destruction_report_clean.unusable_vials_destroyed, 10)
        self.assertEqual(destruction_report_clean.action, "Updated action")

    def test_update_destruction_report_without_scanning(self):
        # Prepare destruction report with a clean file
        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()

            destruction_report_clean = pm.DestructionReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                destruction_report_date="2024-01-01",
                rrt_destruction_report_reception_date="2024-01-02",
                action="Destroyed due to expiration",
                unusable_vials_destroyed=3,
                file_scan_status=VirusScanStatus.CLEAN,
                file_last_scan=datetime.datetime(2021, 10, 9, 16, 45, 27, tzinfo=datetime.timezone.utc),
                file=SimpleUploadedFile(
                    name="clean_file.pdf",
                    content=safe_file_content,
                    content_type="application/pdf",
                ),
            )

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()
            data = {
                "action": "Updated action",
                "unusable_vials_destroyed": 10,
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

        self.client.force_authenticate(self.user_rw_perms)
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/{destruction_report_clean.pk}/",
            data=data,
            format="multipart",
        )

        response_data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        destruction_report_clean.refresh_from_db()

        self.assertEqual(response_data["scan_result"], VirusScanStatus.PENDING)
        self.assertEqual(destruction_report_clean.file_scan_status, VirusScanStatus.PENDING)
        self.assertIsNone(destruction_report_clean.file_last_scan)
        self.assertEqual(destruction_report_clean.unusable_vials_destroyed, 10)
        self.assertEqual(destruction_report_clean.action, "Updated action")

    @override_settings(
        CLAMAV_ACTIVE=True,
        CLAMAV_CONFIGURATION={
            **settings.CLAMAV_CONFIGURATION,
            "address": "hey.this-is-likely-not-a-valid-clamav-server.com:3310",
            "timeout": 2,
        },
    )
    def test_update_destruction_report_scan_connection_error(self):
        # Prepare destruction report with a clean file
        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()

            destruction_report_clean = pm.DestructionReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                destruction_report_date="2024-01-01",
                rrt_destruction_report_reception_date="2024-01-02",
                action="Destroyed due to expiration",
                unusable_vials_destroyed=3,
                file_scan_status=VirusScanStatus.CLEAN,
                file_last_scan=datetime.datetime(2021, 10, 9, 16, 45, 27, tzinfo=datetime.timezone.utc),
                file=SimpleUploadedFile(
                    name="clean_file.pdf",
                    content=safe_file_content,
                    content_type="application/pdf",
                ),
            )

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()
            data = {
                "action": "Updated action",
                "unusable_vials_destroyed": 10,
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

        self.client.force_authenticate(self.user_rw_perms)
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/{destruction_report_clean.pk}/",
            data=data,
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        destruction_report_clean.refresh_from_db()
        self.assertEqual(destruction_report_clean.file_scan_status, VirusScanStatus.ERROR)
        self.assertIsNone(destruction_report_clean.file_last_scan)
        self.assertEqual(destruction_report_clean.unusable_vials_destroyed, 10)
        self.assertEqual(destruction_report_clean.action, "Updated action")
