import datetime

from collections import OrderedDict
from unittest.mock import MagicMock, patch

import time_machine

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status

from hat import settings
from iaso.test import MockClamavScanResults
from iaso.utils.virus_scan.model import VirusScanStatus
from plugins.polio import models as pm
from plugins.polio.tests.api.vaccine_supply_chain.base import BaseVaccineSupplyChainAPITestCase


class PreAlertVirusScanAPITestCase(BaseVaccineSupplyChainAPITestCase):
    DT = datetime.datetime(2024, 10, 9, 16, 45, 27, tzinfo=datetime.timezone.utc)
    SAFE_FILE_PATH = "plugins/polio/tests/fixtures/virus_scan/safe_file.pdf"
    INFECTED_FILE_PATH = "plugins/polio/tests/fixtures/virus_scan/infected_file.pdf"

    def _format_multi_part_data(self, data_to_format):
        # Flatten the list into a bracketed dict e.g.
        # pre_alerts[0].date_pre_alert_reception: 2021-01-01
        # pre_alerts[1].file: <document_bytes>
        data = OrderedDict()
        for index, alert in enumerate(data_to_format):
            for key, value in alert.items():
                data[f"pre_alerts[{index}].{key}"] = value
        return data

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_create_pre_alert_with_safe_and_infected_files(self, mock_get_scanner):
        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.side_effect = [
            MockClamavScanResults(
                state="OK",
                details=None,
                passed=True,
            ),
            MockClamavScanResults(
                state="FOUND",
                details="Virus found :(",
                passed=False,
            ),
        ]
        mock_get_scanner.return_value = mock_scanner

        # Use a non-admin user
        self.client.force_authenticate(self.user_ro_perm)

        # Get the first request form
        request_form = pm.VaccineRequestForm.objects.first()

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            with open(self.SAFE_FILE_PATH, "rb") as safe_file:
                safe_file_content = safe_file.read()

                new_pre_alert_1_po_number = "1"
                new_pre_alert_2_po_number = "2"

                pre_alert_data = [
                    {
                        "date_pre_alert_reception": "2021-01-01",
                        "estimated_arrival_time": "2021-01-02",
                        "doses_shipped": 20,
                        "doses_per_vial": 50,
                        "vials_shipped": 1,
                        "po_number": new_pre_alert_1_po_number,
                        "file": SimpleUploadedFile(
                            name="safe_file.pdf",
                            content=safe_file_content,
                            content_type="application/pdf",
                        ),
                    },
                    {
                        "date_pre_alert_reception": "2021-01-01",
                        "estimated_arrival_time": "2021-01-02",
                        "doses_shipped": 30,
                        "doses_per_vial": 50,
                        "vials_shipped": 1,
                        "po_number": new_pre_alert_2_po_number,
                        "file": SimpleUploadedFile(
                            name="infected_file.pdf",
                            content=infected_file_content,
                            content_type="application/pdf",
                        ),
                    },
                ]

                # Non-admin can create pre-alert
                response = self.client.post(
                    f"{self.BASE_URL}{request_form.id}/add_pre_alerts/",
                    data=self._format_multi_part_data(pre_alert_data),
                    format="multipart",
                    headers={"accept": "application/json"},
                )

        response_json = self.assertJSONResponse(response, 201)

        self.assertEqual(len(response_json["pre_alerts"]), 2)

        pre_alert_1 = (
            pm.VaccinePreAlert.objects.filter(po_number=new_pre_alert_1_po_number, request_form=request_form.id)
            .order_by("-id")
            .first()
        )
        self.assertIsNotNone(pre_alert_1)
        pre_alert_1.refresh_from_db()
        self.assertEqual(pre_alert_1.file_last_scan, self.DT)
        self.assertEqual(pre_alert_1.file_scan_status, VirusScanStatus.CLEAN)

        pre_alert_2 = (
            pm.VaccinePreAlert.objects.filter(po_number=new_pre_alert_2_po_number, request_form=request_form.id)
            .order_by("-id")
            .first()
        )
        pre_alert_2.refresh_from_db()
        self.assertIsNotNone(pre_alert_2)
        self.assertEqual(pre_alert_2.file_scan_status, VirusScanStatus.INFECTED)
        self.assertEqual(pre_alert_2.file_last_scan, self.DT)

    def test_create_pre_alert_without_scanning(self):
        # Use a non-admin user
        self.client.force_authenticate(self.user_ro_perm)

        # Get the first request form
        request_form = pm.VaccineRequestForm.objects.first()

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            new_pre_alert_po_number = "1"
            pre_alert_data = [
                {
                    "date_pre_alert_reception": "2021-01-01",
                    "estimated_arrival_time": "2021-01-02",
                    "doses_shipped": 20,
                    "doses_per_vial": 50,
                    "vials_shipped": 1,
                    "po_number": new_pre_alert_po_number,
                    "file": SimpleUploadedFile(
                        name="infected_file.pdf",
                        content=infected_file_content,
                        content_type="application/pdf",
                    ),
                },
            ]

            # Non-admin can create pre-alert
            response = self.client.post(
                f"{self.BASE_URL}{request_form.id}/add_pre_alerts/",
                data=self._format_multi_part_data(pre_alert_data),
                format="multipart",
                headers={"accept": "application/json"},
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response_json = response.json()
        self.assertEqual(len(response_json["pre_alerts"]), 1)

        pre_alert = (
            pm.VaccinePreAlert.objects.filter(po_number=new_pre_alert_po_number, request_form=request_form.id)
            .order_by("-id")
            .first()
        )
        self.assertIsNotNone(pre_alert)
        self.assertEqual(pre_alert.file_scan_status, VirusScanStatus.PENDING)
        self.assertIsNone(pre_alert.file_last_scan)

    @override_settings(
        CLAMAV_ACTIVE=True,
        CLAMAV_CONFIGURATION={
            **settings.CLAMAV_CONFIGURATION,
            "address": "hey.this-is-likely-not-a-valid-clamav-server.com:3310",
            "timeout": 2,
        },
    )
    def test_create_pre_alert_scan_connection_error(self):
        # Use a non-admin user
        self.client.force_authenticate(self.user_ro_perm)

        # Get the first request form
        request_form = pm.VaccineRequestForm.objects.first()

        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            new_pre_alert_po_number = "1"
            pre_alert_data = [
                {
                    "date_pre_alert_reception": "2021-01-01",
                    "estimated_arrival_time": "2021-01-02",
                    "doses_shipped": 20,
                    "doses_per_vial": 50,
                    "vials_shipped": 1,
                    "po_number": new_pre_alert_po_number,
                    "file": SimpleUploadedFile(
                        name="infected_file.pdf",
                        content=infected_file_content,
                        content_type="application/pdf",
                    ),
                },
            ]

            # Non-admin can create pre-alert
            response = self.client.post(
                f"{self.BASE_URL}{request_form.id}/add_pre_alerts/",
                data=self._format_multi_part_data(pre_alert_data),
                format="multipart",
                headers={"accept": "application/json"},
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response_json = response.json()
        self.assertEqual(len(response_json["pre_alerts"]), 1)

        pre_alert = (
            pm.VaccinePreAlert.objects.filter(po_number=new_pre_alert_po_number, request_form=request_form.id)
            .order_by("-id")
            .first()
        )
        self.assertIsNotNone(pre_alert)
        self.assertEqual(pre_alert.file_scan_status, VirusScanStatus.ERROR)
        self.assertIsNone(pre_alert.file_last_scan)

    def test_retrieve_pre_alerts_with_various_statuses(self):
        request_form = pm.VaccineRequestForm.objects.first()

        # Create pre alerts with various statuses
        with open(self.INFECTED_FILE_PATH, "rb") as file:
            file_content = file.read()

            pre_alert_safe = pm.VaccinePreAlert.objects.create(
                request_form=request_form,
                date_pre_alert_reception="2021-10-09",
                po_number="1",
                file_scan_status=VirusScanStatus.CLEAN,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="safe_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )
            pre_alert_infected = pm.VaccinePreAlert.objects.create(
                request_form=request_form,
                date_pre_alert_reception="2021-10-09",
                po_number="2",
                file_scan_status=VirusScanStatus.INFECTED,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="infected_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )
            pre_alert_pending = pm.VaccinePreAlert.objects.create(
                request_form=request_form,
                date_pre_alert_reception="2021-10-09",
                po_number="3",
                file_scan_status=VirusScanStatus.PENDING,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="pending_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )
            pre_alert_error = pm.VaccinePreAlert.objects.create(
                request_form=request_form,
                date_pre_alert_reception="2021-10-09",
                po_number="4",
                file_scan_status=VirusScanStatus.ERROR,
                file_last_scan=self.DT,
                file=SimpleUploadedFile(
                    name="error_file.pdf",
                    content=file_content,
                    content_type="application/pdf",
                ),
            )

        # Use a non-admin user
        self.client.force_authenticate(self.user_ro_perm)

        response = self.client.get(f"{self.BASE_URL}{request_form.id}/get_pre_alerts/?order=id")
        data = response.json()["pre_alerts"]
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(data), 4)

        self.assertEqual(data[0]["id"], pre_alert_safe.id)
        self.assertEqual(data[0]["scan_result"], VirusScanStatus.CLEAN)
        self.assertEqual(data[0]["scan_timestamp"], self.DT.timestamp())

        self.assertEqual(data[1]["id"], pre_alert_infected.id)
        self.assertEqual(data[1]["scan_result"], VirusScanStatus.INFECTED)
        self.assertEqual(data[1]["scan_timestamp"], self.DT.timestamp())

        self.assertEqual(data[2]["id"], pre_alert_pending.id)
        self.assertEqual(data[2]["scan_result"], VirusScanStatus.PENDING)
        self.assertEqual(data[2]["scan_timestamp"], self.DT.timestamp())

        self.assertEqual(data[3]["id"], pre_alert_error.id)
        self.assertEqual(data[3]["scan_result"], VirusScanStatus.ERROR)
        self.assertEqual(data[3]["scan_timestamp"], self.DT.timestamp())

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_update_pre_alert_with_safe_file(self, mock_get_scanner):
        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockClamavScanResults(
            state="OK",
            details=None,
            passed=True,
        )
        mock_get_scanner.return_value = mock_scanner

        request_form = pm.VaccineRequestForm.objects.first()

        # Prepare pre alert with an infected file
        with open(self.INFECTED_FILE_PATH, "rb") as infected_file:
            infected_file_content = infected_file.read()

            pre_alert_infected = pm.VaccinePreAlert.objects.create(
                request_form=request_form,
                date_pre_alert_reception="2021-10-09",
                po_number="1",
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
            pre_alert_data = [
                {
                    "id": pre_alert_infected.id,
                    "estimated_arrival_time": "2021-01-02",
                    "doses_shipped": 20,
                    "doses_per_vial": 50,
                    "vials_shipped": 1,
                    "file": SimpleUploadedFile(
                        name="safe_file.pdf",
                        content=safe_file_content,
                        content_type="application/pdf",
                    ),
                },
            ]

        self.client.force_authenticate(self.user_rw_perm)
        response = self.client.patch(
            f"{self.BASE_URL}{request_form.id}/update_pre_alerts/",
            data=self._format_multi_part_data(pre_alert_data),
            format="multipart",
            headers={"accept": "application/json"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        pre_alert_infected.refresh_from_db()
        self.assertEqual(pre_alert_infected.file_scan_status, VirusScanStatus.CLEAN)
        self.assertEqual(pre_alert_infected.file_last_scan, self.DT)
        self.assertEqual(pre_alert_infected.doses_shipped, 20)

    @time_machine.travel(DT, tick=False)
    @override_settings(CLAMAV_ACTIVE=True)
    @patch("clamav_client.get_scanner")
    def test_update_pre_alert_with_infected_file(self, mock_get_scanner):
        # Mocking ClamAV scanner
        mock_scanner = MagicMock()
        mock_scanner.scan.return_value = MockClamavScanResults(
            state="FOUND",
            details="Virus found :(",
            passed=False,
        )
        mock_get_scanner.return_value = mock_scanner

        request_form = pm.VaccineRequestForm.objects.first()

        # Prepare pre alert with a clean file
        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()

            pre_alert_clean = pm.VaccinePreAlert.objects.create(
                request_form=request_form,
                date_pre_alert_reception="2021-10-09",
                po_number="1",
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
            pre_alert_data = [
                {
                    "id": pre_alert_clean.id,
                    "estimated_arrival_time": "2021-01-02",
                    "doses_shipped": 20,
                    "doses_per_vial": 50,
                    "vials_shipped": 1,
                    "file": SimpleUploadedFile(
                        name="infected_file.pdf",
                        content=infected_file_content,
                        content_type="application/pdf",
                    ),
                },
            ]

        self.client.force_authenticate(self.user_rw_perm)
        response = self.client.patch(
            f"{self.BASE_URL}{request_form.id}/update_pre_alerts/",
            data=self._format_multi_part_data(pre_alert_data),
            format="multipart",
            headers={"accept": "application/json"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        pre_alert_clean.refresh_from_db()
        self.assertEqual(pre_alert_clean.file_scan_status, VirusScanStatus.INFECTED)
        self.assertEqual(pre_alert_clean.file_last_scan, self.DT)
        self.assertEqual(pre_alert_clean.doses_shipped, 20)

    def test_update_pre_alert_without_scanning(self):
        request_form = pm.VaccineRequestForm.objects.first()

        # Prepare pre alert with a clean file
        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()

            pre_alert_clean = pm.VaccinePreAlert.objects.create(
                request_form=request_form,
                date_pre_alert_reception="2021-10-09",
                po_number="1",
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
            pre_alert_data = [
                {
                    "id": pre_alert_clean.id,
                    "estimated_arrival_time": "2021-01-02",
                    "doses_shipped": 20,
                    "doses_per_vial": 50,
                    "vials_shipped": 1,
                    "file": SimpleUploadedFile(
                        name="infected_file.pdf",
                        content=infected_file_content,
                        content_type="application/pdf",
                    ),
                },
            ]

        self.client.force_authenticate(self.user_rw_perm)
        response = self.client.patch(
            f"{self.BASE_URL}{request_form.id}/update_pre_alerts/",
            data=self._format_multi_part_data(pre_alert_data),
            format="multipart",
            headers={"accept": "application/json"},
        )

        response = self.assertJSONResponse(response, 200)

        pre_alert_clean.refresh_from_db()

        self.assertEqual(response["pre_alerts"][0]["scan_result"], VirusScanStatus.PENDING)
        self.assertEqual(pre_alert_clean.file_scan_status, VirusScanStatus.PENDING)
        self.assertIsNone(pre_alert_clean.file_last_scan)
        self.assertEqual(pre_alert_clean.doses_shipped, 20)

    @override_settings(
        CLAMAV_ACTIVE=True,
        CLAMAV_CONFIGURATION={
            **settings.CLAMAV_CONFIGURATION,
            "address": "hey.this-is-likely-not-a-valid-clamav-server.com:3310",
            "timeout": 2,
        },
    )
    def test_update_pre_alert_scan_connection_error(self):
        request_form = pm.VaccineRequestForm.objects.first()

        # Prepare pre alert with a clean file
        with open(self.SAFE_FILE_PATH, "rb") as safe_file:
            safe_file_content = safe_file.read()

            pre_alert_clean = pm.VaccinePreAlert.objects.create(
                request_form=request_form,
                date_pre_alert_reception="2021-10-09",
                po_number="1",
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
            pre_alert_data = [
                {
                    "id": pre_alert_clean.id,
                    "estimated_arrival_time": "2021-01-02",
                    "doses_shipped": 20,
                    "doses_per_vial": 50,
                    "vials_shipped": 1,
                    "file": SimpleUploadedFile(
                        name="infected_file.pdf",
                        content=infected_file_content,
                        content_type="application/pdf",
                    ),
                },
            ]

        self.client.force_authenticate(self.user_rw_perm)
        response = self.client.patch(
            f"{self.BASE_URL}{request_form.id}/update_pre_alerts/",
            data=self._format_multi_part_data(pre_alert_data),
            format="multipart",
            headers={"accept": "application/json"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        pre_alert_clean.refresh_from_db()
        self.assertEqual(pre_alert_clean.file_scan_status, VirusScanStatus.ERROR)
        self.assertIsNone(pre_alert_clean.file_last_scan)
        self.assertEqual(pre_alert_clean.doses_shipped, 20)
