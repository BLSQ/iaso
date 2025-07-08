import datetime

from unittest.mock import MagicMock, patch

import time_machine

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status

from hat import settings
from iaso.utils.virus_scan.model import VirusScanStatus
from plugins.polio import models as pm
from plugins.polio.tests.test_vaccine_stock_management import VaccineStockManagementAPITestCase


BASE_URL_SUB_RESOURCES = "/api/polio/vaccine/stock/"


class OutgoingStockMovementVirusScanAPITestCase(VaccineStockManagementAPITestCase):
    DT = datetime.datetime(2024, 10, 9, 16, 45, 27, tzinfo=datetime.timezone.utc)
    SAFE_FILE_PATH = "plugins/polio/tests/fixtures/virus_scan/safe_file.pdf"
    INFECTED_FILE_PATH = "plugins/polio/tests/fixtures/virus_scan/infected_file.pdf"

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_create_outgoing_stock_movement_with_safe_file(self, mock_get_scanner):
        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockResults(
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
                "campaign": self.campaign.obr_name,
                "report_date": "2024-01-01",
                "form_a_reception_date": "2024-01-02",
                "usable_vials_used": 10,
                "file": SimpleUploadedFile(
                    "safe_file.pdf",
                    safe_file_content,
                    content_type="application/pdf",
                ),
            }

            response = self.client.post(
                f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
                data=data,
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get the created outgoing stock movement
        outgoing_stock_movement = pm.OutgoingStockMovement.objects.latest("id")
        self.assertEqual(outgoing_stock_movement.file_scan_status, VirusScanStatus.CLEAN)
        self.assertEqual(outgoing_stock_movement.file_last_scan, self.DT)
        self.assertEqual(outgoing_stock_movement.usable_vials_used, 10)

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_create_outgoing_stock_movement_with_infected_file(self, mock_get_scanner):
        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockResults(
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
                "campaign": self.campaign.obr_name,
                "report_date": "2024-01-01",
                "form_a_reception_date": "2024-01-02",
                "usable_vials_used": 10,
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

            response = self.client.post(
                f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
                data=data,
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get the created outgoing stock movement
        outgoing_stock_movement = pm.OutgoingStockMovement.objects.latest("id")
        self.assertEqual(outgoing_stock_movement.file_scan_status, VirusScanStatus.INFECTED)
        self.assertEqual(outgoing_stock_movement.file_last_scan, self.DT)
        self.assertEqual(outgoing_stock_movement.usable_vials_used, 10)

    def test_create_outgoing_stock_movement_without_scanning(self):
        # Use a non-admin user
        self.client.force_authenticate(self.user_rw_perms)

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            data = {
                "vaccine_stock": self.vaccine_stock.pk,
                "campaign": self.campaign.obr_name,
                "report_date": "2024-01-01",
                "form_a_reception_date": "2024-01-02",
                "usable_vials_used": 10,
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

            response = self.client.post(
                f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
                data=data,
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get the created outgoing stock movement
        outgoing_stock_movement = pm.OutgoingStockMovement.objects.latest("id")
        self.assertEqual(outgoing_stock_movement.file_scan_status, VirusScanStatus.PENDING)
        self.assertIsNone(outgoing_stock_movement.file_last_scan)
        self.assertEqual(outgoing_stock_movement.usable_vials_used, 10)

    @override_settings(
        CLAMAV_ACTIVE=True,
        CLAMAV_CONFIGURATION={
            **settings.CLAMAV_CONFIGURATION,
            "address": "hey.this-is-likely-not-a-valid-clamav-server.com:3310",
            "timeout": 2,
        },
    )
    def test_create_outgoing_stock_movement_scan_connection_error(self):
        # Use a non-admin user
        self.client.force_authenticate(self.user_rw_perms)

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            data = {
                "vaccine_stock": self.vaccine_stock.pk,
                "campaign": self.campaign.obr_name,
                "report_date": "2024-01-01",
                "form_a_reception_date": "2024-01-02",
                "usable_vials_used": 10,
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

            response = self.client.post(
                f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
                data=data,
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get the created outgoing stock movement
        outgoing_stock_movement = pm.OutgoingStockMovement.objects.latest("id")
        self.assertEqual(outgoing_stock_movement.file_scan_status, VirusScanStatus.ERROR)
        self.assertIsNone(outgoing_stock_movement.file_last_scan)
        self.assertEqual(outgoing_stock_movement.usable_vials_used, 10)

    def test_retrieve_outgoing_stock_movements_with_various_statuses(self):
        # Create outgoing stock movements with various statuses
        with open(self.INFECTED_FILE_PATH, "rb") as file:
            file_content = file.read()

            outgoing_stock_movement_safe = pm.OutgoingStockMovement.objects.create(
                vaccine_stock=self.vaccine_stock,
                campaign=self.campaign,
                report_date="2024-01-01",
                form_a_reception_date="2024-01-02",
                usable_vials_used=10,
                file_scan_status=VirusScanStatus.CLEAN,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="safe_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )
            outgoing_stock_movement_infected = pm.OutgoingStockMovement.objects.create(
                vaccine_stock=self.vaccine_stock,
                campaign=self.campaign,
                report_date="2024-01-01",
                form_a_reception_date="2024-01-02",
                usable_vials_used=10,
                file_scan_status=VirusScanStatus.INFECTED,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="infected_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )
            outgoing_stock_movement_pending = pm.OutgoingStockMovement.objects.create(
                vaccine_stock=self.vaccine_stock,
                campaign=self.campaign,
                report_date="2024-01-01",
                form_a_reception_date="2024-01-02",
                usable_vials_used=10,
                file_scan_status=VirusScanStatus.PENDING,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="pending_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )
            outgoing_stock_movement_error = pm.OutgoingStockMovement.objects.create(
                vaccine_stock=self.vaccine_stock,
                campaign=self.campaign,
                report_date="2024-01-01",
                form_a_reception_date="2024-01-02",
                usable_vials_used=10,
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

        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/?order=id&vaccine_stock={self.vaccine_stock.pk}"
        )

        r = self.assertJSONResponse(response, 200)
        data = r["results"]
        print("DATA", data)
        self.assertEqual(len(data), 5)  # Including the 1 from setUpTestData

        # Find our test records in the response
        test_records = [
            r
            for r in data
            if r["usable_vials_used"] == 10 and r.get("scan_result") and r["id"] != self.outgoing_stock_movement.id
        ]  # exlude setup data from the test records

        self.assertEqual(len(test_records), 4)

        # Check scan results
        scan_results = [r["scan_result"] for r in test_records]
        self.assertIn(VirusScanStatus.CLEAN, scan_results)
        self.assertIn(VirusScanStatus.INFECTED, scan_results)
        self.assertIn(VirusScanStatus.PENDING, scan_results)
        self.assertIn(VirusScanStatus.ERROR, scan_results)

        # Check scan timestamps
        scan_timestamps = [r["scan_timestamp"] for r in test_records if r["scan_timestamp"]]
        for timestamp in scan_timestamps:
            self.assertEqual(timestamp, self.DT.timestamp())

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_update_outgoing_stock_movement_with_safe_file(self, mock_get_scanner):
        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockResults(
            state="OK",
            details=None,
            passed=True,
        )
        mock_get_scanner.return_value = mock_scanner

        # Prepare outgoing stock movement with an infected file
        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            outgoing_stock_movement_infected = pm.OutgoingStockMovement.objects.create(
                vaccine_stock=self.vaccine_stock,
                campaign=self.campaign,
                report_date="2024-01-01",
                form_a_reception_date="2024-01-02",
                usable_vials_used=10,
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
                "usable_vials_used": 15,
                "file": SimpleUploadedFile(
                    name="safe_file.pdf",
                    content=safe_file_content,
                    content_type="application/pdf",
                ),
            }

        self.client.force_authenticate(self.user_rw_perms)
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{outgoing_stock_movement_infected.id}/",
            data=data,
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        outgoing_stock_movement_infected.refresh_from_db()
        self.assertEqual(outgoing_stock_movement_infected.file_scan_status, VirusScanStatus.CLEAN)
        self.assertEqual(outgoing_stock_movement_infected.file_last_scan, self.DT)
        self.assertEqual(outgoing_stock_movement_infected.usable_vials_used, 15)

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_update_outgoing_stock_movement_with_infected_file(self, mock_get_scanner):
        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockResults(
            state="FOUND",
            details="Virus found :(",
            passed=False,
        )
        mock_get_scanner.return_value = mock_scanner

        # Prepare outgoing stock movement with a clean file
        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()

            outgoing_stock_movement_clean = pm.OutgoingStockMovement.objects.create(
                vaccine_stock=self.vaccine_stock,
                campaign=self.campaign,
                report_date="2024-01-01",
                form_a_reception_date="2024-01-02",
                usable_vials_used=10,
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
                "usable_vials_used": 15,
                "file": SimpleUploadedFile(
                    name="infected_file.pdf",
                    content=infected_file_content,
                    content_type="application/pdf",
                ),
            }

        self.client.force_authenticate(self.user_rw_perms)
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{outgoing_stock_movement_clean.id}/",
            data=data,
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        outgoing_stock_movement_clean.refresh_from_db()
        self.assertEqual(outgoing_stock_movement_clean.file_scan_status, VirusScanStatus.INFECTED)
        self.assertEqual(outgoing_stock_movement_clean.file_last_scan, self.DT)
        self.assertEqual(outgoing_stock_movement_clean.usable_vials_used, 15)

    def test_update_outgoing_stock_movement_without_scanning(self):
        # Prepare outgoing stock movement with a clean file
        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()

            outgoing_stock_movement_clean = pm.OutgoingStockMovement.objects.create(
                vaccine_stock=self.vaccine_stock,
                campaign=self.campaign,
                report_date="2024-01-01",
                form_a_reception_date="2024-01-02",
                usable_vials_used=10,
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
                "usable_vials_used": 15,
                "file": SimpleUploadedFile(
                    name="infected_file.pdf",
                    content=infected_file_content,
                    content_type="application/pdf",
                ),
            }

        self.client.force_authenticate(self.user_rw_perms)
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{outgoing_stock_movement_clean.id}/",
            data=data,
            format="multipart",
        )

        response = self.assertJSONResponse(response, 200)

        outgoing_stock_movement_clean.refresh_from_db()

        self.assertEqual(response["scan_result"], VirusScanStatus.PENDING)
        self.assertEqual(outgoing_stock_movement_clean.file_scan_status, VirusScanStatus.PENDING)
        self.assertIsNone(outgoing_stock_movement_clean.file_last_scan)
        self.assertEqual(outgoing_stock_movement_clean.usable_vials_used, 15)

    @override_settings(
        CLAMAV_ACTIVE=True,
        CLAMAV_CONFIGURATION={
            **settings.CLAMAV_CONFIGURATION,
            "address": "hey.this-is-likely-not-a-valid-clamav-server.com:3310",
            "timeout": 2,
        },
    )
    def test_update_outgoing_stock_movement_scan_connection_error(self):
        # Prepare outgoing stock movement with a clean file
        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()

            outgoing_stock_movement_clean = pm.OutgoingStockMovement.objects.create(
                vaccine_stock=self.vaccine_stock,
                campaign=self.campaign,
                report_date="2024-01-01",
                form_a_reception_date="2024-01-02",
                usable_vials_used=10,
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
                "usable_vials_used": 15,
                "file": SimpleUploadedFile(
                    name="infected_file.pdf",
                    content=infected_file_content,
                    content_type="application/pdf",
                ),
            }

        self.client.force_authenticate(self.user_rw_perms)
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{outgoing_stock_movement_clean.id}/",
            data=data,
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        outgoing_stock_movement_clean.refresh_from_db()
        self.assertEqual(outgoing_stock_movement_clean.file_scan_status, VirusScanStatus.ERROR)
        self.assertIsNone(outgoing_stock_movement_clean.file_last_scan)
        self.assertEqual(outgoing_stock_movement_clean.usable_vials_used, 15)


class MockResults:
    def __init__(self, state, details, passed):
        self.state = state
        self.details = details
        self.passed = passed
