import datetime
import time_machine
from django.contrib.auth.models import AnonymousUser
from iaso import models as m
from iaso.test import APITestCase
from plugins.polio import models as pm
import hat.menupermissions.models as permissions

BASE_URL = "/api/polio/vaccine/vaccine_stock/"
DT = datetime.datetime(2024, 10, 29, 14, 0, 0, 0, tzinfo=datetime.timezone.utc)


@time_machine.travel(DT, tick=False)
class VaccineStockEarmarkedTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = DT
        # Create account and project structure
        cls.account = m.Account.objects.create(name="test_account")
        cls.project = m.Project.objects.create(name="Polio", app_id="polio.projects", account=cls.account)

        # Create org unit type and structure
        cls.org_unit_type_country = m.OrgUnitType.objects.create(name="COUNTRY", category="COUNTRY")
        cls.org_unit_type_country.projects.set([cls.project])
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.data_source.projects.set([cls.project])
        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)

        # Create users with permissions
        cls.user_rw_perms = cls.create_user_with_profile(
            username="user_rw_perms",
            account=cls.account,
            permissions=[
                permissions._POLIO_VACCINE_STOCK_MANAGEMENT_READ,
                permissions._POLIO_VACCINE_STOCK_MANAGEMENT_WRITE,
            ],
        )

        # Create test country
        cls.country = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Test Country",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="TestCountry",
        )

        # Create test campaign
        cls.campaign = pm.Campaign.objects.create(
            obr_name="Test Campaign",
            country=cls.country,
            account=cls.account,
        )

        # Create test round
        cls.round = pm.Round.objects.create(
            campaign=cls.campaign,
            number=1,
            started_at=cls.now,
            ended_at=cls.now + datetime.timedelta(days=5),
        )

        # Create test vaccine stock
        cls.vaccine_stock = pm.VaccineStock.objects.create(
            account=cls.account,
            vaccine=pm.VACCINES[0][0],
            country=cls.country,
        )

        cls.vaccine_request_form = pm.VaccineRequestForm.objects.create(
            campaign=cls.campaign,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=cls.now - datetime.timedelta(days=30),
            date_vrf_signature=cls.now - datetime.timedelta(days=20),
            date_dg_approval=cls.now - datetime.timedelta(days=10),
            quantities_ordered_in_doses=50000,
        )

        cls.vaccine_arrival_report = pm.VaccineArrivalReport.objects.create(
            request_form=cls.vaccine_request_form,
            arrival_report_date=cls.now - datetime.timedelta(days=5),
            doses_received=50000,
            doses_shipped=50000,
            po_number="PO123",
            lot_numbers=["LOT123", "LOT456"],
            expiration_date=cls.now + datetime.timedelta(days=180),
        )

    def test_earmarked_stock_used_appears_in_unusable_vials(self):
        """Test that earmarked stock of type USED appears in unusable vials list"""
        self.client.force_authenticate(self.user_rw_perms)

        # Create earmarked stock of type USED
        earmarked_stock = pm.EarmarkedStock.objects.create(
            vaccine_stock=self.vaccine_stock,
            campaign=self.campaign,
            round=self.round,
            vials_earmarked=100,
            doses_earmarked=2000,
            earmarked_stock_type=pm.EarmarkedStock.EarmarkedStockChoices.USED,
            created_at=self.now - datetime.timedelta(days=1),
        )

        # Get unusable vials through API
        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/get_unusable_vials/")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Verify earmarked stock appears in list
        found = False
        for entry in data["results"]:
            if entry["vials_in"] == 100 and entry["doses_in"] == 2000 and entry["type"] == "earmarked_stock__used":
                found = True
                break

        self.assertTrue(found, "Earmarked stock of type USED should appear in unusable vials list")

    def test_earmarked_stock_creation_not_in_unusable_vials(self):
        """Test that earmarked stock of type CREATEDdoes not appear in unusable vials list"""
        self.client.force_authenticate(self.user_rw_perms)

        # Create earmarked stock of type CREATED
        earmarked_stock = pm.EarmarkedStock.objects.create(
            vaccine_stock=self.vaccine_stock,
            campaign=self.campaign,
            round=self.round,
            vials_earmarked=100,
            doses_earmarked=2000,
            earmarked_stock_type=pm.EarmarkedStock.EarmarkedStockChoices.CREATED,
            created_at=self.now - datetime.timedelta(days=1),
        )

        # Get unusable vials through API
        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/get_unusable_vials/")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Verify earmarked stock does not appear in list
        found = False
        for entry in data["results"]:
            if entry["vials_in"] == 100 and entry["doses_in"] == 2000 and entry["type"] == "earmarked_stock__created":
                found = True
                break

        self.assertFalse(found, "Earmarked stock of type CREATED should not appear in unusable vials list")

    def test_earmarked_stock_affects_summary_totals(self):
        """Test that earmarked stocks affect summary totals appropriately"""
        self.client.force_authenticate(self.user_rw_perms)

        # Get initial summary
        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/summary/")
        self.assertEqual(response.status_code, 200)
        initial_data = response.json()
        initial_unusable = initial_data["total_unusable_vials"]
        initial_usable = initial_data["total_usable_vials"]

        # Create earmarked stock of type USED (moves from usable to unusable)
        used_stock = pm.EarmarkedStock.objects.create(
            vaccine_stock=self.vaccine_stock,
            campaign=self.campaign,
            round=self.round,
            vials_earmarked=100,
            doses_earmarked=2000,
            earmarked_stock_type=pm.EarmarkedStock.EarmarkedStockChoices.USED,
            created_at=self.now - datetime.timedelta(days=1),
        )

        # Create earmarked stock of type CREATED (adds to usable stock)
        created_stock = pm.EarmarkedStock.objects.create(
            vaccine_stock=self.vaccine_stock,
            campaign=self.campaign,
            round=self.round,
            vials_earmarked=50,
            doses_earmarked=1000,
            earmarked_stock_type=pm.EarmarkedStock.EarmarkedStockChoices.CREATED,
            created_at=self.now - datetime.timedelta(days=1),
        )

        # Get updated summary
        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/summary/")
        self.assertEqual(response.status_code, 200)
        updated_data = response.json()

        # Verify USED stock affects unusable total
        self.assertEqual(updated_data["total_unusable_vials"], initial_unusable + 100)

        # Verify CREATED stock affects usable total
        self.assertEqual(updated_data["total_usable_vials"], initial_usable - 50)

        # if we now create a RETURNED stock, it should affect the usable total

        returned_stock = pm.EarmarkedStock.objects.create(
            vaccine_stock=self.vaccine_stock,
            campaign=self.campaign,
            round=self.round,
            vials_earmarked=50,
            doses_earmarked=1000,
            earmarked_stock_type=pm.EarmarkedStock.EarmarkedStockChoices.RETURNED,
            created_at=self.now - datetime.timedelta(days=1),
        )

        # Get updated summary
        response = self.client.get(f"{BASE_URL}{self.vaccine_stock.id}/summary/")
        self.assertEqual(response.status_code, 200)
        updated_data = response.json()
        self.assertEqual(updated_data["total_usable_vials"], initial_usable)

        # Test EarmarkedStockViewSet endpoints
        earmarked_url = "/api/polio/vaccine/stock/earmarked_stock/"

        # Test list endpoint
        response = self.client.get(earmarked_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 3)  # Should return all 3 earmarked stocks we created

        # Test detail endpoint
        response = self.client.get(f"{earmarked_url}{created_stock.id}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["campaign"], self.campaign.obr_name)
        self.assertEqual(data["round_number"], self.round.number)
        self.assertEqual(data["vials_earmarked"], 50)
        self.assertEqual(data["doses_earmarked"], 1000)
        self.assertEqual(data["earmarked_stock_type"], "created")
