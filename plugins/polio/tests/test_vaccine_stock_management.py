import datetime

import jsonschema
import time_machine

from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from plugins.polio import models as pm
from plugins.polio.models import OutgoingStockMovement
from plugins.polio.models.base import VaccineStockCalculator
from plugins.polio.tests.vaccine_stocks_setup_data import VaccineStockManagementAPITestBase


BASE_URL = "/api/polio/vaccine/vaccine_stock/"

BASE_URL_SUB_RESOURCES = "/api/polio/vaccine/stock/"

DT = datetime.datetime(2024, 10, 29, 14, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(DT, tick=False)
class VaccineStockManagementAPITestCase(VaccineStockManagementAPITestBase):
    def test_anonymous_user_cannot_see_list(self):
        self.client.force_authenticate(user=self.anon)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 403)

    def test_user_without_read_rights_cannot_see_list(self):
        self.client.force_authenticate(user=self.user_no_perms)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_can_see_list(self):
        # Test the vaccine stock list API
        self.client.force_authenticate(user=self.user_ro_perms)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 200)
        results = response.json()["results"]
        self.assertEqual(len(results), 3)
        stock = results[0]
        self.assertEqual(stock["country_name"], "Testland")
        self.assertEqual(stock["vaccine_type"], pm.VACCINES[0][0])
        self.assertEqual(stock["vials_received"], 20)  # 400 doses / 20 doses per vial
        self.assertEqual(stock["vials_used"], 10)
        self.assertEqual(
            stock["stock_of_usable_vials"], 23
        )  # 20 received - 13 used + 15 found in inventory -1 removed from inventory
        self.assertEqual(stock["stock_of_unusable_vials"], 27)
        # self.assertEqual(stock["stock_of_earmarked_vials"], 0)
        self.assertEqual(stock["vials_destroyed"], 3)  # 3 destroyed

        # Test new dose-related fields
        self.assertEqual(stock["doses_received"], 400)  # 20 vials * 20 doses per vial
        self.assertEqual(stock["doses_used"], 200)  # 10 vials * 20 doses per vial
        self.assertEqual(stock["stock_of_usable_doses"], 460)  # 23 vials * 20 doses per vial
        self.assertEqual(stock["stock_of_unusable_doses"], 540)  # 27 vials * 20 doses per vial
        self.assertEqual(stock["doses_destroyed"], 60)  # 3 vials * 20 doses per vial
        self.assertEqual(stock["stock_of_earmarked_doses"], 0)  # No earmarked stock in test data

    def test_vaccine_stock_management_permissions_outgoing_stock_movement(self):
        # Use a non-admin user
        self.client.force_authenticate(self.user_ro_perms)

        # Non-admin can create outgoing stock movement
        osm_data = {
            "campaign": self.campaign.obr_name,
            "vaccine_stock": self.vaccine_stock.id,
            "report_date": "2024-01-01",
            "form_a_reception_date": "2024-01-02",
            "usable_vials_used": 50,
            "lot_numbers": ["LOT1", "LOT2"],
            "missing_vials": 2,
            "round": self.campaign_round_1.id,
            "comment": "Test OSM",
            "doses_per_vial": 20,
        }

        response = self.client.post(f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/", osm_data, format="json")
        self.assertEqual(response.status_code, 201)
        osm_id = response.data["id"]

        # Non-admin can edit within 7 days
        update_data = {"comment": "Updated comment"}
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{osm_id}/",
            update_data,
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        # Simulate passage of 8 days
        osm = pm.OutgoingStockMovement.objects.get(id=osm_id)
        osm.created_at = timezone.now() - datetime.timedelta(days=8)
        osm.save()

        # Non-admin cannot edit after 7 days
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{osm_id}/",
            update_data,
            format="json",
        )
        self.assertEqual(response.status_code, 403)

        # Switch to admin user
        self.client.force_authenticate(self.user_rw_perms)

        # Admin can edit regardless of time passed
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{osm_id}/",
            update_data,
            format="json",
        )
        self.assertEqual(response.status_code, 200)

        # Admin can delete regardless of time passed
        response = self.client.delete(f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{osm_id}/")
        self.assertEqual(response.status_code, 204)

    def test_outgoing_stock_movement_temporary_lifecycle_validation(self):
        self.client.force_authenticate(self.user_rw_perms)

        payload_temp_form_a = {
            "campaign": self.campaign.obr_name,
            "vaccine_stock": self.vaccine_stock.id,
            "status": "temporary",
            "report_date": "2024-01-01",
            "usable_vials_used": 50,
            "lot_numbers": ["LOT1", "LOT2"],
            "round": self.campaign_round_1.id,
            "comment": "Temporary Form A",
            "doses_per_vial": 20,
        }

        response = self.client.post(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
            payload_temp_form_a,
            format="json",
        )
        data = self.assertJSONResponse(response, 201)
        self.assertEqual(data["status"], "temporary")
        self.assertIsNone(data["form_a_reception_date"])

        payload_temp_form_a_with_date = {
            **payload_temp_form_a,
            "form_a_reception_date": "2024-01-02",
        }
        response = self.client.post(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
            payload_temp_form_a_with_date,
            format="json",
        )
        data = self.assertJSONResponse(response, 400)
        self.assertIn("form_a_reception_date", data)

        with open("plugins/polio/tests/fixtures/virus_scan/safe_file.pdf", "rb") as safe_file:
            response = self.client.post(
                f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
                {
                    **payload_temp_form_a,
                    "file": safe_file,
                },
                format="multipart",
            )
        data = self.assertJSONResponse(response, 400)
        self.assertIn("file", data)

        payload_received_form_a = {
            **payload_temp_form_a,
            "status": "received",
        }
        response = self.client.post(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
            payload_received_form_a,
            format="json",
        )
        data = self.assertJSONResponse(response, 400)
        self.assertIn("form_a_reception_date", data)

    def test_non_admin_user_can_complete_temporary_form_allowed_fields_after_edit_window(self):
        self.client.force_authenticate(self.user_ro_perms)

        response = self.client.post(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
            {
                "campaign": self.campaign.obr_name,
                "vaccine_stock": self.vaccine_stock.id,
                "status": "temporary",
                "report_date": "2024-01-01",
                "usable_vials_used": 50,
                "lot_numbers": ["LOT1"],
                "round": self.campaign_round_1.id,
                "comment": "Temporary draft",
                "doses_per_vial": 20,
            },
            format="json",
        )
        form_a = self.assertJSONResponse(response, 201)
        form_a_id = form_a["id"]

        object = pm.OutgoingStockMovement.objects.get(id=form_a_id)
        object.created_at = timezone.now() - datetime.timedelta(days=8)
        object.save()

        allowed_payload = {
            "status": "received",
            "form_a_reception_date": "2024-01-02",
            "comment": "Finalized after reception",
        }

        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{form_a_id}/",
            {
                **allowed_payload,
                "usable_vials_used": 60,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{form_a_id}/",
            allowed_payload,
            format="json",
        )
        data = self.assertJSONResponse(response, 200)
        self.assertEqual(data["status"], "received")
        self.assertEqual(data["form_a_reception_date"], "2024-01-02")

    def test_edit_access_and_within_edit_window_lifecycle(self):
        """
        The serialized ``edit_access`` field drives both the Edit-button gate in
        the UI table (``!= "none"``) and the in-modal state machine (``"full"``
        unlocks every field, ``"completion_only"`` restricts to the completion
        allowlist). ``within_edit_window`` is a plain boolean the frontend uses
        to gate the status toggle (received → temporary is only valid within the
        window).

        Within the window both fields are true/full for writers; past the window
        ``within_edit_window`` flips to False while ``edit_access`` follows the
        existing permission matrix.
        """
        self.client.force_authenticate(self.user_ro_perms)

        response = self.client.post(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
            {
                "campaign": self.campaign.obr_name,
                "vaccine_stock": self.vaccine_stock.id,
                "status": "temporary",
                "report_date": "2024-01-01",
                "usable_vials_used": 50,
                "lot_numbers": ["LOT1"],
                "round": self.campaign_round_1.id,
                "comment": "Temporary draft",
                "doses_per_vial": 20,
            },
            format="json",
        )
        temporary_id = self.assertJSONResponse(response, 201)["id"]

        response = self.client.post(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
            {
                "campaign": self.campaign.obr_name,
                "vaccine_stock": self.vaccine_stock.id,
                "status": "received",
                "report_date": "2024-01-01",
                "form_a_reception_date": "2024-01-02",
                "usable_vials_used": 10,
                "lot_numbers": ["LOT2"],
                "round": self.campaign_round_1.id,
                "comment": "Received",
                "doses_per_vial": 20,
            },
            format="json",
        )
        received_id = self.assertJSONResponse(response, 201)["id"]

        def fetch_row_fields_by_id(user):
            self.client.force_authenticate(user)
            get_response = self.client.get(
                f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/"
                f"?vaccine_stock={self.vaccine_stock.pk}&page=1&limit=50"
            )
            payload = self.assertJSONResponse(get_response, 200)
            return {
                row["id"]: {"edit_access": row["edit_access"], "within_edit_window": row["within_edit_window"]}
                for row in payload["results"]
            }

        # --- Within the edit window (freshly created) ---
        within_window = fetch_row_fields_by_id(self.user_ro_perms)
        self.assertTrue(
            within_window[temporary_id]["within_edit_window"],
            msg="Freshly created rows must be within the edit window.",
        )
        self.assertTrue(within_window[received_id]["within_edit_window"])
        self.assertEqual(within_window[temporary_id]["edit_access"], "full")
        self.assertEqual(within_window[received_id]["edit_access"], "full")

        # --- Past the edit window ---
        pm.OutgoingStockMovement.objects.filter(id__in=[temporary_id, received_id]).update(
            created_at=timezone.now() - datetime.timedelta(days=8)
        )

        non_admin = fetch_row_fields_by_id(self.user_ro_perms)
        self.assertFalse(
            non_admin[temporary_id]["within_edit_window"],
            msg="Rows pushed past the edit window must report within_edit_window=False.",
        )
        self.assertFalse(non_admin[received_id]["within_edit_window"])
        self.assertEqual(
            non_admin[temporary_id]["edit_access"],
            "completion_only",
            msg="Non-admin writers on post-window temporary Form A must get completion_only access.",
        )
        self.assertEqual(
            non_admin[received_id]["edit_access"],
            "none",
            msg="Received Form A past the edit window must be locked for non-admin writers.",
        )

        admin = fetch_row_fields_by_id(self.user_rw_perms)
        self.assertFalse(admin[temporary_id]["within_edit_window"])
        self.assertFalse(admin[received_id]["within_edit_window"])
        self.assertEqual(admin[temporary_id]["edit_access"], "full")
        self.assertEqual(admin[received_id]["edit_access"], "full")

        read_only = fetch_row_fields_by_id(self.user_read_only_perms)
        self.assertFalse(read_only[temporary_id]["within_edit_window"])
        self.assertFalse(read_only[received_id]["within_edit_window"])
        self.assertEqual(read_only[temporary_id]["edit_access"], "none")
        self.assertEqual(read_only[received_id]["edit_access"], "none")

    def test_temporary_form_vials_are_immutable_on_update(self):
        """
        Usable vials cannot be updated on temporary Form A
        """
        self.client.force_authenticate(self.user_rw_perms)

        create_response = self.client.post(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
            {
                "campaign": self.campaign.obr_name,
                "vaccine_stock": self.vaccine_stock.id,
                "status": "temporary",
                "report_date": "2024-01-01",
                "usable_vials_used": 50,
                "lot_numbers": ["LOT1"],
                "round": self.campaign_round_1.id,
                "comment": "Temporary draft",
                "doses_per_vial": 20,
            },
            format="json",
        )
        form_a_id = self.assertJSONResponse(create_response, 201)["id"]

        update_response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{form_a_id}/",
            {"usable_vials_used": 55},
            format="json",
        )
        update_data = self.assertJSONResponse(update_response, 400)
        self.assertIn("usable_vials_used", update_data)

    def test_temporary_to_received_transition_allows_vials_update_within_edit_window(self):
        self.client.force_authenticate(self.user_rw_perms)

        response = self.client.post(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
            {
                "campaign": self.campaign.obr_name,
                "vaccine_stock": self.vaccine_stock.id,
                "status": "temporary",
                "report_date": "2024-01-01",
                "usable_vials_used": 50,
                "lot_numbers": ["LOT1"],
                "round": self.campaign_round_1.id,
                "comment": "Temporary draft",
                "doses_per_vial": 20,
            },
            format="json",
        )
        form_a_id = self.assertJSONResponse(response, 201)["id"]

        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{form_a_id}/",
            {
                "status": "received",
                "form_a_reception_date": "2024-01-02",
                "usable_vials_used": 55,
            },
            format="json",
        )
        data = self.assertJSONResponse(response, 200)
        self.assertEqual(data["status"], "received")
        self.assertEqual(data["usable_vials_used"], 55)

    def test_admin_gets_serializer_guardrail_error_on_temporary_non_allowlisted_fields_after_edit_window(self):
        self.client.force_authenticate(self.user_rw_perms)

        response = self.client.post(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
            {
                "campaign": self.campaign.obr_name,
                "vaccine_stock": self.vaccine_stock.id,
                "status": "temporary",
                "report_date": "2024-01-01",
                "usable_vials_used": 50,
                "lot_numbers": ["LOT1"],
                "round": self.campaign_round_1.id,
                "comment": "Temporary draft",
                "doses_per_vial": 20,
            },
            format="json",
        )
        form_a_id = self.assertJSONResponse(response, 201)["id"]

        form_a = pm.OutgoingStockMovement.objects.get(id=form_a_id)
        form_a.created_at = timezone.now() - datetime.timedelta(days=8)
        form_a.save()

        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{form_a_id}/",
            {"lot_numbers": ["LOT1", "LOT2"]},
            format="json",
        )
        data = self.assertJSONResponse(response, 400)
        self.assertIn("error", data)

    def test_received_to_temporary_after_edit_window_enforces_allowlist_with_400(self):
        self.client.force_authenticate(self.user_rw_perms)

        response = self.client.post(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
            {
                "campaign": self.campaign.obr_name,
                "vaccine_stock": self.vaccine_stock.id,
                "status": "received",
                "report_date": "2024-01-01",
                "form_a_reception_date": "2024-01-02",
                "usable_vials_used": 50,
                "lot_numbers": ["LOT1"],
                "round": self.campaign_round_1.id,
                "comment": "Received form",
                "doses_per_vial": 20,
            },
            format="json",
        )
        form_a_id = self.assertJSONResponse(response, 201)["id"]

        form_a = pm.OutgoingStockMovement.objects.get(id=form_a_id)
        form_a.created_at = timezone.now() - datetime.timedelta(days=8)
        form_a.save()

        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{form_a_id}/",
            {
                "status": "temporary",
                "report_date": "2024-01-03",
            },
            format="json",
        )
        data = self.assertJSONResponse(response, 400)
        self.assertIn("error", data)

    def test_received_to_temporary_transition_clears_file_and_reception_date(self):
        self.client.force_authenticate(self.user_rw_perms)

        with open("plugins/polio/tests/fixtures/virus_scan/safe_file.pdf", "rb") as safe_file:
            response = self.client.post(
                f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
                {
                    "campaign": self.campaign.obr_name,
                    "vaccine_stock": self.vaccine_stock.id,
                    "status": "received",
                    "report_date": "2024-01-01",
                    "form_a_reception_date": "2024-01-02",
                    "usable_vials_used": 50,
                    "lot_numbers": ["LOT1"],
                    "round": self.campaign_round_1.id,
                    "comment": "Received with file",
                    "doses_per_vial": 20,
                    "file": safe_file,
                },
                format="multipart",
            )
        form_a_id = self.assertJSONResponse(response, 201)["id"]

        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{form_a_id}/",
            {"status": "temporary"},
            format="json",
        )
        data = self.assertJSONResponse(response, 200)
        self.assertEqual(data["status"], "temporary")
        self.assertIsNone(data["form_a_reception_date"])
        self.assertIsNone(data["file"])

    def test_form_a_reception_date_required_when_switching_temporary_to_received(self):
        self.client.force_authenticate(self.user_rw_perms)

        create_response = self.client.post(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
            {
                "campaign": self.campaign.obr_name,
                "vaccine_stock": self.vaccine_stock.id,
                "status": "temporary",
                "report_date": "2024-01-01",
                "usable_vials_used": 50,
                "lot_numbers": ["LOT1"],
                "round": self.campaign_round_1.id,
                "comment": "Temporary draft",
                "doses_per_vial": 20,
            },
            format="json",
        )
        form_a_id = self.assertJSONResponse(create_response, 201)["id"]

        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{form_a_id}/",
            {"status": "received"},
            format="json",
        )
        data = self.assertJSONResponse(response, 400)
        self.assertIn("form_a_reception_date", data)

    def test_non_allowlisted_fields_can_be_edited_on_temporary_form_within_edit_window(self):
        self.client.force_authenticate(self.user_ro_perms)

        response = self.client.post(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
            {
                "campaign": self.campaign.obr_name,
                "vaccine_stock": self.vaccine_stock.id,
                "status": "temporary",
                "report_date": "2024-01-01",
                "usable_vials_used": 50,
                "lot_numbers": ["LOT1"],
                "round": self.campaign_round_1.id,
                "comment": "Temporary draft",
                "doses_per_vial": 20,
            },
            format="json",
        )
        form_a = self.assertJSONResponse(response, 201)
        form_a_id = form_a["id"]
        base_url = f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{form_a_id}/"

        non_allowlisted_payloads_and_expected_statuses = [
            ({"campaign": self.campaign.obr_name}, 200),
            ({"vaccine_stock": self.vaccine_stock.id}, 200),
            ({"report_date": "2024-01-03"}, 200),
            ({"usable_vials_used": 55}, 400),  # blocked by temporary-vials immutability rule
            ({"lot_numbers": ["LOT1", "LOT2"]}, 200),
            ({"round": self.campaign_round_1.id}, 200),
            ({"doses_per_vial": 10}, 200),
            ({"alternative_campaign": "Alternative Campaign"}, 400),  # blocked by campaign/non-obr exclusivity
        ]

        for payload, expected_status in non_allowlisted_payloads_and_expected_statuses:
            response = self.client.patch(base_url, payload, format="json")
            self.assertEqual(
                response.status_code,
                expected_status,
                msg=f"Unexpected status for payload {payload}",
            )

        data = self.assertJSONResponse(self.client.get(base_url), 200)
        self.assertEqual(data["lot_numbers"], ["LOT1", "LOT2"])

    def test_non_allowlisted_fields_are_blocked_on_temporary_form_after_edit_window(self):
        self.client.force_authenticate(self.user_ro_perms)

        response = self.client.post(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
            {
                "campaign": self.campaign.obr_name,
                "vaccine_stock": self.vaccine_stock.id,
                "status": "temporary",
                "report_date": "2024-01-01",
                "usable_vials_used": 50,
                "lot_numbers": ["LOT1"],
                "round": self.campaign_round_1.id,
                "comment": "Temporary draft",
                "doses_per_vial": 20,
            },
            format="json",
        )
        form_a = self.assertJSONResponse(response, 201)
        form_a_id = form_a["id"]

        object = pm.OutgoingStockMovement.objects.get(id=form_a_id)
        object.created_at = timezone.now() - datetime.timedelta(days=8)
        object.save()
        base_url = f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{form_a_id}/"

        non_allowlisted_payloads = [
            {"campaign": self.campaign.obr_name},
            {"vaccine_stock": self.vaccine_stock.id},
            {"report_date": "2024-01-03"},
            {"usable_vials_used": 55},
            {"lot_numbers": ["LOT1", "LOT2"]},
            {"round": self.campaign_round_1.id},
            {"doses_per_vial": 10},
            {"alternative_campaign": "Alternative Campaign"},
        ]

        for payload in non_allowlisted_payloads:
            response = self.client.patch(base_url, payload, format="json")
            self.assertEqual(response.status_code, 403, msg=f"Expected 403 for payload {payload}")

    def test_vaccine_stock_management_permissions_incident_report(self):
        # Use a non-admin user
        self.client.force_authenticate(self.user_ro_perms)

        # Non-admin can create incident report
        incident_data = {
            "vaccine_stock": self.vaccine_stock.id,
            "stock_correction": "broken",
            "date_of_incident_report": "2024-01-01",
            "incident_report_received_by_rrt": "2024-01-02",
            "unusable_vials": 5,
            "usable_vials": 0,
            "comment": "Test incident",
            "doses_per_vial": 20,
        }

        response = self.client.post(f"{BASE_URL_SUB_RESOURCES}incident_report/", incident_data, format="json")
        self.assertEqual(response.status_code, 201)
        incident_id = response.data["id"]

        # Non-admin can edit within 7 days
        update_data = {"comment": "Updated comment"}
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}incident_report/{incident_id}/",
            update_data,
            format="json",
        )
        self.assertEqual(response.status_code, 200)

        # Simulate passage of 8 days
        incident = pm.IncidentReport.objects.get(id=incident_id)
        incident.created_at = timezone.now() - datetime.timedelta(days=8)
        incident.save()

        # Non-admin cannot edit after 7 days
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}incident_report/{incident_id}/",
            update_data,
            format="json",
        )
        self.assertEqual(response.status_code, 403)

        # Switch to admin user
        self.client.force_authenticate(self.user_rw_perms)

        # Admin can edit regardless of time passed
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}incident_report/{incident_id}/",
            update_data,
            format="json",
        )
        self.assertEqual(response.status_code, 200)

        # Admin can delete regardless of time passed
        response = self.client.delete(f"{BASE_URL_SUB_RESOURCES}incident_report/{incident_id}/")
        self.assertEqual(response.status_code, 204)

    def test_vaccine_stock_management_permissions_destruction_report(self):
        # Use a non-admin user
        self.client.force_authenticate(self.user_ro_perms)

        # Non-admin can create destruction report
        destruction_data = {
            "vaccine_stock": self.vaccine_stock.id,
            "stock_correction": "destroyed",
            "destruction_report_date": "2024-01-01",
            "rrt_destruction_report_reception_date": "2024-01-02",
            "unusable_vials_destroyed": 5,
            "action": "Destroyed due to expiration",
            "comment": "Test destruction",
            "doses_per_vial": 20,
        }

        response = self.client.post(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/",
            destruction_data,
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        destruction_id = response.data["id"]

        # Non-admin can edit within 7 days
        update_data = {"comment": "Updated comment"}
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/{destruction_id}/",
            update_data,
            format="json",
        )
        self.assertEqual(response.status_code, 200)

        # Simulate passage of 8 days
        destruction = pm.DestructionReport.objects.get(id=destruction_id)
        destruction.created_at = timezone.now() - datetime.timedelta(days=8)
        destruction.save()

        # Non-admin cannot edit after 7 days
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/{destruction_id}/",
            update_data,
            format="json",
        )
        self.assertEqual(response.status_code, 403)

        # Switch to admin user
        self.client.force_authenticate(self.user_rw_perms)

        # Admin can edit regardless of time passed
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/{destruction_id}/",
            update_data,
            format="json",
        )
        self.assertEqual(response.status_code, 200)

        # Admin can delete regardless of time passed
        response = self.client.delete(f"{BASE_URL_SUB_RESOURCES}destruction_report/{destruction_id}/")
        self.assertEqual(response.status_code, 204)

    def test_usable_vials_endpoint(self):
        # Authenticate and make request to the API
        self.client.force_authenticate(user=self.user_ro_perms)
        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/usable_vials/")

        # Assert the response status code
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Define the JSON schema for the response
        usable_vials_schema = {
            "type": "object",
            "properties": {
                "results": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "date": {"type": "string"},
                            "action": {"type": "string"},
                            "vials_in": {"type": ["integer", "null"]},
                            "doses_in": {"type": ["integer", "null"]},
                            "vials_out": {"type": ["integer", "null"]},
                            "doses_out": {"type": ["integer", "null"]},
                            "type": {"type": "string"},
                        },
                        "required": [
                            "date",
                            "action",
                            "vials_in",
                            "doses_in",
                            "vials_out",
                            "doses_out",
                            "type",
                        ],
                    },
                },
            },
            "required": ["results"],
        }

        # Check that we have 6 entries in the results array
        self.assertEqual(len(data["results"]), 6)

        # Validate the response data against the schema
        try:
            jsonschema.validate(instance=data, schema=usable_vials_schema)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        # Default order should be `date ASC`.

        self.assertEqual(data["results"][0]["date"], "2024-10-23")
        self.assertEqual(data["results"][0]["vials_in"], 16)
        self.assertEqual(data["results"][0]["doses_in"], 320)
        self.assertEqual(data["results"][0]["type"], "incident_report")  # Physical inventory

        self.assertEqual(data["results"][1]["date"], "2024-10-23")
        self.assertEqual(data["results"][1]["vials_out"], 1)
        self.assertEqual(data["results"][1]["doses_out"], 20)
        self.assertEqual(data["results"][1]["type"], "incident_report")  # Physical inventory remove

        self.assertEqual(data["results"][2]["date"], "2024-10-24")
        self.assertEqual(data["results"][2]["vials_in"], 20)
        self.assertEqual(data["results"][2]["doses_in"], 400)
        self.assertEqual(data["results"][2]["type"], "vaccine_arrival_report")  # From arrival report

        self.assertEqual(data["results"][3]["date"], "2024-10-24")
        self.assertEqual(data["results"][3]["vials_out"], 1)
        self.assertEqual(data["results"][3]["doses_out"], 20)
        self.assertEqual(data["results"][3]["type"], "incident_report")  # Broken

        self.assertEqual(data["results"][4]["date"], "2024-10-25")
        self.assertEqual(data["results"][4]["vials_out"], 1)
        self.assertEqual(data["results"][4]["doses_out"], 20)
        self.assertEqual(data["results"][4]["type"], "incident_report")  # Expiry date

        self.assertEqual(data["results"][5]["date"], "2024-10-26")
        self.assertEqual(data["results"][5]["vials_out"], 10)
        self.assertEqual(data["results"][5]["doses_out"], 200)
        self.assertEqual(data["results"][5]["type"], "outgoing_stock_movement")  # Outgoing movement (form A)

        # Order by `vials_in DESC`.

        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/usable_vials/?order=-vials_in")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["results"]), 6)

        self.assertEqual(data["results"][0]["vials_in"], 20)
        self.assertEqual(data["results"][1]["vials_in"], 16)
        self.assertEqual(data["results"][2]["vials_in"], None)
        self.assertEqual(data["results"][3]["vials_in"], None)
        self.assertEqual(data["results"][4]["vials_in"], None)
        self.assertEqual(data["results"][5]["vials_in"], None)

        # Order by `vials_in ASC`.

        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/usable_vials/?order=vials_in")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["results"]), 6)

        self.assertEqual(data["results"][0]["vials_in"], None)
        self.assertEqual(data["results"][1]["vials_in"], None)
        self.assertEqual(data["results"][2]["vials_in"], None)
        self.assertEqual(data["results"][3]["vials_in"], None)
        self.assertEqual(data["results"][4]["vials_in"], 16)
        self.assertEqual(data["results"][5]["vials_in"], 20)

    def test_unusable_vials_endpoint(self):
        # Authenticate and make request to the API
        self.client.force_authenticate(user=self.user_ro_perms)
        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/get_unusable_vials/")

        # Assert the response status code
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Define the JSON schema for the response
        unusable_vials_schema = {
            "type": "object",
            "properties": {
                "results": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "date": {"type": "string"},
                            "action": {"type": "string"},
                            "vials_in": {"type": ["integer", "null"]},
                            "doses_in": {"type": ["integer", "null"]},
                            "vials_out": {"type": ["integer", "null"]},
                            "doses_out": {"type": ["integer", "null"]},
                            "type": {"type": "string"},
                        },
                        "required": [
                            "date",
                            "action",
                            "vials_in",
                            "doses_in",
                            "vials_out",
                            "doses_out",
                        ],
                    },
                },
            },
            "required": ["results"],
        }

        # Validate the response data against the schema
        try:
            jsonschema.validate(instance=data, schema=unusable_vials_schema)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        # Check that the response contains the expected number of unusable vials entries
        self.assertEqual(len(data["results"]), 5)

        # Default order should be `date ASC`.

        self.assertEqual(data["results"][0]["date"], "2024-10-23")
        self.assertEqual(data["results"][0]["vials_in"], 20)
        self.assertEqual(data["results"][0]["doses_in"], 400)
        self.assertEqual(data["results"][0]["type"], "incident_report")

        self.assertEqual(data["results"][1]["date"], "2024-10-23")
        self.assertEqual(data["results"][1]["vials_out"], 1)
        self.assertEqual(data["results"][1]["doses_out"], 20)
        self.assertEqual(data["results"][1]["type"], "incident_report")

        self.assertEqual(data["results"][2]["date"], "2024-10-25")
        self.assertEqual(data["results"][2]["vials_in"], 1)
        self.assertEqual(data["results"][2]["doses_in"], 20)
        self.assertEqual(data["results"][2]["type"], "incident_report")

        self.assertEqual(data["results"][3]["date"], "2024-10-26")
        self.assertEqual(data["results"][3]["vials_in"], 10)
        self.assertEqual(data["results"][3]["doses_in"], 200)
        self.assertEqual(data["results"][3]["type"], "outgoing_stock_movement")

        self.assertEqual(data["results"][4]["date"], "2024-10-29")
        self.assertEqual(data["results"][4]["vials_out"], 3)
        self.assertEqual(data["results"][4]["doses_out"], 60)
        self.assertEqual(data["results"][4]["type"], "destruction_report")

        # Order by `doses_in DESC`.

        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/get_unusable_vials/?order=-doses_in")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["results"]), 5)

        self.assertEqual(data["results"][0]["doses_in"], 400)
        self.assertEqual(data["results"][1]["doses_in"], 200)
        self.assertEqual(data["results"][2]["doses_in"], 20)
        self.assertEqual(data["results"][3]["doses_in"], None)
        self.assertEqual(data["results"][4]["doses_in"], None)

        # Order by `doses_in ASC`.

        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/get_unusable_vials/?order=doses_in")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["results"]), 5)

        self.assertEqual(data["results"][0]["doses_in"], None)
        self.assertEqual(data["results"][1]["doses_in"], None)
        self.assertEqual(data["results"][2]["doses_in"], 20)
        self.assertEqual(data["results"][3]["doses_in"], 200)
        self.assertEqual(data["results"][4]["doses_in"], 400)

    def test_summary_endpoint(self):
        # Authenticate as a user with read/write permissions
        self.client.force_authenticate(user=self.user_ro_perms)

        # Make a GET request to the summary endpoint
        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/summary/")

        # Check that the response status code is 200
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Check that the response data contains the expected keys
        summary_schema = {
            "type": "object",
            "properties": {
                "country_name": {"type": "string"},
                "vaccine_type": {"type": "string"},
                "total_usable_doses": {"type": "integer"},
                "total_unusable_doses": {"type": "integer"},
                "total_unusable_vials": {"type": "integer"},
                "total_earmarked_doses": {"type": "integer"},
            },
            "required": [
                "country_name",
                "vaccine_type",
                "total_usable_doses",
                "total_unusable_doses",
                "total_unusable_vials",
                "total_earmarked_doses",
            ],
        }

        # Validate the response data against the schema
        try:
            jsonschema.validate(instance=data, schema=summary_schema)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        # Check that the values match what is expected
        self.assertEqual(data["country_name"], self.vaccine_stock.country.name)
        self.assertEqual(data["vaccine_type"], self.vaccine_stock.vaccine)
        self.assertEqual(data["total_usable_doses"], 460)
        self.assertEqual(data["total_unusable_doses"], 540)
        self.assertEqual(data["total_unusable_vials"], 27)
        self.assertEqual(data["total_earmarked_doses"], 0)  # No earmarked stock in test data

    def test_delete(self):
        self.client.force_authenticate(self.user_rw_perms)
        response = self.client.delete(f"{BASE_URL}{self.vaccine_stock.pk}/")
        self.assertEqual(response.status_code, 204)
        self.assertIsNone(pm.VaccineStock.objects.filter(pk=self.vaccine_stock.pk).first())

    def test_incident_report_list(self):
        self.client.force_authenticate(self.user_rw_perms)

        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}incident_report/?vaccine_stock={self.vaccine_stock.pk}&page=1&limit=20"
        )

        # Check that the response status code is 200
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Check that the response data contains the expected keys
        self.assertIn("count", data)
        self.assertIn("results", data)

        # Check that the results list is not empty
        self.assertGreater(len(data["results"]), 0)

        # Validate the structure of the first result
        first_result = data["results"][0]
        expected_keys = {
            "id",
            "vaccine_stock",
            "date_of_incident_report",
            "usable_vials",
            "unusable_vials",
            "stock_correction",
        }
        self.assertTrue(expected_keys.issubset(first_result.keys()))

        # Check that the vaccine_stock in the results matches the requested vaccine_stock
        for result in data["results"]:
            self.assertEqual(result["vaccine_stock"], self.vaccine_stock.pk)

            # Add a new test which adds the order=date_of_incident_report and verify that the results are ordered by date_of_incident_report

    def test_incident_report_list_ordered_by_date(self):
        self.client.force_authenticate(self.user_rw_perms)

        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}incident_report/?vaccine_stock={self.vaccine_stock.pk}&page=1&limit=20&order=date_of_incident_report"
        )

        # Check that the response status code is 200
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Check that the response data contains the expected keys
        self.assertIn("count", data)
        self.assertIn("results", data)

        # Check that the results list is not empty
        self.assertGreater(len(data["results"]), 0)

        # Verify that the results are ordered by date_of_incident_report
        dates = [result["date_of_incident_report"] for result in data["results"]]
        self.assertEqual(dates, sorted(dates))

    def test_destruction_report_list(self):
        self.client.force_authenticate(self.user_rw_perms)

        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/?vaccine_stock={self.vaccine_stock.pk}&page=1&limit=20"
        )

        # Check that the response status code is 200
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Check that the response data contains the expected keys
        self.assertIn("count", data)
        self.assertIn("results", data)

        # Check that the results list is not empty
        self.assertGreater(len(data["results"]), 0)

        # Validate the structure of the first result
        first_result = data["results"][0]
        expected_keys = {
            "id",
            "vaccine_stock",
            "destruction_report_date",
            "rrt_destruction_report_reception_date",
            "action",
            "unusable_vials_destroyed",
            "lot_numbers",
        }
        self.assertTrue(expected_keys.issubset(first_result.keys()))

        # Check that the vaccine_stock in the results matches the requested vaccine_stock
        for result in data["results"]:
            self.assertEqual(result["vaccine_stock"], self.vaccine_stock.pk)

            # Add a new test which adds the order=date_of_incident_report and verify that the results are ordered by date_of_incident_report

    def test_destruction_report_list_ordered_by_date(self):
        self.client.force_authenticate(self.user_rw_perms)

        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/?vaccine_stock={self.vaccine_stock.pk}&page=1&limit=20&order=destruction_report_date"
        )

        # Check that the response status code is 200
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Check that the response data contains the expected keys
        self.assertIn("count", data)
        self.assertIn("results", data)

        # Check that the results list is not empty
        self.assertGreater(len(data["results"]), 0)

        # Verify that the results are ordered by date_of_incident_report
        dates = [result["destruction_report_date"] for result in data["results"]]
        self.assertEqual(dates, sorted(dates))

    def test_outgoing_stock_movement_list(self):
        self.client.force_authenticate(self.user_rw_perms)

        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/?vaccine_stock={self.vaccine_stock.pk}&page=1&limit=20"
        )

        # Check that the response status code is 200
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Check that the response data contains the expected keys
        self.assertIn("count", data)
        self.assertIn("results", data)

        # Check that the results list is not empty
        self.assertGreater(len(data["results"]), 0)

        # Validate the structure of the first result
        first_result = data["results"][0]
        expected_keys = {
            "id",
            "campaign",
            "vaccine_stock",
            "report_date",
            "form_a_reception_date",
            "usable_vials_used",
            "lot_numbers",
            "round",
        }
        self.assertTrue(expected_keys.issubset(first_result.keys()))

        # Check that the vaccine_stock in the results matches the requested vaccine_stock
        for result in data["results"]:
            self.assertEqual(result["vaccine_stock"], self.vaccine_stock.pk)

    def test_outgoing_stock_movement_list_ordered_by_date(self):
        self.client.force_authenticate(self.user_rw_perms)

        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/?vaccine_stock={self.vaccine_stock.pk}&page=1&limit=20&order=form_a_reception_date"
        )

        # Check that the response status code is 200
        self.assertEqual(response.status_code, 200)

        # Parse the response data
        data = response.json()

        # Check that the response data contains the expected keys
        self.assertIn("count", data)
        self.assertIn("results", data)

        # Check that the results list is not empty
        self.assertGreater(len(data["results"]), 0)

        # Verify that the results are ordered by date_of_incident_report
        dates = [result["form_a_reception_date"] for result in data["results"]]
        self.assertEqual(dates, sorted(dates))

    def test_outgoing_stock_movement_list_ordered_by_date_handles_null_reception_dates(self):
        self.client.force_authenticate(self.user_rw_perms)
        pm.OutgoingStockMovement.objects.create(
            campaign=self.campaign,
            vaccine_stock=self.vaccine_stock,
            status=OutgoingStockMovement.StatusChoices.TEMPORARY,
            report_date=self.now - datetime.timedelta(days=1),
            form_a_reception_date=None,
            usable_vials_used=3,
            doses_per_vial=20,
        )
        pm.OutgoingStockMovement.objects.create(
            campaign=self.campaign,
            vaccine_stock=self.vaccine_stock,
            status=OutgoingStockMovement.StatusChoices.RECEIVED,
            report_date=self.now - datetime.timedelta(days=2),
            form_a_reception_date=self.now.date() - datetime.timedelta(days=4),
            usable_vials_used=4,
            doses_per_vial=20,
        )
        pm.OutgoingStockMovement.objects.create(
            campaign=self.campaign,
            vaccine_stock=self.vaccine_stock,
            status=OutgoingStockMovement.StatusChoices.RECEIVED,
            report_date=self.now - datetime.timedelta(days=1),
            form_a_reception_date=self.now.date() - datetime.timedelta(days=1),
            usable_vials_used=5,
            doses_per_vial=20,
        )

        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/?vaccine_stock={self.vaccine_stock.pk}&page=1&limit=20&order=form_a_reception_date"
        )
        data = self.assertJSONResponse(response, 200)
        ids = [result["id"] for result in data["results"]]
        expected_ids = list(
            pm.OutgoingStockMovement.objects.filter(vaccine_stock=self.vaccine_stock)
            .order_by("form_a_reception_date")
            .values_list("id", flat=True)
        )
        self.assertEqual(ids, expected_ids)

        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/?vaccine_stock={self.vaccine_stock.pk}&page=1&limit=20&order=-form_a_reception_date"
        )
        data = self.assertJSONResponse(response, 200)
        ids = [result["id"] for result in data["results"]]
        expected_ids = list(
            pm.OutgoingStockMovement.objects.filter(vaccine_stock=self.vaccine_stock)
            .order_by("-form_a_reception_date")
            .values_list("id", flat=True)
        )
        self.assertEqual(ids, expected_ids)

    def test_documents_upload_and_download(self):
        self.client.force_authenticate(self.user_rw_perms)
        # Test creation and retrieval of OutgoingStockMovement with document via ORM

        # Define paths to the PDF files
        PDF_FILE_PATH = "testdata/test_pdf.pdf"

        with open(PDF_FILE_PATH, "rb") as pdf_file:
            pdf_file_content = pdf_file.read()

            # Test creation and retrieval of OutgoingStockMovement with document via ORM
            outgoing_stock_movement = pm.OutgoingStockMovement.objects.create(
                campaign=self.campaign,
                vaccine_stock=self.vaccine_stock,
                report_date=self.now,
                form_a_reception_date="2023-10-01",
                usable_vials_used=999,
                file=SimpleUploadedFile("document_path_1.pdf", pdf_file_content),
                doses_per_vial=20,
            )

            self.assertIn("document_path_1", outgoing_stock_movement.file.name)

            # Query the newly created OutgoingStockMovement via ORM
            queried_movement = pm.OutgoingStockMovement.objects.get(pk=outgoing_stock_movement.pk)
            self.assertEqual(queried_movement.usable_vials_used, 999)
            self.assertIn("document_path_1", queried_movement.file.name)

            # Query the newly created OutgoingStockMovement via API
            response = self.client.get(f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{outgoing_stock_movement.pk}/")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data["usable_vials_used"], 999)
            self.assertIn("path", response.data["file"])
            self.assertIn("name", response.data["file"])
            self.assertIn("document_path_1", response.data["file"]["name"])

            # Test creation and retrieval of IncidentReport with document via ORM
            incident_report = pm.IncidentReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                date_of_incident_report=self.now - datetime.timedelta(days=2),
                incident_report_received_by_rrt=self.now - datetime.timedelta(days=1),
                stock_correction=pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
                file=SimpleUploadedFile("document_path_2.pdf", pdf_file_content),
                unusable_vials=7,  # 1 vial will be moved from usable to unusable
                usable_vials=3,
                doses_per_vial=20,
            )

            self.assertIn("document_path_2", incident_report.file.name)

            # Query the newly created IncidentReport via ORM
            queried_incident = pm.IncidentReport.objects.get(pk=incident_report.pk)
            self.assertEqual(queried_incident.unusable_vials, 7)
            self.assertEqual(queried_incident.usable_vials, 3)
            self.assertIn("document_path_2", queried_incident.file.name)

            # Query the newly created IncidentReport via API
            response = self.client.get(f"{BASE_URL_SUB_RESOURCES}incident_report/{incident_report.pk}/")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data["unusable_vials"], 7)
            self.assertEqual(response.data["usable_vials"], 3)
            self.assertIn("path", response.data["file"])
            self.assertIn("name", response.data["file"])
            self.assertIn("document_path_2", response.data["file"]["name"])

            # Test creation and retrieval of DestructionReport with document via ORM
            destruction_report = pm.DestructionReport.objects.create(
                vaccine_stock=self.vaccine_stock,
                rrt_destruction_report_reception_date=self.now - datetime.timedelta(days=1),
                destruction_report_date=self.now,
                action="Destroyed due to expiration",
                file=SimpleUploadedFile(
                    "document_path_3.pdf",
                    pdf_file_content,
                    content_type="application/pdf",
                ),
                unusable_vials_destroyed=3,
                doses_per_vial=20,
            )

            self.assertIn("document_path_3", destruction_report.file.name)

            # Query the newly created DestructionReport via ORM
            queried_destruction = pm.DestructionReport.objects.get(pk=destruction_report.pk)
            self.assertEqual(queried_destruction.unusable_vials_destroyed, 3)
            self.assertEqual(queried_destruction.action, "Destroyed due to expiration")
            self.assertIn("document_path_3", queried_destruction.file.name)

            # Query the newly created DestructionReport via API
            response = self.client.get(f"{BASE_URL_SUB_RESOURCES}destruction_report/{destruction_report.pk}/")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data["unusable_vials_destroyed"], 3)
            self.assertEqual(response.data["action"], "Destroyed due to expiration")
            self.assertIn("path", response.data["file"])
            self.assertIn("name", response.data["file"])
            self.assertIn("document_path_3", response.data["file"]["name"])

            # Test creation and retrieval of OutgoingStockMovement with document via API
            data = {
                "campaign": self.campaign.obr_name,
                "vaccine_stock": self.vaccine_stock.pk,
                "form_a_reception_date": "2023-10-03",
                "report_date": "2023-10-04",
                "usable_vials_used": 999,
                "file": SimpleUploadedFile(
                    "document_path_4.pdf",
                    pdf_file_content,
                    content_type="application/pdf",
                ),
                "doses_per_vial": 20,
            }

            response = self.client.post(
                f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/",
                data=data,
                format="multipart",
            )

            self.assertEqual(response.status_code, 201)
            self.assertIn("path", response.data["file"])
            self.assertIn("name", response.data["file"])
            self.assertIn("document_path_4", response.data["file"]["name"])

            # Test creation and retrieval of IncidentReport with document via API
            data = {
                "vaccine_stock": self.vaccine_stock.pk,
                "date_of_incident_report": "2023-10-05",
                "incident_report_received_by_rrt": "2023-10-06",
                "stock_correction": pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
                "unusable_vials": 7,
                "usable_vials": 3,
                "file": SimpleUploadedFile(
                    "document_path_5.pdf",
                    pdf_file_content,
                    content_type="application/pdf",
                ),
                "doses_per_vial": 20,
            }

            response = self.client.post(
                f"{BASE_URL_SUB_RESOURCES}incident_report/",
                data=data,
                format="multipart",
            )

            self.assertEqual(response.status_code, 201)
            self.assertIn("path", response.data["file"])
            self.assertIn("name", response.data["file"])
            self.assertIn("document_path_5", response.data["file"]["name"])

            # Test creation and retrieval of DestructionReport with document via API
            data = {
                "vaccine_stock": self.vaccine_stock.pk,
                "rrt_destruction_report_reception_date": "2023-10-05",
                "destruction_report_date": "2023-10-06",
                "action": "Destroyed due to expiration",
                "unusable_vials_destroyed": 3,
                "file": SimpleUploadedFile(
                    "document_path_6.pdf",
                    pdf_file_content,
                    content_type="application/pdf",
                ),
                "doses_per_vial": 20,
            }

            response = self.client.post(
                f"{BASE_URL_SUB_RESOURCES}destruction_report/",
                data=data,
                format="multipart",
            )

            self.assertEqual(response.status_code, 201)
            self.assertIn("path", response.data["file"])
            self.assertIn("name", response.data["file"])
            self.assertIn("document_path_6", response.data["file"]["name"])

    def test_check_duplicate_destruction_report(self):
        self.client.force_authenticate(self.user_rw_perms)

        # Create a destruction report
        destruction_data = {
            "vaccine_stock": self.vaccine_stock.id,
            "destruction_report_date": "2024-01-01",
            "rrt_destruction_report_reception_date": "2024-01-02",
            "unusable_vials_destroyed": 5,
            "action": "Destroyed due to expiration",
            "doses_per_vial": 20,
        }

        response = self.client.post(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/",
            destruction_data,
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        destruction_report_id = response.json()["id"]

        # Test checking for duplicate with same details (without destruction_report_id)
        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/check_duplicate/",
            {
                "vaccine_stock": self.vaccine_stock.id,
                "destruction_report_date": "2024-01-01",
                "unusable_vials_destroyed": 5,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["duplicate_exists"])

        # Test checking for duplicate with same details but excluding current report
        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/check_duplicate/",
            {
                "vaccine_stock": self.vaccine_stock.id,
                "destruction_report_date": "2024-01-01",
                "unusable_vials_destroyed": 5,
                "destruction_report_id": destruction_report_id,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["duplicate_exists"])

        # Create a second destruction report with same details
        response = self.client.post(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/",
            destruction_data,
            format="json",
        )
        self.assertEqual(response.status_code, 201)

        # Test checking for duplicate while editing first report (should find second report)
        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/check_duplicate/",
            {
                "vaccine_stock": self.vaccine_stock.id,
                "destruction_report_date": "2024-01-01",
                "unusable_vials_destroyed": 5,
                "destruction_report_id": destruction_report_id,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["duplicate_exists"])

        # Test checking with different date
        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/check_duplicate/",
            {
                "vaccine_stock": self.vaccine_stock.id,
                "destruction_report_date": "2024-01-02",
                "unusable_vials_destroyed": 5,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["duplicate_exists"])

        # Test checking with different vials count
        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/check_duplicate/",
            {
                "vaccine_stock": self.vaccine_stock.id,
                "destruction_report_date": "2024-01-01",
                "unusable_vials_destroyed": 6,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["duplicate_exists"])

        # Test with missing parameters
        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/check_duplicate/",
            {
                "vaccine_stock": self.vaccine_stock.id,
                "destruction_report_date": "2024-01-01",
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

        # Test with invalid vaccine stock ID
        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/check_duplicate/",
            {
                "vaccine_stock": 99999,
                "destruction_report_date": "2024-01-01",
                "unusable_vials_destroyed": 5,
            },
        )
        self.assertEqual(response.status_code, 404)

        # Test permissions - anonymous user
        self.client.force_authenticate(user=self.anon)
        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/check_duplicate/",
            {
                "vaccine_stock": self.vaccine_stock.id,
                "destruction_report_date": "2024-01-01",
                "unusable_vials_destroyed": 5,
            },
        )
        self.assertEqual(response.status_code, 403)

        # Test permissions - user without read rights
        self.client.force_authenticate(user=self.user_no_perms)
        response = self.client.get(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/check_duplicate/",
            {
                "vaccine_stock": self.vaccine_stock.id,
                "destruction_report_date": "2024-01-01",
                "unusable_vials_destroyed": 5,
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_only_cannot_create(self):
        self.client.force_authenticate(user=self.user_read_only_perms)
        data = {
            "country": self.country.id,
            "vaccine": pm.VACCINES[0][0],
        }
        response = self.client.post(BASE_URL, data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_only_cannot_delete(self):
        self.client.force_authenticate(user=self.user_read_only_perms)
        response = self.client.delete(f"{BASE_URL}{self.vaccine_stock.pk}/")
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_only_can_see_list(self):
        self.client.force_authenticate(user=self.user_read_only_perms)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 200)
        results = response.json()["results"]
        self.assertEqual(len(results), 3)
        stock = results[0]
        self.assertEqual(stock["country_name"], "Testland")
        self.assertEqual(stock["vaccine_type"], pm.VACCINES[0][0])
        self.assertIsInstance(stock["vials_received"], int)
        self.assertIsInstance(stock["vials_used"], int)
        self.assertIsInstance(stock["stock_of_usable_vials"], int)
        self.assertIsInstance(stock["stock_of_unusable_vials"], int)
        self.assertIsInstance(stock["vials_destroyed"], int)

        # Test new dose-related fields are present and have correct types
        self.assertIsInstance(stock["doses_received"], int)
        self.assertIsInstance(stock["doses_used"], int)
        self.assertIsInstance(stock["stock_of_usable_doses"], int)
        self.assertIsInstance(stock["stock_of_unusable_doses"], int)
        self.assertIsInstance(stock["doses_destroyed"], int)
        self.assertIsInstance(stock["stock_of_earmarked_doses"], int)

    def test_user_with_read_only_cannot_create_outgoing_stock_movement(self):
        self.client.force_authenticate(user=self.user_read_only_perms)
        osm_data = {
            "campaign": self.campaign.obr_name,
            "vaccine_stock": self.vaccine_stock.id,
            "report_date": "2024-01-01",
            "form_a_reception_date": "2024-01-02",
            "usable_vials_used": 50,
            "lot_numbers": ["LOT1", "LOT2"],
            "missing_vials": 2,
            "round": self.campaign_round_1.id,
            "comment": "Test OSM",
            "doses_per_vial": 20,
        }
        response = self.client.post(f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/", osm_data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_only_cannot_create_incident_report(self):
        self.client.force_authenticate(user=self.user_read_only_perms)
        incident_data = {
            "vaccine_stock": self.vaccine_stock.id,
            "stock_correction": "broken",
            "date_of_incident_report": "2024-01-01",
            "incident_report_received_by_rrt": "2024-01-02",
            "unusable_vials": 5,
            "usable_vials": 0,
            "comment": "Test incident",
            "doses_per_vial": 20,
        }
        response = self.client.post(f"{BASE_URL_SUB_RESOURCES}incident_report/", incident_data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_only_cannot_create_destruction_report(self):
        self.client.force_authenticate(user=self.user_read_only_perms)
        destruction_data = {
            "vaccine_stock": self.vaccine_stock.id,
            "stock_correction": "destroyed",
            "destruction_report_date": "2024-01-01",
            "rrt_destruction_report_reception_date": "2024-01-02",
            "unusable_vials_destroyed": 5,
            "action": "Destroyed due to expiration",
            "comment": "Test destruction",
            "doses_per_vial": 20,
        }
        response = self.client.post(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/",
            destruction_data,
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_only_cannot_edit_outgoing_stock_movement(self):
        self.client.force_authenticate(user=self.user_read_only_perms)
        update_data = {"comment": "Updated comment"}
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{self.outgoing_stock_movement.id}/",
            update_data,
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_only_cannot_edit_incident_report(self):
        self.client.force_authenticate(user=self.user_read_only_perms)
        update_data = {"comment": "Updated comment"}
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}incident_report/{self.incident_report.id}/",
            update_data,
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_only_cannot_edit_destruction_report(self):
        self.client.force_authenticate(user=self.user_read_only_perms)
        update_data = {"comment": "Updated comment"}
        response = self.client.patch(
            f"{BASE_URL_SUB_RESOURCES}destruction_report/{self.destruction_report.id}/",
            update_data,
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_only_cannot_delete_outgoing_stock_movement(self):
        self.client.force_authenticate(user=self.user_read_only_perms)
        response = self.client.delete(
            f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{self.outgoing_stock_movement.id}/"
        )
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_only_cannot_delete_incident_report(self):
        self.client.force_authenticate(user=self.user_read_only_perms)
        response = self.client.delete(f"{BASE_URL_SUB_RESOURCES}incident_report/{self.incident_report.id}/")
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_only_cannot_delete_destruction_report(self):
        self.client.force_authenticate(user=self.user_read_only_perms)
        response = self.client.delete(f"{BASE_URL_SUB_RESOURCES}destruction_report/{self.destruction_report.id}/")
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_only_can_see_summary(self):
        self.client.force_authenticate(user=self.user_read_only_perms)
        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/summary/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["country_name"], self.vaccine_stock.country.name)
        self.assertEqual(data["vaccine_type"], self.vaccine_stock.vaccine)
        self.assertIsInstance(data["total_usable_doses"], int)
        self.assertIsInstance(data["total_unusable_doses"], int)
        self.assertIsInstance(data["total_earmarked_doses"], int)

    def test_user_with_read_only_can_see_usable_vials(self):
        self.client.force_authenticate(user=self.user_read_only_perms)
        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/usable_vials/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(len(data["results"]), 0)

    def test_user_with_read_only_can_see_unusable_vials(self):
        self.client.force_authenticate(user=self.user_read_only_perms)
        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/get_unusable_vials/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["results"]), 5)

    def test_outgoing_stock_movement_without_campaign(self):
        """Test that an OutgoingStockMovement can be created without a campaign"""
        FORMA_URL = "/api/polio/vaccine/stock/outgoing_stock_movement/"
        VIALS_COUNT = 1831  # using a remarkable number to avoid ambiguity in test result
        ALT_CAMPAIGN_NAME = "Alternative campaign"
        self.client.force_authenticate(user=self.user_rw_perms)

        # no campaign and no alternative campaign - Expect 400
        data = {
            "vaccine_stock": self.vaccine_stock.id,
            "report_date": "2023-01-01",
            "form_a_reception_date": "2023-01-02",
            "usable_vials_used": VIALS_COUNT,
            "lot_numbers": ["123", "456"],
            "comment": "Test without campaign",
            "doses_per_vial": 20,
        }

        response = self.client.post(f"{FORMA_URL}", data=data)
        self.assertEqual(response.status_code, 400)

        data = {
            "vaccine_stock": self.vaccine_stock.id,
            "report_date": "2023-01-01",
            "form_a_reception_date": "2023-01-02",
            "usable_vials_used": VIALS_COUNT,
            "lot_numbers": ["123", "456"],
            "comment": "Test without campaign",
            "alternative_campaign": ALT_CAMPAIGN_NAME,
            "doses_per_vial": 20,
        }

        response = self.client.post(f"{FORMA_URL}", data=data)

        self.assertEqual(response.status_code, 201)

        # Verify the movement was created
        movement = OutgoingStockMovement.objects.get(id=response.json()["id"])
        self.assertIsNone(movement.campaign)
        self.assertIsNone(movement.round)
        self.assertEqual(movement.usable_vials_used, VIALS_COUNT)
        self.assertEqual(movement.non_obr_name, ALT_CAMPAIGN_NAME)

        # Verify it appears in usable vials list
        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/usable_vials/")
        data = self.assertJSONResponse(response, 200)

        results = data["results"]
        forma = [result for result in results if result["vials_out"] == VIALS_COUNT]
        self.assertTrue(len(forma) == 1)  # There's only the one we created
        self.assertTrue(forma[0]["action"] == "Form A - Vials Used")

    def test_create_outgoiing_stock_cannot_have_both_campaign_and_alt_campaign(self):
        forma_url = "/api/polio/vaccine/stock/outgoing_stock_movement/"
        alt_campaign_name = "Alternative campaign"

        self.client.force_authenticate(user=self.user_rw_perms)
        # Cannot have both campaign and alternate_campaign --> expect 400
        data = {
            "vaccine_stock": self.vaccine_stock.id,
            "report_date": "2023-01-01",
            "form_a_reception_date": "2023-01-02",
            "usable_vials_used": 1000,
            "lot_numbers": ["123", "456"],
            "comment": "Test without campaign",
            "alternative_campaign": alt_campaign_name,
            "campaign": self.campaign.obr_name,
            "doses_per_vial": 20,
        }

        response = self.client.post(f"{forma_url}", data=data)

        res = self.assertJSONResponse(response, 400)
        self.assertEqual(res["error"][0], "campaign and alternative campaign cannot both be defined")

    def test_campaign_category_enum_and_get_campaign_category_method(self):
        """Test the CampaignCategory enum and get_campaign_category method"""
        from plugins.polio.api.vaccines.stock_management import CampaignCategory, OutgoingStockMovementSerializer

        # Test serializer method with different campaign scenarios
        serializer = OutgoingStockMovementSerializer()

        # Test with None campaign but with non_obr_name (should return REGULAR)
        obj_without_campaign = pm.OutgoingStockMovement.objects.create(
            vaccine_stock=self.vaccine_stock,
            report_date=self.now - datetime.timedelta(days=3),
            form_a_reception_date=self.now - datetime.timedelta(days=2),
            usable_vials_used=10,
            doses_per_vial=20,
            non_obr_name="Test Campaign Name",  # Required by constraint
        )
        self.assertEqual(serializer.get_campaign_category(obj_without_campaign), CampaignCategory.REGULAR)

        # Test with test campaign
        test_campaign = pm.Campaign.objects.create(
            obr_name="Test Campaign Enum",
            country=self.country,
            account=self.account,
            is_test=True,
        )
        test_round = pm.Round.objects.create(
            campaign=test_campaign,
            started_at=datetime.date(2021, 1, 1),
            ended_at=datetime.date(2021, 1, 31),
            number=1,
        )
        obj_test_campaign = pm.OutgoingStockMovement.objects.create(
            campaign=test_campaign,
            round=test_round,
            vaccine_stock=self.vaccine_stock,
            report_date=self.now - datetime.timedelta(days=3),
            form_a_reception_date=self.now - datetime.timedelta(days=2),
            usable_vials_used=10,
            doses_per_vial=20,
        )
        self.assertEqual(serializer.get_campaign_category(obj_test_campaign), CampaignCategory.TEST_CAMPAIGN)

        # Test with campaign on hold
        campaign_on_hold = pm.Campaign.objects.create(
            obr_name="Campaign On Hold Enum",
            country=self.country,
            account=self.account,
            on_hold=True,
        )
        round_on_hold = pm.Round.objects.create(
            campaign=campaign_on_hold,
            started_at=datetime.date(2021, 1, 1),
            ended_at=datetime.date(2021, 1, 31),
            number=1,
        )
        obj_campaign_on_hold = pm.OutgoingStockMovement.objects.create(
            campaign=campaign_on_hold,
            round=round_on_hold,
            vaccine_stock=self.vaccine_stock,
            report_date=self.now - datetime.timedelta(days=3),
            form_a_reception_date=self.now - datetime.timedelta(days=2),
            usable_vials_used=10,
            doses_per_vial=20,
        )
        self.assertEqual(serializer.get_campaign_category(obj_campaign_on_hold), CampaignCategory.CAMPAIGN_ON_HOLD)

        # Test with all rounds on hold
        campaign_all_rounds_hold = pm.Campaign.objects.create(
            obr_name="All Rounds On Hold Enum",
            country=self.country,
            account=self.account,
        )
        round1_all_hold = pm.Round.objects.create(
            campaign=campaign_all_rounds_hold,
            started_at=datetime.date(2021, 1, 1),
            ended_at=datetime.date(2021, 1, 31),
            number=1,
            on_hold=True,
        )
        round2_all_hold = pm.Round.objects.create(
            campaign=campaign_all_rounds_hold,
            started_at=datetime.date(2021, 2, 1),
            ended_at=datetime.date(2021, 2, 28),
            number=2,
            on_hold=True,
        )
        obj_all_rounds_hold = pm.OutgoingStockMovement.objects.create(
            campaign=campaign_all_rounds_hold,
            round=round1_all_hold,
            vaccine_stock=self.vaccine_stock,
            report_date=self.now - datetime.timedelta(days=3),
            form_a_reception_date=self.now - datetime.timedelta(days=2),
            usable_vials_used=10,
            doses_per_vial=20,
        )
        self.assertEqual(serializer.get_campaign_category(obj_all_rounds_hold), CampaignCategory.ALL_ROUNDS_ON_HOLD)

        # Test with specific round on hold
        campaign_mixed_rounds = pm.Campaign.objects.create(
            obr_name="Mixed Rounds Enum",
            country=self.country,
            account=self.account,
        )
        round1_active = pm.Round.objects.create(
            campaign=campaign_mixed_rounds,
            started_at=datetime.date(2021, 1, 1),
            ended_at=datetime.date(2021, 1, 31),
            number=1,
            on_hold=False,
        )
        round2_hold = pm.Round.objects.create(
            campaign=campaign_mixed_rounds,
            started_at=datetime.date(2021, 2, 1),
            ended_at=datetime.date(2021, 2, 28),
            number=2,
            on_hold=True,
        )
        obj_round_on_hold = pm.OutgoingStockMovement.objects.create(
            campaign=campaign_mixed_rounds,
            round=round2_hold,
            vaccine_stock=self.vaccine_stock,
            report_date=self.now - datetime.timedelta(days=3),
            form_a_reception_date=self.now - datetime.timedelta(days=2),
            usable_vials_used=10,
            doses_per_vial=20,
        )
        self.assertEqual(serializer.get_campaign_category(obj_round_on_hold), CampaignCategory.ROUND_ON_HOLD)

        # Test with regular campaign (no holds)
        obj_regular = pm.OutgoingStockMovement.objects.create(
            campaign=self.campaign,
            round=self.campaign_round_1,
            vaccine_stock=self.vaccine_stock,
            report_date=self.now - datetime.timedelta(days=3),
            form_a_reception_date=self.now - datetime.timedelta(days=2),
            usable_vials_used=10,
            doses_per_vial=20,
        )
        self.assertEqual(serializer.get_campaign_category(obj_regular), CampaignCategory.REGULAR)

    def test_outgoing_stock_movement_api_includes_campaign_category(self):
        """Test that the OutgoingStockMovement API includes campaign_category field"""
        self.client.force_authenticate(user=self.user_rw_perms)

        # Test list endpoint
        response = self.client.get(f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/")
        self.assertEqual(response.status_code, 200)

        # Check that campaign_category is present in the response
        results = response.data["results"]
        self.assertGreater(len(results), 0)

        for item in results:
            self.assertIn("campaign_category", item)
            self.assertIsInstance(item["campaign_category"], str)
            self.assertIn(
                item["campaign_category"],
                ["TEST_CAMPAIGN", "CAMPAIGN_ON_HOLD", "ALL_ROUNDS_ON_HOLD", "ROUND_ON_HOLD", "REGULAR"],
            )

        # Test detail endpoint
        movement_id = results[0]["id"]
        response = self.client.get(f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/{movement_id}/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("campaign_category", response.data)
        self.assertIsInstance(response.data["campaign_category"], str)

    def test_earmarked_stock_api_includes_campaign_category(self):
        """Test that the EarmarkedStock API includes campaign_category field"""
        self.client.force_authenticate(user=self.user_rw_perms)

        # Create an earmarked stock for testing
        earmarked_stock = pm.EarmarkedStock.objects.create(
            campaign=self.campaign,
            round=self.campaign_round_1,
            vaccine_stock=self.vaccine_stock,
            vials_earmarked=5,
            doses_earmarked=100,
            doses_per_vial=20,
        )

        # Test list endpoint
        response = self.client.get(f"{BASE_URL_SUB_RESOURCES}earmarked_stock/")
        self.assertEqual(response.status_code, 200)

        # Check that campaign_category is present in the response
        results = response.data["results"]
        self.assertGreater(len(results), 0)

        for item in results:
            self.assertIn("campaign_category", item)
            self.assertIsInstance(item["campaign_category"], str)
            self.assertIn(
                item["campaign_category"],
                ["TEST_CAMPAIGN", "CAMPAIGN_ON_HOLD", "ALL_ROUNDS_ON_HOLD", "ROUND_ON_HOLD", "REGULAR"],
            )

        # Test detail endpoint
        stock_id = results[0]["id"]
        response = self.client.get(f"{BASE_URL_SUB_RESOURCES}earmarked_stock/{stock_id}/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("campaign_category", response.data)
        self.assertIsInstance(response.data["campaign_category"], str)

    def test_campaign_category_values_for_different_scenarios(self):
        """Test that campaign_category returns correct values for different campaign states"""
        self.client.force_authenticate(user=self.user_rw_perms)

        # Create test campaigns with different states
        test_campaign = pm.Campaign.objects.create(
            obr_name="Test Campaign API",
            country=self.country,
            account=self.account,
            is_test=True,
        )
        test_round = pm.Round.objects.create(
            campaign=test_campaign,
            started_at=datetime.date(2021, 1, 1),
            ended_at=datetime.date(2021, 1, 31),
            number=1,
        )

        campaign_on_hold = pm.Campaign.objects.create(
            obr_name="Campaign On Hold API",
            country=self.country,
            account=self.account,
            on_hold=True,
        )
        round_on_hold = pm.Round.objects.create(
            campaign=campaign_on_hold,
            started_at=datetime.date(2021, 1, 1),
            ended_at=datetime.date(2021, 1, 31),
            number=1,
        )

        # Create movements for each campaign
        test_movement = pm.OutgoingStockMovement.objects.create(
            campaign=test_campaign,
            round=test_round,
            vaccine_stock=self.vaccine_stock,
            report_date=self.now - datetime.timedelta(days=3),
            form_a_reception_date=self.now - datetime.timedelta(days=2),
            usable_vials_used=10,
            doses_per_vial=20,
        )

        hold_movement = pm.OutgoingStockMovement.objects.create(
            campaign=campaign_on_hold,
            round=round_on_hold,
            vaccine_stock=self.vaccine_stock,
            report_date=self.now - datetime.timedelta(days=3),
            form_a_reception_date=self.now - datetime.timedelta(days=2),
            usable_vials_used=10,
            doses_per_vial=20,
        )

        # Test API responses
        response = self.client.get(f"{BASE_URL_SUB_RESOURCES}outgoing_stock_movement/")
        self.assertEqual(response.status_code, 200)

        results = response.data["results"]
        test_movement_data = next((item for item in results if item["id"] == test_movement.id), None)
        hold_movement_data = next((item for item in results if item["id"] == hold_movement.id), None)

        self.assertIsNotNone(test_movement_data)
        self.assertIsNotNone(hold_movement_data)
        self.assertEqual(test_movement_data["campaign_category"], "TEST_CAMPAIGN")
        self.assertEqual(hold_movement_data["campaign_category"], "CAMPAIGN_ON_HOLD")

    def test_doses_options_endpoint_success(self):
        """Test the doses_options endpoint returns correct data"""
        self.client.force_authenticate(user=self.user_ro_perms)

        # Test with valid stock ID
        response = self.client.get(f"{BASE_URL}doses_options/?stockId={self.vaccine_stock.id}")

        data = self.assertJSONResponse(response, 200)

        results = data["results"]
        self.assertEqual(len(results), 2)

        for item in results:
            self.assertIn("label", item)
            self.assertIn("value", item)
            self.assertIn("doses_available", item)
            self.assertIn("unusable_doses", item)

        # Check that we have the expected structure with both doses_available and unusable_doses
        item_20 = next((item for item in results if item["value"] == 20), None)
        self.assertIsNotNone(item_20)
        self.assertEqual(item_20["label"], "20")
        self.assertEqual(item_20["doses_available"], 460)
        self.assertEqual(item_20["unusable_doses"], 540)

        item_50 = next((item for item in results if item["value"] == 50), None)
        self.assertIsNotNone(item_50)
        self.assertEqual(item_50["label"], "50")
        self.assertEqual(item_50["doses_available"], 0)
        self.assertEqual(item_50["unusable_doses"], 0)

    def test_doses_options_endpoint_missing_stock_id(self):
        """Test the doses_options endpoint returns 400 when stockId is missing"""
        self.client.force_authenticate(user=self.user_ro_perms)

        response = self.client.get(f"{BASE_URL}doses_options/")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data, "stock id not provided")

    def test_doses_options_endpoint_invalid_stock_id(self):
        """Test the doses_options endpoint returns 404 when stockId is invalid"""
        self.client.force_authenticate(user=self.user_ro_perms)

        response = self.client.get(f"{BASE_URL}doses_options/?stockId=99999")

        self.assertEqual(response.status_code, 404)

    def test_doses_options_endpoint_anonymous_user(self):
        """Test that anonymous users cannot access doses_options endpoint"""
        self.client.force_authenticate(user=self.anon)

        response = self.client.get(f"{BASE_URL}doses_options/?stockId={self.vaccine_stock.id}")

        self.assertEqual(response.status_code, 403)

    def test_doses_options_endpoint_user_without_permissions(self):
        """Test that users without permissions cannot access doses_options endpoint"""
        self.client.force_authenticate(user=self.user_no_perms)

        response = self.client.get(f"{BASE_URL}doses_options/?stockId={self.vaccine_stock.id}")

        self.assertEqual(response.status_code, 403)

    def test_doses_options_endpoint_user_with_read_only_permissions(self):
        """Test that users with read-only permissions can access doses_options endpoint"""
        self.client.force_authenticate(user=self.user_read_only_perms)

        response = self.client.get(f"{BASE_URL}doses_options/?stockId={self.vaccine_stock.id}")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("results", data)

    def test_doses_options_endpoint_invalid_stock_id_format(self):
        """Test the doses_options endpoint with invalid stockId format"""
        self.client.force_authenticate(user=self.user_ro_perms)

        # Test with non-numeric stockId
        response = self.client.get(f"{BASE_URL}doses_options/?stockId=invalid")

        # Should return 404 as the filter will fail
        self.assertEqual(response.status_code, 400)

    def test_vaccine_stock_calculator_get_usable_stock_by_vaccine_presentation(self):
        """Test VaccineStockCalculator.get_usable_stock_by_vaccine_presentation method"""
        from plugins.polio.models.base import VaccineStockCalculator

        # Test with existing vaccine stock that has data
        calculator = VaccineStockCalculator(self.vaccine_stock)
        result = calculator.get_usable_stock_by_vaccine_presentation()

        # Should return a dictionary with doses per vial as keys and doses as values
        self.assertIsInstance(result, dict)
        self.assertIn("20", result)  # Based on test data, we have 20 doses per vial
        self.assertIn("50", result)  # Based on config, we have 50 doses per vial option

        # Check that the values are integers (doses)
        for _key, value in result.items():
            self.assertIsInstance(value, int)

        # Test with empty vaccine stock
        calculator_empty = VaccineStockCalculator(self.empty_vaccine_stock)
        result_empty = calculator_empty.get_usable_stock_by_vaccine_presentation()

        self.assertEqual({"10": 0, "20": 0}, result_empty)

    def test_vaccine_stock_calculator_get_unusable_stock_by_vaccine_presentation(self):
        """Test VaccineStockCalculator.get_unusable_stock_by_vaccine_presentation method"""

        # Test with existing vaccine stock that has data
        calculator = VaccineStockCalculator(self.vaccine_stock)
        result = calculator.get_unusable_stock_by_vaccine_presentation()

        # Should return a dictionary with doses per vial as keys and doses as values
        self.assertIsInstance(result, dict)
        self.assertIn("20", result)  # Based on test data, we have 20 doses per vial
        self.assertIn("50", result)  # Based on config, we have 50 doses per vial option

        # Check that the values are integers (doses)
        for _key, value in result.items():
            self.assertIsInstance(value, int)

        # Test with empty vaccine stock
        calculator_empty = VaccineStockCalculator(self.empty_vaccine_stock)
        result_empty = calculator_empty.get_unusable_stock_by_vaccine_presentation()
        self.assertEqual({"10": 0, "20": 0}, result_empty)

    def test_doses_options_endpoint_includes_unusable_doses(self):
        """Test that the doses_options endpoint includes unusable_doses field"""
        self.client.force_authenticate(user=self.user_ro_perms)

        response = self.client.get(f"{BASE_URL}doses_options/?stockId={self.vaccine_stock.id}")

        data = self.assertJSONResponse(response, 200)
        results = data["results"]

        # Check that each result includes unusable_doses field
        for item in results:
            self.assertIn("unusable_doses", item)
            self.assertIsInstance(item["unusable_doses"], int)

        # Verify specific values based on test data
        # We expect some unusable doses for 20-dose vials based on our test data
        item_20 = next((item for item in results if item["value"] == 20), None)
        self.assertIsNotNone(item_20)
        self.assertEqual(item_20["unusable_doses"], 540)

        item_50 = next((item for item in results if item["value"] == 50), None)
        self.assertIsNotNone(item_50)
        self.assertEqual(item_50["unusable_doses"], 0)  # No 50-dose vials in test data
