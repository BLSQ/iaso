import datetime

from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from iaso.utils.virus_scan.model import VirusScanStatus
from plugins.polio import models as pm
from plugins.polio.api.vaccines.supply_chain import AR_SET, PA_SET
from plugins.polio.tests.api.test import PolioTestCaseMixin
from plugins.polio.tests.api.vaccine_supply_chain.base import BaseVaccineSupplyChainAPITestCase


class VaccineSupplyChainAPITestCase(BaseVaccineSupplyChainAPITestCase, PolioTestCaseMixin):
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

        pm.VaccineArrivalReport.objects.create(
            request_form=request_form,
            arrival_report_date="2022-01-01",
            doses_received=2000,
        )

        pm.VaccinePreAlert.objects.create(
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
            file=test_document,
        )

        # Get the pre-alert ID
        pre_alert_id = pre_alert.id

        # Store the original document name and size for comparison
        original_document_name = pre_alert.file.name if pre_alert.file else None
        original_document_size = pre_alert.file.size if pre_alert.file else None

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
        self.assertEqual(updated_pre_alert.file.name, original_document_name)
        self.assertEqual(updated_pre_alert.file.size, original_document_size)

    def test_vrf_cannot_be_created_for_round_without_scope(self):
        campaign, rnd1, _, _, _, _ = self.create_campaign(
            "NO_SCOPE_CAMPAIGN",
            self.account,
            self.source_version_1,
            self.org_unit_type_country,
            self.org_unit_type_district,
        )
        campaign.separate_scopes_per_round = True
        campaign.save()
        self.client.force_authenticate(user=self.user_rw_perm)
        response = self.client.post(
            self.BASE_URL,
            data={
                "campaign": campaign.id,
                "rounds": [rnd1.id],
                "vaccine_type": pm.VACCINES[0][0],
                "date_vrf_reception": self.now - datetime.timedelta(days=1),
                "date_vrf_signature": self.now,
                "date_dg_approval": self.now,
                "quantities_ordered_in_doses": 1000000,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

        campaign.separate_scopes_per_round = False
        campaign.scopes.set([])
        campaign.save()

        response = self.client.post(
            self.BASE_URL,
            data={
                "campaign": campaign.id,
                "rounds": [rnd1.id],
                "vaccine_type": pm.VACCINES[0][0],
                "date_vrf_reception": self.now - datetime.timedelta(days=1),
                "date_vrf_signature": self.now,
                "date_dg_approval": self.now,
                "quantities_ordered_in_doses": 1000000,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_round_id_filter(self):
        """Test that filtering by round_id returns only vaccine request forms associated with that round"""
        self.client.force_authenticate(user=self.user_rw_perm)

        # Get a round ID from one of our test vaccine request forms
        test_round = self.vaccine_request_form_rdc_1.rounds.first()

        response = self.client.get(f"{self.BASE_URL}?round_id={test_round.id}")
        self.assertEqual(response.status_code, 200)

        results = response.data["results"]
        # Verify each returned form includes the specified round
        for form in results:
            round_ids = [r["id"] for r in form["rounds"]]
            self.assertIn(test_round.id, round_ids)

        # Verify we don't get forms that don't include this round
        forms_without_round = pm.VaccineRequestForm.objects.exclude(rounds=test_round)
        for form in forms_without_round:
            form_ids = [f["id"] for f in results]
            self.assertNotIn(form.id, form_ids)

    def test_multiple_filters(self):
        """Test that multiple filters can be combined"""
        self.client.force_authenticate(user=self.user_rw_perm)

        test_form = self.vaccine_request_form_rdc_1
        test_country = test_form.campaign.country

        test_start_date = test_form.rounds.filter(number=1).first().started_at

        # Apply multiple filters
        response = self.client.get(
            f"{self.BASE_URL}?campaign__country={test_country.id}&rounds__started_at={test_start_date}"
        )

        self.assertEqual(response.status_code, 200)
        results = response.data["results"]

        # Verify results match all filter criteria
        for form in results:
            self.assertEqual(form["country"]["id"], test_country.id)
            # The form's start_date should match our test date since we filtered on rounds__started_at
            self.assertEqual(str(test_start_date), str(form["start_date"]))

    def test_response_shape(self):
        """Test that the response data has the expected structure"""
        self.client.force_authenticate(user=self.user_rw_perm)

        response = self.client.get(f"{self.BASE_URL}")
        self.assertEqual(response.status_code, 200)

        results = response.data["results"]
        self.assertTrue(len(results) > 0, "Response should contain at least one result")

        # Test shape of first result
        result = results[0]

        # Required fields
        self.assertIn("id", result)
        self.assertIsInstance(result["id"], int)

        self.assertIn("country", result)
        self.assertIsInstance(result["country"], dict)
        self.assertIn("name", result["country"])
        self.assertIn("id", result["country"])

        self.assertIn("vaccine_type", result)
        self.assertIsInstance(result["vaccine_type"], str)

        self.assertIn("obr_name", result)
        self.assertIsInstance(result["obr_name"], str)

        self.assertIn("rounds", result)
        self.assertIsInstance(result["rounds"], list)
        if result["rounds"]:
            round_data = result["rounds"][0]
            self.assertIn("number", round_data)
            self.assertIn("id", round_data)

        self.assertIn("quantities_ordered_in_doses", result)
        self.assertIsInstance(result["quantities_ordered_in_doses"], (int, type(None)))

        self.assertIn("start_date", result)
        self.assertIn("end_date", result)

        self.assertIn("doses_shipped", result)
        self.assertIsInstance(result["doses_shipped"], int)

        self.assertIn("doses_received", result)
        self.assertIsInstance(result["doses_received"], int)

        self.assertIn("eta", result)
        self.assertIsInstance(result["eta"], str)

        self.assertIn("var", result)
        self.assertIsInstance(result["var"], str)

        self.assertIn("created_at", result)
        self.assertIn("updated_at", result)

        self.assertIn("vrf_type", result)
        self.assertIsInstance(result["vrf_type"], str)

        self.assertIn("can_edit", result)
        self.assertIsInstance(result["can_edit"], bool)

    def test_vaccine_request_form_api_includes_campaign_category(self):
        """Test that the VaccineRequestForm API includes campaign_category field"""
        self.client.force_authenticate(user=self.user_rw_perm)

        # Test list endpoint
        response = self.client.get(self.BASE_URL)
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

    def test_campaign_category_values_for_different_campaign_states(self):
        """Test that campaign_category returns correct values for different campaign states in VRF"""
        self.client.force_authenticate(user=self.user_rw_perm)

        # Create test campaign
        test_campaign = pm.Campaign.objects.create(
            obr_name="Test Campaign VRF",
            country=self.org_unit_DRC,
            account=self.account,
            is_test=True,
        )
        test_round = pm.Round.objects.create(
            campaign=test_campaign,
            started_at=datetime.date(2021, 1, 1),
            ended_at=datetime.date(2021, 1, 31),
            number=1,
        )

        # Create VRF for test campaign
        test_vrf = pm.VaccineRequestForm.objects.create(
            campaign=test_campaign,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=self.now - datetime.timedelta(days=30),
            date_vrf_signature=self.now - datetime.timedelta(days=20),
            date_dg_approval=self.now - datetime.timedelta(days=10),
            quantities_ordered_in_doses=500,
        )
        test_vrf.rounds.set([test_round])

        # Create campaign on hold
        campaign_on_hold = pm.Campaign.objects.create(
            obr_name="Campaign On Hold VRF",
            country=self.org_unit_DRC,
            account=self.account,
            on_hold=True,
        )
        round_on_hold = pm.Round.objects.create(
            campaign=campaign_on_hold,
            started_at=datetime.date(2021, 1, 1),
            ended_at=datetime.date(2021, 1, 31),
            number=1,
        )

        # Create VRF for campaign on hold
        hold_vrf = pm.VaccineRequestForm.objects.create(
            campaign=campaign_on_hold,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=self.now - datetime.timedelta(days=30),
            date_vrf_signature=self.now - datetime.timedelta(days=20),
            date_dg_approval=self.now - datetime.timedelta(days=10),
            quantities_ordered_in_doses=500,
        )
        hold_vrf.rounds.set([round_on_hold])

        # Create campaign with all rounds on hold
        campaign_all_rounds_hold = pm.Campaign.objects.create(
            obr_name="All Rounds On Hold VRF",
            country=self.org_unit_DRC,
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

        # Create VRF for campaign with all rounds on hold
        all_rounds_hold_vrf = pm.VaccineRequestForm.objects.create(
            campaign=campaign_all_rounds_hold,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=self.now - datetime.timedelta(days=30),
            date_vrf_signature=self.now - datetime.timedelta(days=20),
            date_dg_approval=self.now - datetime.timedelta(days=10),
            quantities_ordered_in_doses=500,
        )
        all_rounds_hold_vrf.rounds.set([round1_all_hold, round2_all_hold])

        # Create campaign with mixed rounds (some on hold, some not)
        campaign_mixed_rounds = pm.Campaign.objects.create(
            obr_name="Mixed Rounds VRF",
            country=self.org_unit_DRC,
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

        # Create VRF for campaign with mixed rounds
        mixed_rounds_vrf = pm.VaccineRequestForm.objects.create(
            campaign=campaign_mixed_rounds,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=self.now - datetime.timedelta(days=30),
            date_vrf_signature=self.now - datetime.timedelta(days=20),
            date_dg_approval=self.now - datetime.timedelta(days=10),
            quantities_ordered_in_doses=500,
        )
        mixed_rounds_vrf.rounds.set([round1_active, round2_hold])

        # Test API responses
        response = self.client.get(self.BASE_URL)
        self.assertEqual(response.status_code, 200)

        results = response.data["results"]

        # Find our test VRFs in the response
        test_vrf_data = next((item for item in results if item["id"] == test_vrf.id), None)
        hold_vrf_data = next((item for item in results if item["id"] == hold_vrf.id), None)
        all_rounds_hold_vrf_data = next((item for item in results if item["id"] == all_rounds_hold_vrf.id), None)
        mixed_rounds_vrf_data = next((item for item in results if item["id"] == mixed_rounds_vrf.id), None)

        # Verify campaign categories
        self.assertIsNotNone(test_vrf_data)
        self.assertIsNotNone(hold_vrf_data)
        self.assertIsNotNone(all_rounds_hold_vrf_data)
        self.assertIsNotNone(mixed_rounds_vrf_data)

        self.assertEqual(test_vrf_data["campaign_category"], "TEST_CAMPAIGN")
        self.assertEqual(hold_vrf_data["campaign_category"], "CAMPAIGN_ON_HOLD")
        self.assertEqual(all_rounds_hold_vrf_data["campaign_category"], "ALL_ROUNDS_ON_HOLD")
        self.assertEqual(mixed_rounds_vrf_data["campaign_category"], "ROUND_ON_HOLD")
