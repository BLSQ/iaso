import datetime

from unittest.mock import MagicMock, patch

import time_machine

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status

from hat import settings
from iaso.utils.virus_scan import VirusScanStatus
from plugins.polio import models as pm
from plugins.polio.tests.api.vaccine_supply_chain.base import BaseVaccineSupplyChainAPITestCase


class VaccineRequestFormVirusScanAPITestCase(BaseVaccineSupplyChainAPITestCase):
    DT = datetime.datetime(2024, 10, 9, 16, 45, 27, tzinfo=datetime.timezone.utc)
    SAFE_FILE_PATH = "plugins/polio/tests/fixtures/virus_scan/safe_file.pdf"
    INFECTED_FILE_PATH = "plugins/polio/tests/fixtures/virus_scan/infected_file.pdf"

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_create_vaccine_request_form_with_safe_file(self, mock_get_scanner):
        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockResults(
            state="OK",
            details=None,
            passed=True,
        )
        mock_get_scanner.return_value = mock_scanner

        # Use a non-admin user
        self.client.force_authenticate(self.user_rw_perm)

        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()

            data = {
                "campaign": self.campaign_rdc_1.obr_name,
                "vaccine_type": pm.VACCINES[0][0],
                "rounds": [{"number": 1}],
                "date_vrf_signature": "2024-01-01",
                "date_vrf_reception": "2024-01-02",
                "date_dg_approval": "2024-01-03",
                "quantities_ordered_in_doses": 500,
                "file": SimpleUploadedFile(
                    "safe_file.pdf",
                    safe_file_content,
                    content_type="application/pdf",
                ),
            }

            response = self.client.post(
                self.BASE_URL,
                data=data,
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get the created vaccine request form
        vaccine_request_form = pm.VaccineRequestForm.objects.latest("id")
        self.assertEqual(vaccine_request_form.file_scan_status, VirusScanStatus.CLEAN)
        self.assertEqual(vaccine_request_form.file_last_scan, self.DT)
        self.assertEqual(vaccine_request_form.quantities_ordered_in_doses, 500)

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_create_vaccine_request_form_with_infected_file(self, mock_get_scanner):
        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockResults(
            state="FOUND",
            details="Virus found :(",
            passed=False,
        )
        mock_get_scanner.return_value = mock_scanner

        # Use a non-admin user
        self.client.force_authenticate(self.user_rw_perm)

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            data = {
                "campaign": self.campaign_rdc_1.obr_name,
                "vaccine_type": pm.VACCINES[0][0],
                "rounds": [{"number": 1}],
                "date_vrf_signature": "2024-01-01",
                "date_vrf_reception": "2024-01-02",
                "date_dg_approval": "2024-01-03",
                "quantities_ordered_in_doses": 500,
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

            response = self.client.post(
                self.BASE_URL,
                data=data,
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get the created vaccine request form
        vaccine_request_form = pm.VaccineRequestForm.objects.latest("id")
        self.assertEqual(vaccine_request_form.file_scan_status, VirusScanStatus.INFECTED)
        self.assertEqual(vaccine_request_form.file_last_scan, self.DT)
        self.assertEqual(vaccine_request_form.quantities_ordered_in_doses, 500)

    def test_create_vaccine_request_form_without_scanning(self):
        # Use a non-admin user
        self.client.force_authenticate(self.user_rw_perm)

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            data = {
                "campaign": self.campaign_rdc_1.obr_name,
                "vaccine_type": pm.VACCINES[0][0],
                "rounds": [{"number": 1}],
                "date_vrf_signature": "2024-01-01",
                "date_vrf_reception": "2024-01-02",
                "date_dg_approval": "2024-01-03",
                "quantities_ordered_in_doses": 500,
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

            response = self.client.post(
                self.BASE_URL,
                data=data,
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get the created vaccine request form
        vaccine_request_form = pm.VaccineRequestForm.objects.latest("id")
        self.assertEqual(vaccine_request_form.file_scan_status, VirusScanStatus.PENDING)
        self.assertIsNone(vaccine_request_form.file_last_scan)
        self.assertEqual(vaccine_request_form.quantities_ordered_in_doses, 500)

    @override_settings(
        CLAMAV_ACTIVE=True,
        CLAMAV_CONFIGURATION={
            **settings.CLAMAV_CONFIGURATION,
            "address": "hey.this-is-likely-not-a-valid-clamav-server.com:3310",
            "timeout": 2,
        },
    )
    def test_create_vaccine_request_form_scan_connection_error(self):
        # Use a non-admin user
        self.client.force_authenticate(self.user_rw_perm)

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            data = {
                "campaign": self.campaign_rdc_1.obr_name,
                "vaccine_type": pm.VACCINES[0][0],
                "rounds": [{"number": 1}],
                "date_vrf_signature": "2024-01-01",
                "date_vrf_reception": "2024-01-02",
                "date_dg_approval": "2024-01-03",
                "quantities_ordered_in_doses": 500,
                "file": SimpleUploadedFile(
                    "infected_file.pdf",
                    infected_file_content,
                    content_type="application/pdf",
                ),
            }

            response = self.client.post(
                self.BASE_URL,
                data=data,
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get the created vaccine request form
        vaccine_request_form = pm.VaccineRequestForm.objects.latest("id")
        self.assertEqual(vaccine_request_form.file_scan_status, VirusScanStatus.ERROR)
        self.assertIsNone(vaccine_request_form.file_last_scan)
        self.assertEqual(vaccine_request_form.quantities_ordered_in_doses, 500)

    def test_retrieve_vaccine_request_forms_with_various_statuses(self):
        # Create vaccine request forms with various statuses
        with open(self.INFECTED_FILE_PATH, "rb") as file:
            file_content = file.read()

            vaccine_request_form_safe = pm.VaccineRequestForm.objects.create(
                campaign=self.campaign_rdc_1,
                vaccine_type=pm.VACCINES[0][0],
                date_vrf_signature="2024-01-01",
                date_vrf_reception="2024-01-02",
                date_dg_approval="2024-01-03",
                quantities_ordered_in_doses=500,
                file_scan_status=VirusScanStatus.CLEAN,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="safe_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )
            vaccine_request_form_safe.rounds.set([self.campaign_rdc_1_round_1])

            vaccine_request_form_infected = pm.VaccineRequestForm.objects.create(
                campaign=self.campaign_rdc_1,
                vaccine_type=pm.VACCINES[0][0],
                date_vrf_signature="2024-01-01",
                date_vrf_reception="2024-01-02",
                date_dg_approval="2024-01-03",
                quantities_ordered_in_doses=500,
                file_scan_status=VirusScanStatus.INFECTED,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="infected_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )
            vaccine_request_form_infected.rounds.set([self.campaign_rdc_1_round_2])

            vaccine_request_form_pending = pm.VaccineRequestForm.objects.create(
                campaign=self.campaign_rdc_1,
                vaccine_type=pm.VACCINES[0][0],
                date_vrf_signature="2024-01-01",
                date_vrf_reception="2024-01-02",
                date_dg_approval="2024-01-03",
                quantities_ordered_in_doses=500,
                file_scan_status=VirusScanStatus.PENDING,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="pending_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )
            vaccine_request_form_pending.rounds.set([self.campaign_rdc_1_round_3])

            vaccine_request_form_error = pm.VaccineRequestForm.objects.create(
                campaign=self.campaign_rdc_1,
                vaccine_type=pm.VACCINES[0][0],
                date_vrf_signature="2024-01-01",
                date_vrf_reception="2024-01-02",
                date_dg_approval="2024-01-03",
                quantities_ordered_in_doses=500,
                file_scan_status=VirusScanStatus.ERROR,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="error_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )
            vaccine_request_form_error.rounds.set([self.campaign_rdc_1_round_1])

        # Use a non-admin user
        self.client.force_authenticate(self.user_rw_perm)

        response = self.client.get(f"{self.BASE_URL}?order=id")
        data = response.json()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(data), 7)  # Including the 3 from setUpTestData

        # Find our test records in the response
        test_records = [
            r
            for r in data
            if r["quantities_ordered_in_doses"] == 500
            and r.get("file_scan_status")
            and r["id"]
            not in [
                self.vaccine_request_form_rdc_1.id,
                self.vaccine_request_form_rdc_2.id,
                self.vaccine_request_form_chad_1.id,
            ]
        ]

        self.assertEqual(len(test_records), 4)

        # Check scan results
        scan_results = [r["file_scan_status"] for r in test_records]
        self.assertIn(VirusScanStatus.CLEAN, scan_results)
        self.assertIn(VirusScanStatus.INFECTED, scan_results)
        self.assertIn(VirusScanStatus.PENDING, scan_results)
        self.assertIn(VirusScanStatus.ERROR, scan_results)

        # Check scan timestamps
        scan_timestamps = [r["file_last_scan"] for r in test_records if r["file_last_scan"]]
        for timestamp in scan_timestamps:
            self.assertEqual(timestamp, self.DT.timestamp())

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_update_vaccine_request_form_with_safe_file(self, mock_get_scanner):
        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockResults(
            state="OK",
            details=None,
            passed=True,
        )
        mock_get_scanner.return_value = mock_scanner

        # Prepare vaccine request form with an infected file
        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            vaccine_request_form_infected = pm.VaccineRequestForm.objects.create(
                campaign=self.campaign_rdc_1,
                vaccine_type=pm.VACCINES[0][0],
                date_vrf_signature="2024-01-01",
                date_vrf_reception="2024-01-02",
                date_dg_approval="2024-01-03",
                quantities_ordered_in_doses=500,
                file_scan_status=VirusScanStatus.INFECTED,
                file_last_scan=datetime.datetime(2021, 10, 9, 16, 45, 27, tzinfo=datetime.timezone.utc),
                file=SimpleUploadedFile(
                    name="infected_file.pdf",
                    content=infected_file_content,
                    content_type="application/pdf",
                ),
            )
            vaccine_request_form_infected.rounds.set([self.campaign_rdc_1_round_1])

        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()
            data = {
                "quantities_ordered_in_doses": 600,
                "file": SimpleUploadedFile(
                    name="safe_file.pdf",
                    content=safe_file_content,
                    content_type="application/pdf",
                ),
            }

        self.client.force_authenticate(self.user_rw_perm)
        response = self.client.patch(
            f"{self.BASE_URL}{vaccine_request_form_infected.id}/",
            data=data,
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        vaccine_request_form_infected.refresh_from_db()
        self.assertEqual(vaccine_request_form_infected.file_scan_status, VirusScanStatus.CLEAN)
        self.assertEqual(vaccine_request_form_infected.file_last_scan, self.DT)
        self.assertEqual(vaccine_request_form_infected.quantities_ordered_in_doses, 600)

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_update_vaccine_request_form_with_infected_file(self, mock_get_scanner):
        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockResults(
            state="FOUND",
            details="Virus found :(",
            passed=False,
        )
        mock_get_scanner.return_value = mock_scanner

        # Prepare vaccine request form with a clean file
        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()

            vaccine_request_form_clean = pm.VaccineRequestForm.objects.create(
                campaign=self.campaign_rdc_1,
                vaccine_type=pm.VACCINES[0][0],
                date_vrf_signature="2024-01-01",
                date_vrf_reception="2024-01-02",
                date_dg_approval="2024-01-03",
                quantities_ordered_in_doses=500,
                file_scan_status=VirusScanStatus.CLEAN,
                file_last_scan=datetime.datetime(2021, 10, 9, 16, 45, 27, tzinfo=datetime.timezone.utc),
                file=SimpleUploadedFile(
                    name="clean_file.pdf",
                    content=safe_file_content,
                    content_type="application/pdf",
                ),
            )
            vaccine_request_form_clean.rounds.set([self.campaign_rdc_1_round_1])

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()
            data = {
                "quantities_ordered_in_doses": 600,
                "file": SimpleUploadedFile(
                    name="infected_file.pdf",
                    content=infected_file_content,
                    content_type="application/pdf",
                ),
            }

        self.client.force_authenticate(self.user_rw_perm)
        response = self.client.patch(
            f"{self.BASE_URL}{vaccine_request_form_clean.id}/",
            data=data,
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        vaccine_request_form_clean.refresh_from_db()
        self.assertEqual(vaccine_request_form_clean.file_scan_status, VirusScanStatus.INFECTED)
        self.assertEqual(vaccine_request_form_clean.file_last_scan, self.DT)
        self.assertEqual(vaccine_request_form_clean.quantities_ordered_in_doses, 600)

    def test_update_vaccine_request_form_without_scanning(self):
        # Prepare vaccine request form with a clean file
        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()

            vaccine_request_form_clean = pm.VaccineRequestForm.objects.create(
                campaign=self.campaign_rdc_1,
                vaccine_type=pm.VACCINES[0][0],
                date_vrf_signature="2024-01-01",
                date_vrf_reception="2024-01-02",
                date_dg_approval="2024-01-03",
                quantities_ordered_in_doses=500,
                file_scan_status=VirusScanStatus.CLEAN,
                file_last_scan=datetime.datetime(2021, 10, 9, 16, 45, 27, tzinfo=datetime.timezone.utc),
                file=SimpleUploadedFile(
                    name="clean_file.pdf",
                    content=safe_file_content,
                    content_type="application/pdf",
                ),
            )
            vaccine_request_form_clean.rounds.set([self.campaign_rdc_1_round_1])

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()
            data = {
                "quantities_ordered_in_doses": 600,
                "file": SimpleUploadedFile(
                    name="infected_file.pdf",
                    content=infected_file_content,
                    content_type="application/pdf",
                ),
            }

        self.client.force_authenticate(self.user_rw_perm)
        response = self.client.patch(
            f"{self.BASE_URL}{vaccine_request_form_clean.id}/",
            data=data,
            format="multipart",
        )

        response = self.assertJSONResponse(response, 200)

        vaccine_request_form_clean.refresh_from_db()

        self.assertEqual(response["scan_result"], VirusScanStatus.PENDING)
        self.assertEqual(vaccine_request_form_clean.file_scan_status, VirusScanStatus.PENDING)
        self.assertIsNone(vaccine_request_form_clean.file_last_scan)
        self.assertEqual(vaccine_request_form_clean.quantities_ordered_in_doses, 600)

    @override_settings(
        CLAMAV_ACTIVE=True,
        CLAMAV_CONFIGURATION={
            **settings.CLAMAV_CONFIGURATION,
            "address": "hey.this-is-likely-not-a-valid-clamav-server.com:3310",
            "timeout": 2,
        },
    )
    def test_update_vaccine_request_form_scan_connection_error(self):
        # Prepare vaccine request form with a clean file
        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()

            vaccine_request_form_clean = pm.VaccineRequestForm.objects.create(
                campaign=self.campaign_rdc_1,
                vaccine_type=pm.VACCINES[0][0],
                date_vrf_signature="2024-01-01",
                date_vrf_reception="2024-01-02",
                date_dg_approval="2024-01-03",
                quantities_ordered_in_doses=500,
                file_scan_status=VirusScanStatus.CLEAN,
                file_last_scan=datetime.datetime(2021, 10, 9, 16, 45, 27, tzinfo=datetime.timezone.utc),
                file=SimpleUploadedFile(
                    name="clean_file.pdf",
                    content=safe_file_content,
                    content_type="application/pdf",
                ),
            )
            vaccine_request_form_clean.rounds.set([self.campaign_rdc_1_round_1])

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()
            data = {
                "quantities_ordered_in_doses": 600,
                "file": SimpleUploadedFile(
                    name="infected_file.pdf",
                    content=infected_file_content,
                    content_type="application/pdf",
                ),
            }

        self.client.force_authenticate(self.user_rw_perm)
        response = self.client.patch(
            f"{self.BASE_URL}{vaccine_request_form_clean.id}/",
            data=data,
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        vaccine_request_form_clean.refresh_from_db()
        self.assertEqual(vaccine_request_form_clean.file_scan_status, VirusScanStatus.ERROR)
        self.assertIsNone(vaccine_request_form_clean.file_last_scan)
        self.assertEqual(vaccine_request_form_clean.quantities_ordered_in_doses, 600)


class MockResults:
    def __init__(self, state, details, passed):
        self.state = state
        self.details = details
        self.passed = passed
