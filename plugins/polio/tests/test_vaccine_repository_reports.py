import datetime

from django.contrib.auth.models import AnonymousUser
from django.utils.timezone import now

from iaso import models as m
from iaso.test import APITestCase
from plugins.polio import models as pm
from plugins.polio.tests.api.test import PolioTestCaseMixin


REPORTS_URL = "/api/polio/vaccine/repository_reports/"


class VaccineRepositoryReportsAPITestCase(APITestCase, PolioTestCaseMixin):
    @classmethod
    def setUp(cls):
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="polio", default_version=cls.source_version_1)
        cls.now = now()

        cls.org_unit_type_country = m.OrgUnitType.objects.create(name="Country")
        cls.org_unit_type_district = m.OrgUnitType.objects.create(name="District")

        cls.campaign, cls.campaign_round_1, _, _, cls.testland, _district = cls.create_campaign(
            obr_name="Test Campaign",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.org_unit_type_country,
            country_name="Testland",
            district_ou_type=cls.org_unit_type_district,
        )
        cls.campaign_no_vrf, cls.campaign_no_vrf_round_1, _, _, _, _ = cls.create_campaign(
            obr_name="No VRF",
            account=cls.account,
            source_version=cls.source_version_1,
            country_ou_type=cls.org_unit_type_country,
            country_name="Testland",
            district_ou_type=cls.org_unit_type_district,
        )
        # Has same country as cls.campaign, but no vrf. Should not appear in any API payload
        cls.campaign_no_vrf.country = cls.testland
        cls.campaign_no_vrf.save()

        cls.zambia = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Zambia",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="ZambiaRef",
        )

        # Create campaign type
        cls.polio_type, _ = pm.CampaignType.objects.get_or_create(name="Polio")

        cls.campaign.campaign_types.add(cls.polio_type)

        # Create vaccine stock and reports
        cls.vaccine_stock = pm.VaccineStock.objects.create(
            account=cls.account, country=cls.testland, vaccine=pm.VACCINES[0][0]
        )

        cls.incident_report = pm.IncidentReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            date_of_incident_report=cls.now - datetime.timedelta(days=5),
            incident_report_received_by_rrt=cls.now,
            usable_vials=100,
            unusable_vials=0,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
            title="Test incident",
            comment="Test incident",
        )

        cls.destruction_report = pm.DestructionReport.objects.create(
            vaccine_stock=cls.vaccine_stock,
            rrt_destruction_report_reception_date=cls.now,
            destruction_report_date=cls.now - datetime.timedelta(days=2),
            unusable_vials_destroyed=50,
            action="EXPIRED",
            comment="Test destruction",
        )

        # Create users
        cls.anon = AnonymousUser()
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

    def test_anonymous_user_can_see_reports(self):
        """Test that anonymous users can access the reports endpoint"""
        self.client.force_authenticate(user=self.anon)
        response = self.client.get(REPORTS_URL)
        self.assertEqual(response.status_code, 200)

    def test_reports_list_response_structure(self):
        """Test the structure of the reports list response"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(REPORTS_URL)
        data = response.json()["results"]

        # Check result fields
        result = data[0]
        self.assertIn("country_name", result)
        self.assertIn("country_id", result)
        self.assertIn("vaccine", result)
        self.assertIn("incident_report_data", result)
        self.assertIn("destruction_report_data", result)

    def test_reports_filtering(self):
        """Test filtering functionality of reports endpoint"""
        self.client.force_authenticate(user=self.user)

        # Test filtering by country
        response = self.client.get(f"{REPORTS_URL}?countries={self.testland.id}")
        data = response.json()["results"]
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["country_name"], "Testland")

        # Test filtering by vaccine name
        response = self.client.get(f"{REPORTS_URL}?vaccine_name={pm.VACCINES[0][0]}")
        data = response.json()["results"]
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["vaccine"], pm.VACCINES[0][0])

        # Test filtering by file type
        response = self.client.get(f"{REPORTS_URL}?file_type=INCIDENT")
        data = response.json()["results"]
        self.assertEqual(len(data), 1)
        self.assertTrue(len(data[0]["incident_report_data"]) > 0)

        response = self.client.get(f"{REPORTS_URL}?file_type=DESTRUCTION")
        data = response.json()["results"]
        self.assertEqual(len(data), 1)
        self.assertTrue(len(data[0]["destruction_report_data"]) > 0)

        # Test filtering by country block
        country_group = self.testland.groups.first()
        if country_group:
            response = self.client.get(f"{REPORTS_URL}?country_block={country_group.id}")
            data = response.json()["results"]
            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]["country_name"], "Testland")

    def test_reports_ordering(self):
        """Test ordering functionality of reports endpoint"""
        # Create another vaccine stock in Zambia
        zambia_stock = pm.VaccineStock.objects.create(
            account=self.account, country=self.zambia, vaccine=pm.VACCINES[1][0]
        )
        pm.IncidentReport.objects.create(
            vaccine_stock=zambia_stock,
            date_of_incident_report=self.now,
            incident_report_received_by_rrt=self.now,
            usable_vials=100,
            unusable_vials=0,
            stock_correction=pm.IncidentReport.StockCorrectionChoices.VVM_REACHED_DISCARD_POINT,
            title="Zambia incident",
            comment="Zambia incident",
        )

        self.client.force_authenticate(user=self.user)

        # Test ordering by country name
        response = self.client.get(f"{REPORTS_URL}?order=country__name")
        data = response.json()["results"]
        self.assertEqual(data[0]["country_name"], "Testland")
        self.assertEqual(data[1]["country_name"], "Zambia")

        # Test reverse ordering by country name
        response = self.client.get(f"{REPORTS_URL}?order=-country__name")
        data = response.json()["results"]
        self.assertEqual(data[0]["country_name"], "Zambia")
        self.assertEqual(data[1]["country_name"], "Testland")

        # Test ordering by vaccine
        response = self.client.get(f"{REPORTS_URL}?order=vaccine")
        data = response.json()["results"]
        self.assertEqual(data[0]["vaccine"], pm.VACCINES[0][0])
        self.assertEqual(data[1]["vaccine"], pm.VACCINES[1][0])
