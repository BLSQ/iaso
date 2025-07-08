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


class IncidentReportVirusScanAPITestCase(VaccineStockManagementAPITestCase):
    DT = datetime.datetime(2024, 10, 9, 16, 45, 27, tzinfo=datetime.timezone.utc)
    SAFE_FILE_PATH = "plugins/polio/tests/fixtures/virus_scan/safe_file.pdf"
    INFECTED_FILE_PATH = "plugins/polio/tests/fixtures/virus_scan/infected_file.pdf"

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_create_incident_report_with_safe_file(self, mock_get_scanner):
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
                "date_of_incident_report": "2024-01-01",
                "incident_report_received_by_rrt": "2024-01-02",
                "stock_correction": pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
                "unusable_vials": 7,
                "usable_vials": 3,
                "file": SimpleUploadedFile(
                    "safe_file.pdf",
                    safe_file_content,
                    content_type="application/pdf",
                ),
            }

            response = self.client.post(
                f"{BASE_URL_SUB_RESOURCES}incident_report/",
                data=data,
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get the created incident report
        incident_report = pm.IncidentReport.objects.latest("id")
        self.assertEqual(incident_report.file_scan_status, VirusScanStatus.CLEAN)
        self.assertEqual(incident_report.file_last_scan, self.DT)
        self.assertEqual(incident_report.unusable_vials, 7)
        self.assertEqual(incident_report.usable_vials, 3)

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_create_incident_report_with_infected_file(self, mock_get_scanner):
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
                "date_of_incident_report": "2024-01-01",
                "incident_report_received_by_rrt": "2024-01-02",
                "stock_correction": pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
                "unusable_vials": 7,
                "usable_vials": 3,
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

            response = self.client.post(
                f"{BASE_URL_SUB_RESOURCES}incident_report/",
                data=data,
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get the created incident report
        incident_report = pm.IncidentReport.objects.latest("id")
        self.assertEqual(incident_report.file_scan_status, VirusScanStatus.INFECTED)
        self.assertEqual(incident_report.file_last_scan, self.DT)
        self.assertEqual(incident_report.unusable_vials, 7)
        self.assertEqual(incident_report.usable_vials, 3)

    def test_create_incident_report_without_scanning(self):
        # Use a non-admin user
        self.client.force_authenticate(self.user_rw_perms)

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            data = {
                "vaccine_stock": self.vaccine_stock.pk,
                "date_of_incident_report": "2024-01-01",
                "incident_report_received_by_rrt": "2024-01-02",
                "stock_correction": pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
                "unusable_vials": 7,
                "usable_vials": 3,
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

            response = self.client.post(
                f"{BASE_URL_SUB_RESOURCES}incident_report/",
                data=data,
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get the created incident report
        incident_report = pm.IncidentReport.objects.latest("id")
        self.assertEqual(incident_report.file_scan_status, VirusScanStatus.PENDING)
        self.assertIsNone(incident_report.file_last_scan)
        self.assertEqual(incident_report.unusable_vials, 7)
        self.assertEqual(incident_report.usable_vials, 3)

    @override_settings(
        CLAMAV_ACTIVE=True,
        CLAMAV_CONFIGURATION={
            **settings.CLAMAV_CONFIGURATION,
            "address": "hey.this-is-likely-not-a-valid-clamav-server.com:3310",
            "timeout": 2,
        },
    )
    def test_create_incident_report_scan_connection_error(self):
        # Use a non-admin user
        self.client.force_authenticate(self.user_rw_perms)

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            data = {
                "vaccine_stock": self.vaccine_stock.pk,
                "date_of_incident_report": "2024-01-01",
                "incident_report_received_by_rrt": "2024-01-02",
                "stock_correction": pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
                "unusable_vials": 7,
                "usable_vials": 3,
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

            response = self.client.post(
                f"{BASE_URL_SUB_RESOURCES}incident_report/",
                data=data,
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get the created incident report
        incident_report = pm.IncidentReport.objects.latest("id")
        self.assertEqual(incident_report.file_scan_status, VirusScanStatus.ERROR)
        self.assertIsNone(incident_report.file_last_scan)
        self.assertEqual(incident_report.unusable_vials, 7)
        self.assertEqual(incident_report.usable_vials, 3)

    def test_retrieve_incident_reports_with_various_statuses(self):
        # Create incident reports with various statuses
        with open(self.INFECTED_FILE_PATH, "rb") as file:
            file_content = file.read()

            incident_report_safe = pm.IncidentReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                date_of_incident_report="2024-01-01",
                incident_report_received_by_rrt="2024-01-02",
                stock_correction=pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
                unusable_vials=7,
                usable_vials=3,
                file_scan_status=VirusScanStatus.CLEAN,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="safe_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )
            incident_report_infected = pm.IncidentReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                date_of_incident_report="2024-01-01",
                incident_report_received_by_rrt="2024-01-02",
                stock_correction=pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
                unusable_vials=7,
                usable_vials=3,
                file_scan_status=VirusScanStatus.INFECTED,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="infected_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )
            incident_report_pending = pm.IncidentReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                date_of_incident_report="2024-01-01",
                incident_report_received_by_rrt="2024-01-02",
                stock_correction=pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
                unusable_vials=7,
                usable_vials=3,
                file_scan_status=VirusScanStatus.PENDING,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="pending_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )
            incident_report_error = pm.IncidentReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                date_of_incident_report="2024-01-01",
                incident_report_received_by_rrt="2024-01-02",
                stock_correction=pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
                unusable_vials=7,
                usable_vials=3,
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

        response = self.client.get(f"{BASE_URL_SUB_RESOURCES}incident_report/")
        data = response.json()["results"]
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Find our test reports in the response
        safe_report = next((r for r in data if r["id"] == incident_report_safe.id), None)
        infected_report = next((r for r in data if r["id"] == incident_report_infected.id), None)
        pending_report = next((r for r in data if r["id"] == incident_report_pending.id), None)
        error_report = next((r for r in data if r["id"] == incident_report_error.id), None)

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
    def test_update_incident_report_with_safe_file(self, mock_get_scanner):
        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockClamavScanResults(
            state="OK",
            details=None,
            passed=True,
        )
        mock_get_scanner.return_value = mock_scanner

        # Prepare incident report with an infected file
        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            incident_report_infected = pm.IncidentReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                date_of_incident_report="2024-01-01",
                incident_report_received_by_rrt="2024-01-02",
                stock_correction=pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
                unusable_vials=7,
                usable_vials=3,
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
                "stock_correction": pm.IncidentReport.StockCorrectionChoices.BROKEN,
                "unusable_vials": 10,
                "usable_vials": 5,
                "file": SimpleUploadedFile(
                    "safe_file.pdf",
                    safe_file_content,
                    content_type="application/pdf",
                ),
            }

        self.client.force_authenticate(self.user_rw_perms)
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}incident_report/{incident_report_infected.pk}/",
            data=data,
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        incident_report_infected.refresh_from_db()
        self.assertEqual(incident_report_infected.file_scan_status, VirusScanStatus.CLEAN)
        self.assertEqual(incident_report_infected.file_last_scan, self.DT)
        self.assertEqual(incident_report_infected.unusable_vials, 10)
        self.assertEqual(incident_report_infected.usable_vials, 5)
        self.assertEqual(incident_report_infected.stock_correction, pm.IncidentReport.StockCorrectionChoices.BROKEN)

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_update_incident_report_with_infected_file(self, mock_get_scanner):
        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockClamavScanResults(
            state="FOUND",
            details="Virus found :(",
            passed=False,
        )
        mock_get_scanner.return_value = mock_scanner

        # Prepare incident report with a clean file
        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()

            incident_report_clean = pm.IncidentReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                date_of_incident_report="2024-01-01",
                incident_report_received_by_rrt="2024-01-02",
                stock_correction=pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
                unusable_vials=7,
                usable_vials=3,
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
                "stock_correction": pm.IncidentReport.StockCorrectionChoices.BROKEN,
                "unusable_vials": 10,
                "usable_vials": 5,
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

        self.client.force_authenticate(self.user_rw_perms)
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}incident_report/{incident_report_clean.pk}/",
            data=data,
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        incident_report_clean.refresh_from_db()
        self.assertEqual(incident_report_clean.file_scan_status, VirusScanStatus.INFECTED)
        self.assertEqual(incident_report_clean.file_last_scan, self.DT)
        self.assertEqual(incident_report_clean.unusable_vials, 10)
        self.assertEqual(incident_report_clean.usable_vials, 5)
        self.assertEqual(incident_report_clean.stock_correction, pm.IncidentReport.StockCorrectionChoices.BROKEN)

    def test_update_incident_report_without_scanning(self):
        # Prepare incident report with a clean file
        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()

            incident_report_clean = pm.IncidentReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                date_of_incident_report="2024-01-01",
                incident_report_received_by_rrt="2024-01-02",
                stock_correction=pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
                unusable_vials=7,
                usable_vials=3,
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
                "stock_correction": pm.IncidentReport.StockCorrectionChoices.BROKEN,
                "unusable_vials": 10,
                "usable_vials": 5,
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

        self.client.force_authenticate(self.user_rw_perms)
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}incident_report/{incident_report_clean.pk}/",
            data=data,
            format="multipart",
        )

        response_data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        incident_report_clean.refresh_from_db()

        self.assertEqual(response_data["scan_result"], VirusScanStatus.PENDING)
        self.assertEqual(incident_report_clean.file_scan_status, VirusScanStatus.PENDING)
        self.assertIsNone(incident_report_clean.file_last_scan)
        self.assertEqual(incident_report_clean.unusable_vials, 10)
        self.assertEqual(incident_report_clean.usable_vials, 5)
        self.assertEqual(incident_report_clean.stock_correction, pm.IncidentReport.StockCorrectionChoices.BROKEN)

    @override_settings(
        CLAMAV_ACTIVE=True,
        CLAMAV_CONFIGURATION={
            **settings.CLAMAV_CONFIGURATION,
            "address": "hey.this-is-likely-not-a-valid-clamav-server.com:3310",
            "timeout": 2,
        },
    )
    def test_update_incident_report_scan_connection_error(self):
        # Prepare incident report with a clean file
        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()

            incident_report_clean = pm.IncidentReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                date_of_incident_report="2024-01-01",
                incident_report_received_by_rrt="2024-01-02",
                stock_correction=pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
                unusable_vials=7,
                usable_vials=3,
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
                "stock_correction": pm.IncidentReport.StockCorrectionChoices.BROKEN,
                "unusable_vials": 10,
                "usable_vials": 5,
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

        self.client.force_authenticate(self.user_rw_perms)
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}incident_report/{incident_report_clean.pk}/",
            data=data,
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        incident_report_clean.refresh_from_db()
        self.assertEqual(incident_report_clean.file_scan_status, VirusScanStatus.ERROR)
        self.assertIsNone(incident_report_clean.file_last_scan)
        self.assertEqual(incident_report_clean.unusable_vials, 10)
        self.assertEqual(incident_report_clean.usable_vials, 5)
        self.assertEqual(incident_report_clean.stock_correction, pm.IncidentReport.StockCorrectionChoices.BROKEN)
