import datetime

from django.contrib.auth.models import AnonymousUser
from django.utils.timezone import now

import hat.menupermissions.models as permissions
from iaso import models as m
from iaso.test import APITestCase
from plugins.polio import models as pm
from plugins.polio.api.vaccines.supply_chain import AR_SET, PA_SET

BASE_URL = "/api/polio/vaccine/repository/"


class VaccineRepositoryAPITestCase(APITestCase):
    @classmethod
    def setUp(cls):
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="polio", default_version=cls.source_version_1)
        cls.now = now()

        cls.org_unit_type_country = m.OrgUnitType.objects.create(name="Country")
        cls.country = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Testland",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="TestlandRef",
        )

        cls.zambia = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Zambia",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="ZambiaRef",
        )

        # Create campaign type
        cls.polio_type, _ = pm.CampaignType.objects.get_or_create(name="Polio")

        # Create a campaign with rounds
        cls.campaign = pm.Campaign.objects.create(
            obr_name="Test Campaign",
            country=cls.country,
            account=cls.account,
        )
        cls.campaign.campaign_types.add(cls.polio_type)

        cls.campaign_round_1 = pm.Round.objects.create(
            campaign=cls.campaign,
            started_at=datetime.datetime(2021, 1, 1),
            ended_at=datetime.datetime(2021, 1, 31),
            number=1,
        )

        # Create vaccine request form
        cls.vaccine_request_form = pm.VaccineRequestForm.objects.create(
            campaign=cls.campaign,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=cls.now - datetime.timedelta(days=30),
            date_vrf_signature=cls.now - datetime.timedelta(days=20),
            date_dg_approval=cls.now - datetime.timedelta(days=10),
            quantities_ordered_in_doses=500,
        )

        # Create users
        cls.anon = AnonymousUser()
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

    def test_anonymous_user_can_see_list(self):
        """Test that anonymous users can access the list endpoint"""
        self.client.force_authenticate(user=self.anon)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 200)

    def test_authenticated_user_can_see_list(self):
        """Test that authenticated users can access the list endpoint"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 200)

    def test_list_response_structure(self):
        """Test the structure of the list response"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(BASE_URL)
        data = response.json()

        # Check pagination fields
        self.assertIn("count", data)
        self.assertIn("results", data)

        # Check result fields
        result = data["results"][0]
        self.assertIn("country_name", result)
        self.assertIn("campaign_obr_name", result)
        self.assertIn("round_id", result)
        self.assertIn("round_number", result)
        self.assertIn("start_date", result)
        self.assertIn("end_date", result)
        self.assertIn("vrf_data", result)
        self.assertIn("pre_alert_data", result)
        self.assertIn("form_a_data", result)

    def test_search_filter(self):
        """Test search functionality"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"{BASE_URL}?search=Test Campaign")
        data = response.json()
        self.assertEqual(len(data["results"]), 1)
        self.assertEqual(data["results"][0]["campaign_obr_name"], "Test Campaign")

    def test_ordering(self):
        """Test ordering functionality"""
        # Create another country and campaign for ordering test
        campaign2 = pm.Campaign.objects.create(
            obr_name="Another Campaign",
            country=self.zambia,
            account=self.account,
        )
        campaign2.campaign_types.add(self.polio_type)

        pm.VaccineRequestForm.objects.create(
            campaign=campaign2,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=self.now,
            date_vrf_signature=self.now,
            date_dg_approval=self.now,
            quantities_ordered_in_doses=500,
        )

        campaign2_round = pm.Round.objects.create(
            campaign=campaign2,
            started_at=datetime.datetime(2021, 2, 1),
            ended_at=datetime.datetime(2021, 2, 28),
            number=1,
        )

        self.client.force_authenticate(user=self.user)

        # Test ordering by campaign name
        response = self.client.get(f"{BASE_URL}?order=campaign__obr_name")
        data = response.json()
        self.assertEqual(data["results"][0]["campaign_obr_name"], "Another Campaign")
        self.assertEqual(data["results"][1]["campaign_obr_name"], "Test Campaign")

        # Test reverse ordering by campaign name
        response = self.client.get(f"{BASE_URL}?order=-campaign__obr_name")
        data = response.json()
        self.assertEqual(data["results"][0]["campaign_obr_name"], "Test Campaign")
        self.assertEqual(data["results"][1]["campaign_obr_name"], "Another Campaign")

        # Test ordering by country name
        response = self.client.get(f"{BASE_URL}?order=campaign__country__name")
        data = response.json()
        self.assertEqual(data["results"][0]["country_name"], "Testland")
        self.assertEqual(data["results"][1]["country_name"], "Zambia")

        # Test reverse ordering by country name
        response = self.client.get(f"{BASE_URL}?order=-campaign__country__name")
        data = response.json()
        self.assertEqual(data["results"][0]["country_name"], "Zambia")
        self.assertEqual(data["results"][1]["country_name"], "Testland")

        # Test ordering by start date
        response = self.client.get(f"{BASE_URL}?order=started_at")
        data = response.json()
        self.assertEqual(data["results"][0]["start_date"], self.campaign_round_1.started_at.strftime("%Y-%m-%d"))
        self.assertEqual(data["results"][1]["start_date"], campaign2_round.started_at.strftime("%Y-%m-%d"))

        # Test reverse ordering by start date
        response = self.client.get(f"{BASE_URL}?order=-started_at")
        data = response.json()
        self.assertEqual(data["results"][0]["start_date"], campaign2_round.started_at.strftime("%Y-%m-%d"))
        self.assertEqual(data["results"][1]["start_date"], self.campaign_round_1.started_at.strftime("%Y-%m-%d"))

    def test_filtering(self):
        """Test filtering functionality of VaccineReportingViewSet"""
        # Create test data
        campaign2 = pm.Campaign.objects.create(
            obr_name="Another Campaign",
            country=self.zambia,
            account=self.account,
        )
        campaign2.campaign_types.add(self.polio_type)

        preparing_campaign = pm.Campaign.objects.create(
            obr_name="Preparing Campaign",
            country=self.zambia,
            account=self.account,
        )
        preparing_campaign.campaign_types.add(self.polio_type)

        vrf2 = pm.VaccineRequestForm.objects.create(
            campaign=campaign2,
            date_vrf_signature=self.now,
            date_dg_approval=self.now,
            quantities_ordered_in_doses=500,
        )

        campaign2_round = pm.Round.objects.create(
            campaign=campaign2,
            started_at=datetime.datetime(2021, 2, 1),
            ended_at=datetime.datetime(2025, 1, 1),
            number=1,
        )

        preparing_campaign_round = pm.Round.objects.create(
            campaign=preparing_campaign,
            started_at=datetime.datetime(2025, 2, 1),
            ended_at=datetime.datetime(2025, 2, 28),
            number=1,
        )

        self.client.force_authenticate(user=self.user)

        # Test filtering by campaign status - ONGOING
        response = self.client.get(f"{BASE_URL}?campaign_status=ONGOING")
        data = response.json()
        self.assertEqual(len(data["results"]), 1)
        self.assertEqual(data["results"][0]["campaign_obr_name"], "Another Campaign")

        # Test filtering by campaign status - PAST
        response = self.client.get(f"{BASE_URL}?campaign_status=PAST")
        data = response.json()
        self.assertEqual(len(data["results"]), 1)
        self.assertEqual(data["results"][0]["campaign_obr_name"], "Test Campaign")

        # Test filtering by campaign status - PREPARING
        response = self.client.get(f"{BASE_URL}?campaign_status=PREPARING")
        data = response.json()
        self.assertEqual(len(data["results"]), 1)
        self.assertEqual(data["results"][0]["campaign_obr_name"], "Preparing Campaign")

        # Test filtering by country
        response = self.client.get(f"{BASE_URL}?countries={self.zambia.id}")
        data = response.json()
        self.assertEqual(len(data["results"]), 2)
        self.assertTrue(all(result["country_name"] == "Zambia" for result in data["results"]))

        # Test filtering by campaign name
        response = self.client.get(f"{BASE_URL}?campaign=Test Campaign")
        data = response.json()
        self.assertEqual(len(data["results"]), 1)
        self.assertEqual(data["results"][0]["campaign_obr_name"], "Test Campaign")

        # Test filtering by file type - VRF
        response = self.client.get(f"{BASE_URL}?file_type=VRF")
        data = response.json()
        self.assertEqual(len(data["results"]), 2)  # Both campaigns have VRFs

        # Test filtering by country block
        country_group = self.zambia.groups.first()
        if country_group:
            response = self.client.get(f"{BASE_URL}?country_block={country_group.id}")
            data = response.json()
            self.assertEqual(len(data["results"]), 2)
            self.assertTrue(all(result["country_name"] == "Zambia" for result in data["results"]))
