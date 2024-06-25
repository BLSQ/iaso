from datetime import date

from hat.menupermissions import models as permission
from iaso.models.base import Account
from iaso.models.org_unit import OrgUnit, OrgUnitType
from iaso.test import APITestCase
from plugins.polio.models import (
    Campaign,
    DestructionReport,
    OutgoingStockMovement,
    VaccineArrivalReport,
    VaccinePreAlert,
    VaccineRequestForm,
    VaccineStock,
)


class SupplyChainDashboardsAPITestCase(APITestCase):
    @classmethod
    def setUp(cls):
        cls.vrf_url = "/api/polio/dashboards/vaccine_request_forms/"
        cls.pre_alerts_url = "/api/polio/dashboards/pre_alerts/"
        cls.arrival_reports_url = "/api/polio/dashboards/arrival_reports/"
        cls.account = Account.objects.create(name="test account")
        cls.other_account = Account.objects.create(name="other account")
        cls.authorized_user_read = cls.create_user_with_profile(
            username="authorized_read",
            account=cls.account,
            permissions=[
                permission._POLIO_VACCINE_SUPPLY_CHAIN_READ,
            ],
        )
        cls.unauthorized_user = cls.create_user_with_profile(
            username="unAuthorized", account=cls.account, permissions=[]
        )
        # We need the org unit type to be able to use campaign.country
        cls.country_type = OrgUnitType.objects.create(name="country", category="COUNTRY")
        cls.country = OrgUnit.objects.create(name="Outsiplou", org_unit_type=cls.country_type)
        cls.campaign = Campaign.objects.create(
            obr_name="Outsiplou-2024", account=cls.account, initial_org_unit=cls.country
        )
        cls.vaccine_type = "mOPV2"
        cls.other_campaign = Campaign.objects.create(obr_name="Not the expected result", account=cls.other_account)
        cls.vrf = VaccineRequestForm.objects.create(
            campaign=cls.campaign,
            date_vrf_signature=date.today(),
            date_vrf_reception=date.today(),
            date_dg_approval=date.today(),
            quantities_ordered_in_doses=1000,
            vaccine_type=cls.vaccine_type,
        )
        cls.vrf.rounds.set([])
        cls.other_vrf = VaccineRequestForm.objects.create(
            campaign=cls.other_campaign,
            date_vrf_signature=date.today(),
            date_vrf_reception=date.today(),
            date_dg_approval=date.today(),
            quantities_ordered_in_doses=1000,
            vaccine_type=cls.vaccine_type,
        )
        cls.other_vrf.rounds.set([])
        cls.pre_alert = VaccinePreAlert.objects.create(request_form=cls.vrf, date_pre_alert_reception=date.today())
        cls.other_pre_alert = VaccinePreAlert.objects.create(
            request_form=cls.other_vrf, date_pre_alert_reception=date.today()
        )
        cls.arrival_report = VaccineArrivalReport.objects.create(
            request_form=cls.vrf, arrival_report_date=date.today(), doses_received=1000
        )
        cls.other_arrival_report = VaccineArrivalReport.objects.create(
            request_form=cls.other_vrf, arrival_report_date=date.today(), doses_received=1000
        )

        cls.vaccine_stock = VaccineStock.objects.create(
            country=cls.country, vaccine=cls.vaccine_type, account=cls.account
        )

    def test_user_has_permission_vrf(self):
        self.client.force_authenticate(self.unauthorized_user)
        response = self.client.get(self.vrf_url)
        self.assertJSONResponse(response, 403)

        self.client.force_authenticate(self.authorized_user_read)
        response = self.client.get(self.vrf_url)
        self.assertJSONResponse(response, 200)

    def test_user_has_permission_pre_alert(self):
        self.client.force_authenticate(self.unauthorized_user)
        response = self.client.get(self.pre_alerts_url)
        self.assertJSONResponse(response, 403)

        self.client.force_authenticate(self.authorized_user_read)
        response = self.client.get(self.pre_alerts_url)
        self.assertJSONResponse(response, 200)

    def test_user_has_permission_arrival_reports(self):
        self.client.force_authenticate(self.unauthorized_user)
        response = self.client.get(self.arrival_reports_url)
        self.assertJSONResponse(response, 403)

        self.client.force_authenticate(self.authorized_user_read)
        response = self.client.get(self.arrival_reports_url)
        self.assertJSONResponse(response, 200)
        # uncomment when write permission is effectively read-write
        # self.client.force_authenticate(self.authorized_user_write)
        # response = self.client.get(self.arrival_reports_url)
        # self.assertJSONResponse(response, 200)

    def test_vrf_filters_by_account(self):
        self.client.force_authenticate(self.authorized_user_read)
        response = self.client.get(self.vrf_url)
        jr = self.assertJSONResponse(response, 200)
        results = jr["results"]
        self.assertEqual(len(results), 1)
        vrf = results[0]
        self.assertEqual(vrf["obr_name"], self.campaign.obr_name)

    def test_vrf_new_fields(self):
        self.client.force_authenticate(self.authorized_user_read)

        # Create ArrivalReport and DestructionReport
        form_a = OutgoingStockMovement.objects.create(
            campaign=self.campaign,
            vaccine_stock=self.vaccine_stock,
            report_date=date.today(),
            form_a_reception_date=date.today(),
            usable_vials_used=100,
            missing_vials=10,
        )

        destruction_report = DestructionReport.objects.create(
            vaccine_stock=self.vaccine_stock,
            rrt_destruction_report_reception_date=date.today(),
            destruction_report_date=date.today(),
            unusable_vials_destroyed=10,
            action="destroyed",
        )

        with self.assertNumQueries(12):
            response = self.client.get(self.vrf_url)

        jr = self.assertJSONResponse(response, 200)
        results = jr["results"]
        self.assertEqual(len(results), 1)
        vrf = results[0]
        self.assertEqual(vrf["obr_name"], self.campaign.obr_name)
        self.assertIn("stock_in_hand", vrf)
        self.assertIn("form_a_reception_date", vrf)
        self.assertIn("destruction_report_reception_date", vrf)

        # Check if the dates match with the created ArrivalReport and DestructionReport
        self.assertEqual(vrf["form_a_reception_date"], str(form_a.form_a_reception_date))
        self.assertEqual(
            vrf["destruction_report_reception_date"], str(destruction_report.rrt_destruction_report_reception_date)
        )

    def test_pre_alerts_filters_by_account(self):
        self.client.force_authenticate(self.authorized_user_read)
        response = self.client.get(self.pre_alerts_url)
        jr = self.assertJSONResponse(response, 200)
        results = jr["results"]
        self.assertEqual(len(results), 1)
        pre_alert = results[0]
        self.assertEqual(pre_alert["request_form"], self.vrf.pk)

    def test_arrival_reports_filters_by_account(self):
        self.client.force_authenticate(self.authorized_user_read)
        response = self.client.get(self.arrival_reports_url)
        jr = self.assertJSONResponse(response, 200)
        results = jr["results"]
        self.assertEqual(len(results), 1)
        arrival_report = results[0]
        self.assertEqual(arrival_report["request_form"], self.vrf.pk)
