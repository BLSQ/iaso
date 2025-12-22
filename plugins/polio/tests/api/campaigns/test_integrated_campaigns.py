from django.utils import timezone
from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_400_BAD_REQUEST
from rest_framework.test import APIClient

from iaso import models as m
from iaso.test import APITestCase
from plugins.polio.models.base import CampaignType
from plugins.polio.permissions import POLIO_PERMISSION
from plugins.polio.preparedness.spreadsheet_manager import *
from plugins.polio.tests.api.test import PolioTestCaseMixin


CAMPAIGN_URL = "/api/polio/campaigns/"


class PolioAPITestCase(APITestCase, PolioTestCaseMixin):
    """
    Testing the integrated campaigns part of the campaigns API. Separated from the general API tests for clarity
    """

    data_source: m.DataSource
    source_version_1: m.SourceVersion
    org_unit: m.OrgUnit
    child_org_unit: m.OrgUnit

    @classmethod
    def setUpTestData(cls):
        cls.now = timezone.now()

        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            "Default source", "Account", "Project"
        )
        cls.user, cls.anon, cls.user_no_perms = cls.create_base_users(cls.account, [POLIO_PERMISSION])

        cls.country_type = m.OrgUnitType.objects.create(name="COUNTRY", short_name="country")
        cls.district_type = m.OrgUnitType.objects.create(name="DISTRICT", short_name="district")

        cls.campaign, cls.round_1, cls.round_2, cls.round_3, cls.country, cls.district = cls.create_campaign(
            "Campaign", cls.account, cls.source_version, cls.country_type, cls.district_type
        )
        cls.campaign_with_integrated, _, _, _, _, _ = cls.create_campaign(
            "Campaign with integrated", cls.account, cls.source_version, cls.country_type, cls.district_type
        )
        (
            cls.integrated_measles_campaign,
            cls.integrated_measles_round_1,
            cls.integrated_measles_round_2,
            cls.integrated_measles_round_3,
            cls.integrated_measles_country,
            cls.integrated_measles_district,
        ) = cls.create_campaign(
            "Measles Campaign Integrated",
            cls.account,
            cls.source_version,
            cls.country_type,
            cls.district_type,
            "Neighbouring country",
            "some district",
        )

        cls.integrated_measles_campaign.integrated_to = cls.campaign_with_integrated
        cls.integrated_measles_campaign.save()

        (
            cls.measles_campaign,
            cls.measles_round_1,
            cls.measles_round_2,
            cls.measles_round_3,
            cls.measles_country,
            cls.measles_district,
        ) = cls.create_campaign(
            "Measles Campaign",
            cls.account,
            cls.source_version,
            cls.country_type,
            cls.district_type,
            "Neighbouring country",
            "some district",
        )
        (
            cls.measles_campaign2,
            cls.measles2_round_1,
            cls.measles2_round_2,
            cls.measles2_round_3,
            cls.measles2_country,
            cls.measles2_district,
        ) = cls.create_campaign(
            "Measles Campaign 2",
            cls.account,
            cls.source_version,
            cls.country_type,
            cls.district_type,
            "Neighbouring country",
            "some district",
        )

        # Create campaign types
        # For some reason campaign types seem tp persist from other test class
        cls.polio_type = (
            CampaignType.objects.filter(name=CampaignType.POLIO).first()
            if CampaignType.objects.filter(name=CampaignType.POLIO).first()
            else CampaignType.objects.create(name=CampaignType.POLIO)
        )
        cls.measles_type = (
            CampaignType.objects.filter(name=CampaignType.MEASLES).first()
            if CampaignType.objects.filter(name=CampaignType.MEASLES).first()
            else CampaignType.objects.create(name=CampaignType.MEASLES)
        )
        cls.piri_type = (
            CampaignType.objects.filter(name=CampaignType.PIRI).first()
            if CampaignType.objects.filter(name=CampaignType.PIRI).first()
            else CampaignType.objects.create(name=CampaignType.PIRI)
        )

        cls.campaign.campaign_types.add(cls.polio_type)
        cls.campaign_with_integrated.campaign_types.add(cls.polio_type)
        cls.measles_campaign.campaign_types.add(cls.measles_type)
        cls.measles_campaign2.campaign_types.add(cls.measles_type)
        cls.integrated_measles_campaign.campaign_types.add(cls.measles_type)

    def setUp(self):
        """Make sure we have a fresh client at the beginning of each test"""
        self.client = APIClient()

    def test_details_includes_integrated_campaigns(self):
        """
        Check that response for polio campaigns includes integrated campaigns
        Check that response for non-polio campaigns includes "parent" campaigns
        """
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{CAMPAIGN_URL}{self.campaign.id}/")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertIn("integrated_campaigns", result.keys())
        self.assertEqual(result["integrated_campaigns"], [])

        response = self.client.get(f"{CAMPAIGN_URL}{self.campaign_with_integrated.id}/")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertIn("integrated_campaigns", result.keys())
        self.assertIsNotNone(result["integrated_campaigns"])

        integrated_campaigns = result["integrated_campaigns"]
        self.assertEqual(len(integrated_campaigns), 1)

        integrated_campaign = integrated_campaigns[0]

        self.assertEqual(integrated_campaign, self.integrated_measles_campaign.obr_name)

    def test_create_integrated_campaign(self):
        """
        Create a non-polio campaign that is integrated to an existing polio campaign
        """
        self.client.force_authenticate(self.user)

        data = {
            "obr_name": "New Non Polio Campaign",
            "account": self.account.pk,
            "detection_status": "PENDING",
            "integrated_to": self.campaign.obr_name,
            "campaign_types": [self.measles_type.pk],
            "rounds": [
                {
                    "number": 1,
                    "started_at": "2021-02-01",
                    "ended_at": "2021-02-20",
                }
            ],
        }

        response = self.client.post(f"{CAMPAIGN_URL}", data, format="json")
        result = self.assertJSONResponse(response, HTTP_201_CREATED)
        self.assertEqual(result["integrated_to"], self.campaign.obr_name)
        self.assertEqual(result["integrated_campaigns"], [])

    def test_create_polio_campaign_with_integrated(self):
        """
        Create a polio campaign that has one or more existing non-polio campaigns integrated to it
        """
        self.client.force_authenticate(self.user)

        data = {
            "obr_name": "New Polio Campaign",
            "account": self.account.pk,
            "detection_status": "PENDING",
            "integrated_campaigns": [self.measles_campaign.obr_name],
            "campaign_types": [self.polio_type.pk],
            "rounds": [
                {
                    "number": 1,
                    "started_at": "2021-02-01",
                    "ended_at": "2021-02-20",
                }
            ],
        }

        response = self.client.post(f"{CAMPAIGN_URL}", data, format="json")
        result = self.assertJSONResponse(response, HTTP_201_CREATED)
        self.assertIsNone(result["integrated_to"])
        self.assertEqual(result["integrated_campaigns"], [self.measles_campaign.obr_name])

    def test_update_integrated_campaigns(self):
        """
        Update a polio campaign's integrated campaigns. Using PUT method since it's the campaigns API (PATCH disabled)
        """
        self.client.force_authenticate(self.user)
        res = self.client.get(f"{CAMPAIGN_URL}{self.campaign.id}/")
        campaign_data = self.assertJSONResponse(res, HTTP_200_OK)
        campaign_data["integrated_campaigns"] = [self.measles_campaign.obr_name]

        response = self.client.put(f"{CAMPAIGN_URL}{self.campaign.id}/", campaign_data, format="json")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(result["integrated_campaigns"], [self.measles_campaign.obr_name])

        res = self.client.get(f"{CAMPAIGN_URL}{self.campaign_with_integrated.id}/")
        campaign_data = self.assertJSONResponse(res, HTTP_200_OK)
        campaign_data["integrated_campaigns"] = [
            self.integrated_measles_campaign.obr_name,
            self.measles_campaign.obr_name,
        ]

        response = self.client.put(f"{CAMPAIGN_URL}{self.campaign_with_integrated.id}/", campaign_data, format="json")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(len(result["integrated_campaigns"]), 2)
        self.assertIn(
            result["integrated_campaigns"][0],
            [
                self.integrated_measles_campaign.obr_name,
                self.measles_campaign.obr_name,
            ],
        )
        self.assertIn(
            result["integrated_campaigns"][1],
            [
                self.integrated_measles_campaign.obr_name,
                self.measles_campaign.obr_name,
            ],
        )

    def test_update_parent_campaign(self):
        """
        Update a non-polio campaign's "parent campaign" (the campaign it's integrated to). Using PUT method since it's the campaigns API (PATCH disabled)
        """
        self.client.force_authenticate(self.user)
        res = self.client.get(f"{CAMPAIGN_URL}{self.measles_campaign.id}/")
        campaign_data = self.assertJSONResponse(res, HTTP_200_OK)
        campaign_data["integrated_to"] = self.campaign.obr_name

        response = self.client.put(f"{CAMPAIGN_URL}{self.measles_campaign.id}/", campaign_data, format="json")
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(result["integrated_to"], self.campaign.obr_name)

        res = self.client.get(f"{CAMPAIGN_URL}{self.integrated_measles_campaign.id}/")
        campaign_data = self.assertJSONResponse(res, HTTP_200_OK)
        campaign_data["integrated_to"] = self.campaign.obr_name

        response = self.client.put(
            f"{CAMPAIGN_URL}{self.integrated_measles_campaign.id}/", campaign_data, format="json"
        )
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(result["integrated_to"], self.campaign.obr_name)

    def test_cannot_integrate_polio_campaign(self):
        """
        Non-polio campaigns cannot be created or updated to be integrated to other non-polio campaigns
        """
        self.client.force_authenticate(self.user)

        data = {
            "obr_name": "Another Polio Campaign",
            "account": self.account.pk,
            "detection_status": "PENDING",
            "integrated_campaigns": [self.campaign.obr_name],
            "campaign_types": [self.polio_type.pk],
            "rounds": [
                {
                    "number": 1,
                    "started_at": "2021-02-01",
                    "ended_at": "2021-02-20",
                }
            ],
        }

        response = self.client.post(f"{CAMPAIGN_URL}", data, format="json")
        self.assertJSONResponse(response, HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.user)
        res = self.client.get(f"{CAMPAIGN_URL}{self.campaign.id}/")
        campaign_data = self.assertJSONResponse(res, HTTP_200_OK)
        campaign_data["integrated_campaigns"] = [self.campaign_with_integrated.obr_name]

        response = self.client.put(f"{CAMPAIGN_URL}{self.campaign.id}/", campaign_data, format="json")
        self.assertJSONResponse(response, HTTP_400_BAD_REQUEST)

    def test_cannot_integrate_to_non_polio_campaign(self):
        """
        Polio campaigns cannot be created or updated to be integrated to other polio campaigns
        """
        self.client.force_authenticate(self.user)

        data = {
            "obr_name": "Another Non Polio Campaign",
            "account": self.account.pk,
            "detection_status": "PENDING",
            "integrated_to": self.measles_campaign.obr_name,
            "campaign_types": [self.measles_type.pk],
            "rounds": [
                {
                    "number": 1,
                    "started_at": "2021-02-01",
                    "ended_at": "2021-02-20",
                }
            ],
        }

        response = self.client.post(f"{CAMPAIGN_URL}", data, format="json")
        self.assertJSONResponse(response, HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.user)
        res = self.client.get(f"{CAMPAIGN_URL}{self.measles_campaign.id}/")
        campaign_data = self.assertJSONResponse(res, HTTP_200_OK)
        campaign_data["integrated_to"] = self.measles_campaign2.obr_name

        response = self.client.put(f"{CAMPAIGN_URL}{self.campaign.id}/", campaign_data, format="json")
        self.assertJSONResponse(response, HTTP_400_BAD_REQUEST)

    def test_campaign_type_cannot_be_changed_if_integrated(self):
        self.client.force_authenticate(self.user)

        # Non polio campaign integrated to polio campaign
        res = self.client.get(f"{CAMPAIGN_URL}{self.integrated_measles_campaign.id}/")
        campaign_data = self.assertJSONResponse(res, HTTP_200_OK)
        campaign_data["campaign_types"] = [self.piri_type.pk]

        response = self.client.put(
            f"{CAMPAIGN_URL}{self.integrated_measles_campaign.id}/", campaign_data, format="json"
        )
        result = self.assertJSONResponse(response, HTTP_200_OK)
        self.assertEqual(result["campaign_types"], [self.piri_type.pk])

        campaign_data["campaign_types"] = [self.polio_type.pk]
        response = self.client.put(
            f"{CAMPAIGN_URL}{self.integrated_measles_campaign.id}/", campaign_data, format="json"
        )
        result = self.assertJSONResponse(response, HTTP_400_BAD_REQUEST)

        # # Polio campaign with integrated campaign
        res = self.client.get(f"{CAMPAIGN_URL}{self.campaign_with_integrated.id}/")
        campaign_data = self.assertJSONResponse(res, HTTP_200_OK)
        campaign_data["campaign_types"] = [self.measles_type.pk]

        response = self.client.put(f"{CAMPAIGN_URL}{self.campaign_with_integrated.id}/", campaign_data, format="json")
        self.assertJSONResponse(response, HTTP_400_BAD_REQUEST)

    def test_validation(self):
        self.client.force_authenticate(self.user)

        data = {
            "obr_name": "Yet Another Polio Campaign",
            "account": self.account.pk,
            "detection_status": "PENDING",
            "integrated_campaigns": [f"{self.measles_campaign2.obr_name}", "Not a valid OBR name"],
            "campaign_types": [self.polio_type.pk],
            "rounds": [
                {
                    "number": 1,
                    "started_at": "2021-02-01",
                    "ended_at": "2021-02-20",
                }
            ],
        }

        response = self.client.post(f"{CAMPAIGN_URL}", data, format="json")
        error = self.assertJSONResponse(response, HTTP_400_BAD_REQUEST)
        print("INTEGRATED CAMPAIGNS", error)
        self.assertEqual(
            error["integrated_campaigns"],
            [f"Could not find corresponding campaign for all OBR names {str(data['integrated_campaigns'])}"],
        )

        data = {
            "obr_name": "Yet Another Non Polio Campaign",
            "account": self.account.pk,
            "detection_status": "PENDING",
            "integrated_to": "Not a valid OBR name",
            "campaign_types": [self.measles_type.pk],
            "rounds": [
                {
                    "number": 1,
                    "started_at": "2021-02-01",
                    "ended_at": "2021-02-20",
                }
            ],
        }

        response = self.client.post(f"{CAMPAIGN_URL}", data, format="json")
        error = self.assertJSONResponse(response, HTTP_400_BAD_REQUEST)
        self.assertEqual(error["integrated_to"], [f"No campaign found for OBR name {data['integrated_to']}"])
