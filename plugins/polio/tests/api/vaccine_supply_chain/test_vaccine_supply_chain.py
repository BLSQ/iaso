import datetime

from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from iaso.utils.models.virus_scan import VirusScanStatus
from plugins.polio import models as pm
from plugins.polio.api.vaccines.supply_chain import AR_SET, PA_SET
from plugins.polio.tests.api.vaccine_supply_chain.base import BaseVaccineSupplyChainAPITestCase


class VaccineSupplyChainAPITestCase(BaseVaccineSupplyChainAPITestCase):
    def test_anonymous_user_cannot_see_list(self):
        self.client.force_authenticate(user=self.anon)
        response = self.client.get(self.BASE_URL)
        self.assertEqual(response.status_code, 403)

    def test_user_without_read_rights_cannot_see_list(self):
        self.client.force_authenticate(user=self.user_no_perms)
        response = self.client.get(self.BASE_URL)
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_only_can_see_list(self):
        self.client.force_authenticate(user=self.user_ro_perm)
        response = self.client.get(self.BASE_URL)
        self.assertEqual(response.status_code, 200)
        res = response.data["results"]
        self.assertEqual(len(res), 3)
        self.assertEqual(len(res[0]["rounds"]), 2)
        self.assertEqual(len(res[1]["rounds"]), 1)
        self.assertEqual(res[0]["start_date"], datetime.date(2021, 1, 1))
        self.assertEqual(res[0]["end_date"], datetime.date(2021, 2, 28))
        self.assertEqual(res[1]["start_date"], datetime.date(2021, 3, 1))
        self.assertEqual(res[1]["end_date"], datetime.date(2021, 3, 31))

    def test_user_with_read_write_can_see_list(self):
        self.client.force_authenticate(user=self.user_rw_perm)
        response = self.client.get(self.BASE_URL)
        self.assertEqual(response.status_code, 200)
        res = response.data["results"]
        self.assertEqual(len(res), 3)

    def test_search_parameter_works_on_get_list_api(self):
        self.client.force_authenticate(user=self.user_rw_perm)
        response = self.client.get(self.BASE_URL + "?search=" + self.vaccine_request_form_rdc_1.campaign.obr_name)
        self.assertEqual(response.status_code, 200)
        res = response.data["results"]
        self.assertEqual(len(res), 2)
        self.assertEqual(res[0]["obr_name"], self.vaccine_request_form_rdc_1.campaign.obr_name)

    def test_user_without_read_rights_cannot_see_detail(self):
        self.client.force_authenticate(user=self.user_no_perms)
        response = self.client.get(self.BASE_URL + str(self.vaccine_request_form_rdc_1.id) + "/")
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_rights_can_see_detail(self):
        self.client.force_authenticate(user=self.user_ro_perm)
        response = self.client.get(self.BASE_URL + str(self.vaccine_request_form_rdc_1.id) + "/")
        self.assertEqual(response.status_code, 200)
        res = response.data
        self.assertEqual(res["campaign"], self.vaccine_request_form_rdc_1.campaign.id)
        self.assertEqual(res["id"], self.vaccine_request_form_rdc_1.id)
        self.assertEqual(len(res["rounds"]), 2)

    def test_user_with_read_write_rights_can_see_detail(self):
        self.client.force_authenticate(user=self.user_rw_perm)
        response = self.client.get(self.BASE_URL + str(self.vaccine_request_form_rdc_1.id) + "/")
        self.assertEqual(response.status_code, 200)
        res = response.data
        self.assertEqual(res["campaign"], self.vaccine_request_form_rdc_1.campaign.id)
        self.assertEqual(res["id"], self.vaccine_request_form_rdc_1.id)
        self.assertEqual(len(res["rounds"]), 2)

    def test_user_cannot_see_from_another_account(self):
        self.client.force_authenticate(user=self.user_rw_perm)
        response = self.client.get(self.BASE_URL + str(self.vaccine_request_form_be_1.id) + "/")
        self.assertEqual(response.status_code, 404)

    def test_anonymous_user_cannot_post_new_request_form(self):
        self.client.force_authenticate(user=self.anon)
        response = self.client.post(
            self.BASE_URL,
            data={
                "campaign": self.campaign_rdc_1.id,
                "vaccine_type": pm.VACCINES[0][0],
                "date_vrf_reception": self.now - datetime.timedelta(days=1),
                "date_vrf_signature": self.now,
                "date_dg_approval": self.now,
                "quantities_ordered_in_doses": 1000000,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_permission_can_post_new_request_form(self):
        self.client.force_authenticate(user=self.user_ro_perm)

        campaign_test = pm.Campaign.objects.create(
            obr_name="TEST_CAMPAIGN",
            country=self.org_unit_DRC,
            account=self.account,
        )

        campaign_test_round_1 = pm.Round.objects.create(
            campaign=campaign_test,
            started_at=datetime.date(2021, 1, 1),
            ended_at=datetime.date(2021, 1, 31),
            number=1,
        )

        response = self.client.post(
            self.BASE_URL,
            data={
                "campaign": campaign_test.obr_name,
                "vaccine_type": pm.VACCINES[0][0],
                "date_vrf_reception": "2021-01-01",
                "date_vrf_signature": "2021-01-02",
                "date_dg_approval": "2021-01-03",
                "quantities_ordered_in_doses": 1000000,
                "rounds": [{"number": campaign_test_round_1.number}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        res = response.data
        self.assertEqual(res["campaign"], str(campaign_test.id))
        self.assertEqual(res["vaccine_type"], pm.VACCINES[0][0])

    def test_vaccine_request_form_permissions(self):
        # Create a non-admin user with basic permissions

        self.client.force_authenticate(self.user_ro_perm)

        # Non-admin can create request form
        campaign_test = pm.Campaign.objects.create(
            obr_name="TEST_CAMPAIGN",
            country=self.org_unit_DRC,
            account=self.account,
        )

        campaign_test_round_1 = pm.Round.objects.create(
            campaign=campaign_test,
            started_at=datetime.date(2021, 1, 1),
            ended_at=datetime.date(2021, 1, 31),
            number=1,
        )

        request_form_data = {
            "campaign": campaign_test.obr_name,
            "vaccine_type": pm.VACCINES[0][0],
            "date_vrf_reception": "2021-01-01",
            "date_vrf_signature": "2021-01-02",
            "date_dg_approval": "2021-01-03",
            "quantities_ordered_in_doses": 1000000,
            "rounds": [{"number": campaign_test_round_1.number}],
        }

        response = self.client.post(self.BASE_URL, request_form_data, format="json")
        self.assertEqual(response.status_code, 201)
        request_form_id = response.data["id"]

        # Non-admin can edit within 7 days
        update_data = {
            "campaign": campaign_test.obr_name,
            "vaccine_type": pm.VACCINES[1][0],
            "date_vrf_reception": "2021-02-01",
            "date_vrf_signature": "2021-02-02",
            "date_dg_approval": "2021-02-03",
            "quantities_ordered_in_doses": 2000000,
            "rounds": [{"number": campaign_test_round_1.number}],
        }

        response = self.client.patch(f"{self.BASE_URL}{request_form_id}/", update_data, format="json")
        self.assertEqual(response.status_code, 200)

        # Simulate passage of 8 days
        request_form = pm.VaccineRequestForm.objects.get(id=request_form_id)
        request_form.created_at = timezone.now() - datetime.timedelta(days=8)
        request_form.save()

        # Non-admin cannot edit after 7 days
        response = self.client.patch(f"{self.BASE_URL}{request_form_id}/", update_data, format="json")
        self.assertEqual(response.status_code, 403)

        # Switch to admin user
        self.client.force_authenticate(self.user_rw_perm)

        # Admin can edit regardless of time passed
        response = self.client.patch(f"{self.BASE_URL}{request_form_id}/", update_data, format="json")
        self.assertEqual(response.status_code, 200)

        # Admin can delete regardless of time passed
        response = self.client.delete(f"{self.BASE_URL}{request_form_id}/")
        self.assertEqual(response.status_code, 204)

    def test_pre_alerts_permissions(self):
        # Use a non-admin user
        self.client.force_authenticate(self.user_ro_perm)

        # Get the first request form
        request_form = pm.VaccineRequestForm.objects.first()

        pre_alert_data = {
            "pre_alerts": [
                {
                    "date_pre_alert_reception": "2021-01-01",
                    "estimated_arrival_time": "2021-01-02",
                    "doses_shipped": 500000,
                    "po_number": "1234698",
                    "lot_numbers": ["LOT-1234", "LOT-5678"],
                }
            ],
        }

        # Non-admin can create pre-alert
        response = self.client.post(
            self.BASE_URL + f"{request_form.id}/add_pre_alerts/", data=pre_alert_data, format="json"
        )
        self.assertEqual(response.status_code, 201)

        # Get pre-alerts to find the ID
        response = self.client.get(self.BASE_URL + f"{request_form.id}/get_pre_alerts/")
        self.assertEqual(response.status_code, 200)

        # Find the pre-alert with matching PO number
        pre_alerts = response.data["pre_alerts"]
        pre_alert = next(pa for pa in pre_alerts if pa["po_number"] == "1234698")
        pre_alert_id = pre_alert["id"]

        # Non-admin can edit within 7 days
        update_data = {"pre_alerts": [{"id": pre_alert_id, "doses_shipped": 600000, "po_number": "5678"}]}
        response = self.client.patch(
            self.BASE_URL + f"{request_form.id}/update_pre_alerts/", update_data, format="json"
        )
        self.assertEqual(response.status_code, 200)

        # Simulate passage of 8 days
        pre_alert = pm.VaccinePreAlert.objects.get(id=pre_alert_id)
        pre_alert.created_at = timezone.now() - datetime.timedelta(days=8)
        pre_alert.save()

        # need to change at least one field to trigger the edit permission check
        update_data = {"pre_alerts": [{"id": pre_alert_id, "doses_shipped": 650000, "po_number": "5678"}]}

        # Non-admin cannot edit after 7 days
        response = self.client.patch(
            self.BASE_URL + f"{request_form.id}/update_pre_alerts/", update_data, format="json"
        )
        self.assertEqual(response.status_code, 400)

        # Switch to admin user
        self.client.force_authenticate(self.user_rw_perm)

        # Admin can edit regardless of time passed
        response = self.client.patch(
            self.BASE_URL + f"{request_form.id}/update_pre_alerts/", update_data, format="json"
        )
        self.assertEqual(response.status_code, 200)

        # Admin can delete regardless of time passed
        response = self.client.delete(self.BASE_URL + f"{request_form.id}/delete_pre_alerts/?id={pre_alert_id}")
        self.assertEqual(response.status_code, 204)

    def test_bad_po_number_raises_error(self):
        self.client.force_authenticate(user=self.user_rw_perm)

        # Get the first request form and its pre-alerts
        request_form = pm.VaccineRequestForm.objects.first()

        response = self.client.post(
            self.BASE_URL + f"{request_form.id}/add_pre_alerts/",
            data={
                "pre_alerts": [
                    {
                        "date_pre_alert_reception": "2021-01-01",
                        "estimated_arrival_time": "2021-01-02",
                        "doses_shipped": 500000,
                        "po_number": "PO-1234",
                        "lot_numbers": ["LOT-1234", "LOT-5678"],
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_arrival_reports_permissions(self):
        # Use a non-admin user
        self.client.force_authenticate(self.user_ro_perm)

        # Get the first request form
        request_form = pm.VaccineRequestForm.objects.first()

        arrival_report_data = {
            "arrival_reports": [
                {
                    "arrival_report_date": "2021-01-01",
                    "doses_received": 1000,
                    "po_number": "1234698",
                }
            ],
        }

        # Non-admin can create arrival report
        response = self.client.post(
            self.BASE_URL + f"{request_form.id}/add_arrival_reports/", data=arrival_report_data, format="json"
        )
        self.assertEqual(response.status_code, 201)

        # Get arrival reports to find the ID
        response = self.client.get(self.BASE_URL + f"{request_form.id}/get_arrival_reports/")
        self.assertEqual(response.status_code, 200)

        # Find the arrival report with matching PO number
        arrival_reports = response.data["arrival_reports"]
        arrival_report = next(ar for ar in arrival_reports if ar["po_number"] == "1234698")
        arrival_report_id = arrival_report["id"]

        # Non-admin can edit within 7 days
        update_data = {
            "arrival_reports": [
                {
                    "id": arrival_report_id,
                    "doses_received": 2000,
                }
            ]
        }

        response = self.client.patch(
            self.BASE_URL + f"{request_form.id}/update_arrival_reports/", update_data, format="json"
        )
        self.assertEqual(response.status_code, 200)

        # Simulate passage of 8 days
        arrival_report = pm.VaccineArrivalReport.objects.get(id=arrival_report_id)
        arrival_report.created_at = timezone.now() - datetime.timedelta(days=8)
        arrival_report.doses_received = 8888
        arrival_report.save()

        # need to change at least one field to trigger the edit permission check
        update_data = {"arrival_reports": [{"id": arrival_report_id, "doses_received": 9999}]}

        # Non-admin cannot edit after 7 days
        response = self.client.patch(
            self.BASE_URL + f"{request_form.id}/update_arrival_reports/", update_data, format="json"
        )
        self.assertEqual(response.status_code, 400)

        # Switch to admin user
        self.client.force_authenticate(self.user_rw_perm)

        # Admin can edit regardless of time passed
        response = self.client.patch(
            self.BASE_URL + f"{request_form.id}/update_arrival_reports/", update_data, format="json"
        )
        self.assertEqual(response.status_code, 200)

        # Admin can delete regardless of time passed
        response = self.client.delete(
            self.BASE_URL + f"{request_form.id}/delete_arrival_reports/?id={arrival_report_id}"
        )
        self.assertEqual(response.status_code, 204)

    def test_can_get_request_form_vaccine_prealerts(self):
        self.client.force_authenticate(user=self.user_rw_perm)

        # Get the first request form and its pre-alerts
        request_form = pm.VaccineRequestForm.objects.first()

        # Create a pre-alert for the request_form
        pre_alert = pm.VaccinePreAlert.objects.create(
            request_form=request_form,
            date_pre_alert_reception="2021-01-01",
            estimated_arrival_time="2021-01-02",
            doses_shipped=1000,
            po_number="PO-1234",
            lot_numbers=["LOT-1234", "LOT-5678"],
        )

        response = self.client.get(
            self.BASE_URL + f"{request_form.id}/get_pre_alerts/",
        )

        self.assertEqual(response.status_code, 200)
        res = response.data

        self.assertEqual(len(res["pre_alerts"]), 1)
        self.assertEqual(res["pre_alerts"][0]["id"], pre_alert.id)
        self.assertEqual(res["pre_alerts"][0]["date_pre_alert_reception"], "2021-01-01")
        self.assertEqual(res["pre_alerts"][0]["estimated_arrival_time"], "2021-01-02")
        self.assertEqual(res["pre_alerts"][0]["doses_shipped"], 1000)
        self.assertEqual(res["pre_alerts"][0]["po_number"], "PO-1234")
        self.assertEqual(res["pre_alerts"][0]["scan_result"], VirusScanStatus.PENDING)  # No document -> default value
        self.assertIsNone(res["pre_alerts"][0]["scan_timestamp"])

    def test_can_get_request_form_vaccine_arrival_reports(self):
        self.client.force_authenticate(user=self.user_rw_perm)

        # Get the first request form and its arrival reports
        request_form = pm.VaccineRequestForm.objects.first()

        # Create a arrival report for the request_form
        arrival_report = pm.VaccineArrivalReport.objects.create(
            request_form=request_form,
            arrival_report_date="2022-01-01",
            doses_received=2000,
        )

        response = self.client.get(
            self.BASE_URL + f"{request_form.id}/get_arrival_reports/",
        )

        self.assertEqual(response.status_code, 200)
        res = response.data

        self.assertEqual(len(res["arrival_reports"]), 1)
        self.assertEqual(res["arrival_reports"][0]["id"], arrival_report.id)
        self.assertEqual(res["arrival_reports"][0]["arrival_report_date"], "2022-01-01")
        self.assertEqual(res["arrival_reports"][0]["doses_received"], 2000)

    def test_can_delete_request_form(self):
        self.client.force_authenticate(user=self.user_rw_perm)

        # Get the first request form
        request_form = pm.VaccineRequestForm.objects.first()

        arrival_report = pm.VaccineArrivalReport.objects.create(
            request_form=request_form,
            arrival_report_date="2022-01-01",
            doses_received=2000,
        )

        pre_alert = pm.VaccinePreAlert.objects.create(
            request_form=request_form,
            date_pre_alert_reception="2021-01-01",
            estimated_arrival_time="2021-01-02",
            doses_shipped=1000,
            po_number="PO-1234",
            lot_numbers=["LOT-1234", "LOT-5678"],
        )

        # Get the related objects from AR_SET and PA_SET
        ar_set = getattr(request_form, AR_SET).all()
        pa_set = getattr(request_form, PA_SET).all()

        response = self.client.delete(
            self.BASE_URL + f"{request_form.id}/",
            format="json",
        )

        self.assertEqual(response.status_code, 204)

        # Verify that the request_form was deleted
        with self.assertRaises(pm.VaccineRequestForm.DoesNotExist):
            pm.VaccineRequestForm.objects.get(id=request_form.id)

        # Verify that the related objects in AR_SET and PA_SET were also deleted
        for ar in ar_set:
            with self.assertRaises(pm.VaccineArrivalReport.DoesNotExist):
                pm.VaccineArrivalReport.objects.get(id=ar.id)

        for pa in pa_set:
            with self.assertRaises(pm.VaccinePreAlert.DoesNotExist):
                pm.VaccinePreAlert.objects.get(id=pa.id)

    def test_can_delete_pre_alert(self):
        self.client.force_authenticate(user=self.user_rw_perm)

        # Get the first request form
        request_form = pm.VaccineRequestForm.objects.first()

        pre_alert = pm.VaccinePreAlert.objects.create(
            request_form=request_form,
            date_pre_alert_reception="2021-01-01",
            estimated_arrival_time="2021-01-02",
            doses_shipped=1000,
            po_number="PO-1234",
            lot_numbers=["LOT-1234", "LOT-5678"],
        )

        # Get one of the pre-alerts attached to the request form
        pre_alert = getattr(request_form, PA_SET).first()

        response = self.client.delete(
            self.BASE_URL + f"{request_form.id}/delete_pre_alerts/?id={pre_alert.id}",
            format="json",
        )

        self.assertEqual(response.status_code, 204)

        # Verify that the pre_alert was deleted
        with self.assertRaises(pm.VaccinePreAlert.DoesNotExist):
            pm.VaccinePreAlert.objects.get(id=pre_alert.id)

    def test_can_delete_arrival_report(self):
        self.client.force_authenticate(user=self.user_rw_perm)

        # Get the first request form
        request_form = pm.VaccineRequestForm.objects.first()

        arrival_report = pm.VaccineArrivalReport.objects.create(
            request_form=request_form,
            arrival_report_date="2022-01-01",
            doses_received=2000,
        )

        # Get one of the arrival reports attached to the request form
        arrival_report = getattr(request_form, AR_SET).first()

        response = self.client.delete(
            self.BASE_URL + f"{request_form.id}/delete_arrival_reports/?id={arrival_report.id}",
            format="json",
        )

        self.assertEqual(response.status_code, 204)

        # Verify that the arrival_report was deleted
        with self.assertRaises(pm.VaccineArrivalReport.DoesNotExist):
            pm.VaccineArrivalReport.objects.get(id=arrival_report.id)

    def test_target_population_field_accessible(self):
        self.client.force_authenticate(user=self.user_rw_perm)

        # Create a VaccineRequestForm instance
        request_form = pm.VaccineRequestForm.objects.first()

        # Update the target_population through the API
        updated_population = 20000
        response = self.client.patch(
            self.BASE_URL + f"{request_form.id}/",
            data={"target_population": updated_population},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["target_population"], updated_population)

        # Retrieve the updated VaccineRequestForm and verify the target_population field
        request_form.refresh_from_db()
        self.assertEqual(request_form.target_population, updated_population)

    def test_var_field_ordered_reversely(self):
        self.client.force_authenticate(user=self.user_rw_perm)

        # Create a VaccineRequestForm instance
        request_form = pm.VaccineRequestForm.objects.first()

        # Create multiple VaccineArrivalReport instances with different dates
        po_numbers = ["777777-1", "777777-2", "777777-3"]

        dates = ["2024-04-20", "2024-04-19", "2024-04-18"]
        for i, date in enumerate(dates):
            pm.VaccineArrivalReport.objects.create(
                request_form=request_form,
                po_number=po_numbers[i],
                arrival_report_date=datetime.datetime.strptime(date, "%Y-%m-%d").date(),
                doses_received=1000,
            )
            pm.VaccinePreAlert.objects.create(
                date_pre_alert_reception=datetime.datetime.strptime(date, "%Y-%m-%d").date(),
                request_form=request_form,
                po_number=po_numbers[i],
                estimated_arrival_time=datetime.datetime.strptime(date, "%Y-%m-%d").date(),
                doses_shipped=100,
            )

        # Make a GET request to the list endpoint with ordering by start_date
        response = self.client.get(
            self.BASE_URL + "?order=-start_date&page=1&limit=20",
            format="json",
        )

        self.assertEqual(response.status_code, 200)

        # Verify that the "var" field is a comma-separated list of dates in reverse order
        expected_var = ",".join(dates)
        self.assertEqual(response.data["results"][1]["var"], expected_var)

    def test_pre_alert_document_not_modified_when_not_changed(self):
        self.client.force_authenticate(user=self.user_rw_perm)

        # Get the first request form
        request_form = pm.VaccineRequestForm.objects.first()

        # Create a pre-alert with a document
        # Create a test document file
        test_document = SimpleUploadedFile(
            "test_document.pdf", b"Test document content", content_type="application/pdf"
        )

        pre_alert = pm.VaccinePreAlert.objects.create(
            request_form=request_form,
            date_pre_alert_reception="2021-01-01",
            estimated_arrival_time="2021-01-02",
            doses_shipped=1000,
            po_number="DOC-TEST-123",
            lot_numbers=["LOT-1234", "LOT-5678"],
            document=test_document,
        )

        # Get the pre-alert ID
        pre_alert_id = pre_alert.id

        # Store the original document name and size for comparison
        original_document_name = pre_alert.document.name if pre_alert.document else None
        original_document_size = pre_alert.document.size if pre_alert.document else None

        # Update the pre-alert with a different field but not the document
        update_data = {
            "pre_alerts": [
                {
                    "id": pre_alert_id,
                    "doses_shipped": 2000,  # Change this field
                }
            ]
        }

        # Make the update request
        response = self.client.patch(
            self.BASE_URL + f"{request_form.id}/update_pre_alerts/", update_data, format="json"
        )

        self.assertEqual(response.status_code, 200)

        # Verify that the pre-alert was updated
        updated_pre_alert = pm.VaccinePreAlert.objects.get(id=pre_alert_id)
        self.assertEqual(updated_pre_alert.doses_shipped, 2000)

        # Verify that the document field was not modified
        # Check that the document name and size are the same as before
        self.assertEqual(updated_pre_alert.document.name, original_document_name)
        self.assertEqual(updated_pre_alert.document.size, original_document_size)
