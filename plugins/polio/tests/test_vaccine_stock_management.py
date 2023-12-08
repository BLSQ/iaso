from django.utils import timezone
from rest_framework.test import APIClient
from iaso.test import APITestCase
from plugins.polio import models as pm
from iaso import models as m
import datetime


class VaccineStockManagementAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up data for the whole TestCase
        cls.now = timezone.now()
        cls.account = m.Account.objects.create(name="test_account")
        cls.project = m.Project.objects.create(name="Polio", app_id="polio.projects", account=cls.account)
        cls.org_unit_type_country = m.OrgUnitType.objects.create(name="COUNTRY", category="COUNTRY")
        cls.org_unit_type_country.projects.set([cls.project])
        cls.org_unit_type_country.save()
        cls.country = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.project.default_version,
            name="Testland",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="TestlandRef",
        )
        cls.campaign = pm.Campaign.objects.create(
            obr_name="Test Campaign",
            country=cls.country,
            account=cls.account,
            vaccine=pm.VACCINES[0][0],
        )
        cls.vaccine_request_form = pm.VaccineRequestForm.objects.create(
            campaign=cls.campaign,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=cls.now - datetime.timedelta(days=30),
            date_vrf_signature=cls.now - datetime.timedelta(days=20),
            date_dg_approval=cls.now - datetime.timedelta(days=10),
            quantities_ordered_in_doses=500,
        )
        cls.vaccine_arrival_report = pm.VaccineArrivalReport.objects.create(
            request_form=cls.vaccine_request_form,
            arrival_report_date=cls.now - datetime.timedelta(days=5),
            doses_received=400,
        )
        cls.vaccine_stock = pm.VaccineStock.objects.create(
            account=cls.account,
            country=cls.country,
            vaccine=pm.VACCINES[0][0],
        )
        cls.outgoing_stock_movement = pm.OutgoingStockMovement.objects.create(
            campaign=cls.campaign,
            vaccine_stock=cls.vaccine_stock,
            report_date=cls.now - datetime.timedelta(days=3),
            form_a_reception_date=cls.now - datetime.timedelta(days=2),
            usable_vials_used=10,
            unusable_vials=5,
            lot_numbers=["LOT123", "LOT456"],
            missing_vials=2,
        )
        cls.destruction_report = pm.DestructionReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            action="Destroyed due to expiration",
            rrt_destruction_report_reception_date=cls.now - datetime.timedelta(days=1),
            destruction_report_date=cls.now,
            unusable_vials_destroyed=3,
            lot_number="LOT789",
        )
        cls.incident_report = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
            date_of_incident_report=cls.now - datetime.timedelta(days=4),
            incident_report_received_by_rrt=cls.now - datetime.timedelta(days=3),
            unusable_vials=1,
            usable_vials=0,
        )
        cls.client = APIClient()

    def test_vaccine_stock_list(self):
        # Test the vaccine stock list API
        response = self.client.get("/api/polio/vaccine/stock/")
        self.assertEqual(response.status_code, 200)
        results = response.json()["results"]
        self.assertEqual(len(results), 1)
        stock = results[0]
        self.assertEqual(stock["country_name"], "Testland")
        self.assertEqual(stock["vaccine_type"], pm.VACCINES[0][0])
        self.assertEqual(stock["vials_received"], 20)  # 400 doses / 20 doses per vial
        self.assertEqual(stock["vials_used"], 10)
        self.assertEqual(stock["stock_of_usable_vials"], 10)  # 20 received - 10 used
        self.assertEqual(stock["leftover_ratio"], 50)  # 10 used / 20 received * 100
        self.assertEqual(stock["stock_of_unusable_vials"], 9)  # 5 unusable + 3 destroyed + 1 incident
        self.assertEqual(stock["vials_destroyed"], 3)
