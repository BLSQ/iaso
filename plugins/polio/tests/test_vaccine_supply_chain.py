import datetime
from django.utils.timezone import now

import hat.menupermissions.models as permissions
from iaso import models as m
from iaso.test import APITestCase
from plugins.polio import models as pm
from django.contrib.auth.models import AnonymousUser


BASE_URL = "/api/polio/vaccine/request_forms/"


class VaccineSupplyChainAPITestCase(APITestCase):
    @classmethod
    def setUp(cls):
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.another_data_source = m.DataSource.objects.create(name="Another source")

        cls.now = now()

        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.another_source_version = m.SourceVersion.objects.create(data_source=cls.another_data_source, number=1)

        cls.account = m.Account.objects.create(name="polio", default_version=cls.source_version_1)

        cls.another_account = m.Account.objects.create(
            name="another_account", default_version=cls.another_source_version
        )

        cls.default_project = m.Project.objects.create(name="Default project", app_id="default", account=cls.account)
        cls.data_source.projects.set([cls.default_project])

        cls.another_project = m.Project.objects.create(
            name="Another project", app_id="another", account=cls.another_account
        )
        cls.another_data_source.projects.set([cls.another_project])

        cls.account_2 = m.Account.objects.create(name="second_account", default_version=cls.source_version_1)

        cls.anon = AnonymousUser()

        cls.user_rw_perm = cls.create_user_with_profile(
            username="user_1",
            account=cls.account,
            permissions=[permissions._POLIO_VACCINE_SUPPLY_CHAIN_READ, permissions._POLIO_VACCINE_SUPPLY_CHAIN_WRITE],
        )
        cls.user_ro_perm = cls.create_user_with_profile(
            username="user_2", account=cls.account, permissions=[permissions._POLIO_VACCINE_SUPPLY_CHAIN_READ]
        )
        cls.user_no_perms = cls.create_user_with_profile(username="user_3", account=cls.account, permissions=[])

        cls.project = m.Project.objects.create(
            name="Polio",
            app_id="polio.projects",
            account=cls.account,
        )

        cls.project_2 = m.Project.objects.create(
            name="Project_2",
            app_id="pro.jects",
            account=cls.account_2,
        )

        cls.org_unit_type_country = m.OrgUnitType.objects.create(name="COUNTRY", category="COUNTRY")

        cls.org_unit_type_country.projects.set([cls.project, cls.project_2])
        cls.org_unit_type_country.save()

        cls.org_unit_DRC = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Democratic Republic of Congo",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.org_unit_CHAD = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="CHAD",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.org_unit_BE = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Belgium",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.campaign_rdc_1 = pm.Campaign.objects.create(
            obr_name="RDC_CAMPAIGN_1",
            country=cls.org_unit_DRC,
            account=cls.account,
            vacine=pm.VACCINES[0][0],
        )

        cls.campaign_rdc_1_round_1 = pm.Round.objects.create(
            campaign=cls.campaign_rdc_1,
            started_at=datetime.datetime(2021, 1, 1),
            ended_at=datetime.datetime(2021, 1, 31),
        )

        cls.campaign_rdc_1_round_2 = pm.Round.objects.create(
            campaign=cls.campaign_rdc_1,
            started_at=datetime.datetime(2021, 2, 1),
            ended_at=datetime.datetime(2021, 2, 28),
        )

        cls.campaign_rdc_1_round_3 = pm.Round.objects.create(
            campaign=cls.campaign_rdc_1,
            started_at=datetime.datetime(2021, 3, 1),
            ended_at=datetime.datetime(2021, 3, 31),
        )

        cls.vaccine_request_form_rdc_1 = pm.VaccineRequestForm.objects.create(
            campaign=cls.campaign_rdc_1,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=cls.now - datetime.timedelta(days=30),
            date_vrf_signature=cls.now - datetime.timedelta(days=20),
            date_dg_approval=cls.now - datetime.timedelta(days=10),
            quantities_ordered_in_doses=500,
        )
        cls.vaccine_request_form_rdc_1.rounds.set([cls.campaign_rdc_1_round_1, cls.campaign_rdc_1_round_2])

        cls.vaccine_request_form_rdc_2 = pm.VaccineRequestForm.objects.create(
            campaign=cls.campaign_rdc_1,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=cls.now - datetime.timedelta(days=1),
            date_vrf_signature=cls.now,
            date_dg_approval=cls.now,
            quantities_ordered_in_doses=100,
        )
        cls.vaccine_request_form_rdc_2.rounds.set([cls.campaign_rdc_1_round_3])

        cls.campaign_chad_1 = pm.Campaign.objects.create(
            obr_name="CHAD_CAMPAIGN_1",
            country=cls.org_unit_CHAD,
            account=cls.account,
            vacine=pm.VACCINES[0][0],
        )

        cls.campaign_chad_1_round_1 = pm.Round.objects.create(
            campaign=cls.campaign_chad_1,
            started_at=datetime.datetime(2021, 1, 1),
            ended_at=datetime.datetime(2021, 1, 31),
        )

        cls.campaign_chad_1_round_2 = pm.Round.objects.create(
            campaign=cls.campaign_chad_1,
            started_at=datetime.datetime(2021, 2, 1),
            ended_at=datetime.datetime(2021, 2, 28),
        )

        cls.campaign_chad_1_round_3 = pm.Round.objects.create(
            campaign=cls.campaign_chad_1,
            started_at=datetime.datetime(2021, 3, 1),
            ended_at=datetime.datetime(2021, 3, 31),
        )

        cls.vaccine_request_form_chad_1 = pm.VaccineRequestForm.objects.create(
            campaign=cls.campaign_chad_1,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=cls.now - datetime.timedelta(days=30),
            date_vrf_signature=cls.now - datetime.timedelta(days=20),
            date_dg_approval=cls.now - datetime.timedelta(days=10),
            quantities_ordered_in_doses=500,
        )
        cls.vaccine_request_form_chad_1.rounds.set(
            [
                cls.campaign_chad_1_round_1,
                cls.campaign_chad_1_round_2,
                cls.campaign_chad_1_round_3,
            ]
        )

        cls.campaign_be_1 = pm.Campaign.objects.create(
            obr_name="BE_CAMPAIGN_1",
            country=cls.org_unit_BE,
            account=cls.another_account,  # different account
            vacine=pm.VACCINES[0][0],
        )

        cls.campaign_be_1_round_1 = pm.Round.objects.create(
            campaign=cls.campaign_be_1,
            started_at=datetime.datetime(2021, 1, 1),
            ended_at=datetime.datetime(2021, 1, 31),
        )

        cls.campaign_be_1_round_2 = pm.Round.objects.create(
            campaign=cls.campaign_be_1,
            started_at=datetime.datetime(2021, 2, 1),
            ended_at=datetime.datetime(2021, 2, 28),
        )

        cls.vaccine_request_form_be_1 = pm.VaccineRequestForm.objects.create(
            campaign=cls.campaign_be_1,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=cls.now - datetime.timedelta(days=1),
            date_vrf_signature=cls.now,
            date_dg_approval=cls.now,
            quantities_ordered_in_doses=1000000,
        )

    def test_anonymous_user_cannot_see_list(self):
        self.client.force_authenticate(user=self.anon)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 403)

    def test_user_without_read_rights_cannot_see_list(self):
        self.client.force_authenticate(user=self.user_no_perms)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_only_can_see_list(self):
        self.client.force_authenticate(user=self.user_ro_perm)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 200)
        res = response.data["results"]
        self.assertEqual(len(res), 3)
        self.assertEqual(len(res[0]["rounds"]), 2)
        self.assertEqual(len(res[1]["rounds"]), 1)
        self.assertEqual(res[0]["start_date"], datetime.date(2021, 2, 1))
        self.assertEqual(res[0]["end_date"], datetime.date(2021, 2, 28))
        self.assertEqual(res[1]["start_date"], datetime.date(2021, 3, 1))
        self.assertEqual(res[1]["end_date"], datetime.date(2021, 3, 31))

    def test_user_with_read_write_can_see_list(self):
        self.client.force_authenticate(user=self.user_rw_perm)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 200)
        res = response.data["results"]
        self.assertEqual(len(res), 3)

    def test_search_parameter_works_on_get_list_api(self):
        self.client.force_authenticate(user=self.user_rw_perm)
        response = self.client.get(BASE_URL + "?search=" + self.vaccine_request_form_rdc_1.campaign.obr_name)
        self.assertEqual(response.status_code, 200)
        res = response.data["results"]
        self.assertEqual(len(res), 2)
        self.assertEqual(res[0]["obr_name"], self.vaccine_request_form_rdc_1.campaign.obr_name)

    def test_user_without_read_rights_cannot_see_detail(self):
        self.client.force_authenticate(user=self.user_no_perms)
        response = self.client.get(BASE_URL + str(self.vaccine_request_form_rdc_1.id) + "/")
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_rights_can_see_detail(self):
        self.client.force_authenticate(user=self.user_ro_perm)
        response = self.client.get(BASE_URL + str(self.vaccine_request_form_rdc_1.id) + "/")
        self.assertEqual(response.status_code, 200)
        res = response.data
        self.assertEqual(res["id"], self.vaccine_request_form_rdc_1.id)
        self.assertEqual(len(res["rounds"]), 2)

    def test_user_with_read_write_rights_can_see_detail(self):
        self.client.force_authenticate(user=self.user_rw_perm)
        response = self.client.get(BASE_URL + str(self.vaccine_request_form_rdc_1.id) + "/")
        self.assertEqual(response.status_code, 200)
        res = response.data
        self.assertEqual(res["id"], self.vaccine_request_form_rdc_1.id)
        self.assertEqual(len(res["rounds"]), 2)

    def test_user_cannot_see_from_another_account(self):
        self.client.force_authenticate(user=self.user_rw_perm)
        response = self.client.get(BASE_URL + str(self.vaccine_request_form_be_1.id) + "/")
        self.assertEqual(response.status_code, 404)

    def test_anonymous_user_cannot_post_new_request_form(self):
        self.client.force_authenticate(user=self.anon)
        response = self.client.post(
            BASE_URL,
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

    def test_user_without_write_permission_cannot_post_new_request_form(self):
        self.client.force_authenticate(user=self.user_ro_perm)
        response = self.client.post(
            BASE_URL,
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

    def test_user_with_write_permission_can_post_new_request_form(self):
        self.client.force_authenticate(user=self.user_rw_perm)

        campaign_test = pm.Campaign.objects.create(
            obr_name="TEST_CAMPAIGN",
            country=self.org_unit_DRC,
            account=self.account,
            vacine=pm.VACCINES[0][0],
        )

        campaign_test_round_1 = pm.Round.objects.create(
            campaign=campaign_test,
            started_at=datetime.datetime(2021, 1, 1),
            ended_at=datetime.datetime(2021, 1, 31),
        )

        response = self.client.post(
            BASE_URL,
            data={
                "campaign": campaign_test.id,
                "vaccine_type": pm.VACCINES[0][0],
                "date_vrf_reception": "2021-01-01",
                "date_vrf_signature": "2021-01-02",
                "date_dg_approval": "2021-01-03",
                "quantities_ordered_in_doses": 1000000,
                "rounds": [campaign_test_round_1.id],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        res = response.data
        self.assertEqual(res["campaign"], campaign_test.id)
        self.assertEqual(res["vaccine_type"], pm.VACCINES[0][0])

    def test_can_add_request_form_vaccine_prealerts(self):
        self.client.force_authenticate(user=self.user_rw_perm)

        # Get the first request form and its pre-alerts
        request_form = pm.VaccineRequestForm.objects.first()

        response = self.client.post(
            BASE_URL + f"{request_form.id}/add_pre_alerts/",
            data={
                "pre_alerts": [
                    {
                        "date_pre_alert_reception": "2021-01-01",
                        "estimated_arrival_time": "2021-01-02T12:00:00Z",
                        "doses_shipped": 500000,
                        "po_number": "PO-1234",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        res = response.data

        self.assertEqual(len(res["pre_alerts"]), 1)
        self.assertEqual(res["pre_alerts"][0]["doses_shipped"], 500000)
        self.assertEqual(res["pre_alerts"][0]["po_number"], "PO-1234")

    def test_can_add_request_form_vaccine_arrival_reports(self):
        self.client.force_authenticate(user=self.user_rw_perm)

        # Get the first request form and its arrival reports
        request_form = pm.VaccineRequestForm.objects.first()

        response = self.client.post(
            BASE_URL + f"{request_form.id}/add_arrival_reports/",
            data={
                "arrival_reports": [
                    {
                        "arrival_report_date": "2021-01-01",
                        "doses_received": 1000,
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        res = response.data

        print(res.keys())
        print(res["arrival_reports"])

        self.assertEqual(len(res["arrival_reports"]), 1)
        self.assertEqual(res["arrival_reports"][0]["doses_received"], 1000)
        self.assertEqual(res["arrival_reports"][0]["arrival_report_date"], "2021-01-01")

    def test_can_get_request_form_vaccine_prealerts(self):
        self.client.force_authenticate(user=self.user_rw_perm)

        # Get the first request form and its pre-alerts
        request_form = pm.VaccineRequestForm.objects.first()

        # Create a pre-alert for the request_form
        pre_alert = pm.VaccinePreAlert.objects.create(
            request_form=request_form,
            date_pre_alert_reception="2021-01-01",
            estimated_arrival_time="2021-01-02T00:00:00Z",
            doses_shipped=1000,
            po_number="PO-1234",
        )

        response = self.client.get(
            BASE_URL + f"{request_form.id}/get_pre_alerts/",
        )

        self.assertEqual(response.status_code, 200)
        res = response.data

        self.assertEqual(len(res["pre_alerts"]), 1)
        self.assertEqual(res["pre_alerts"][0]["id"], pre_alert.id)
        self.assertEqual(res["pre_alerts"][0]["date_pre_alert_reception"], "2021-01-01")
        self.assertEqual(res["pre_alerts"][0]["estimated_arrival_time"], "2021-01-02T00:00:00Z")
        self.assertEqual(res["pre_alerts"][0]["doses_shipped"], 1000)
        self.assertEqual(res["pre_alerts"][0]["po_number"], "PO-1234")

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
            BASE_URL + f"{request_form.id}/get_arrival_reports/",
        )

        self.assertEqual(response.status_code, 200)
        res = response.data

        self.assertEqual(len(res["arrival_reports"]), 1)
        self.assertEqual(res["arrival_reports"][0]["id"], arrival_report.id)
        self.assertEqual(res["arrival_reports"][0]["arrival_report_date"], "2022-01-01")
        self.assertEqual(res["arrival_reports"][0]["doses_received"], 2000)

    def test_can_modify_request_form_vaccine_arrival_reports(self):
        self.client.force_authenticate(user=self.user_rw_perm)

        # Get the first request form and its arrival reports
        request_form = pm.VaccineRequestForm.objects.first()

        arrival_report = pm.VaccineArrivalReport.objects.create(
            request_form=request_form,
            arrival_report_date="2022-01-01",
            doses_received=2000,
        )

        response = self.client.patch(
            BASE_URL + f"{request_form.id}/update_arrival_reports/",
            data={"arrival_reports": [{"id": arrival_report.id, "doses_received": 3333}]},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        res = response.data

        self.assertEqual(res["arrival_reports"][0]["doses_received"], 3333)

    def test_can_modify_request_form_vaccine_prealerts(self):
        self.client.force_authenticate(user=self.user_rw_perm)

        # Get the first request form and its pre-alerts
        request_form = pm.VaccineRequestForm.objects.first()

        pre_alert = pm.VaccinePreAlert.objects.create(
            request_form=request_form,
            date_pre_alert_reception="2021-01-01",
            estimated_arrival_time="2021-01-02",
            doses_shipped=1000,
            po_number="PO-1234",
        )

        response = self.client.patch(
            BASE_URL + f"{request_form.id}/update_pre_alerts/",
            data={"pre_alerts": [{"id": pre_alert.id, "doses_shipped": 4444}]},
            format="json",
        )

        print(response.data)

        self.assertEqual(response.status_code, 200)
        res = response.data

        self.assertEqual(res["pre_alerts"][0]["doses_shipped"], 4444)
