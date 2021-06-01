from rest_framework.test import APIClient
from unittest import mock
from iaso.test import APITestCase, TestCase
from iaso.models import Account
from .preparedness.exceptions import InvalidFormatError
from .models import Campaign, Preparedness, Round
from .preparedness.calculator import get_preparedness_score
import json


class PolioAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        account = Account.objects.create(name="Global Health Initiative")
        cls.yoda = cls.create_user_with_profile(username="yoda", account=account, permissions=["iaso_forms"])

    def setUp(self):
        """Make sure we have a fresh client at the beginning of each test"""
        self.client = APIClient()
        self.client.force_authenticate(self.yoda)

    @mock.patch("plugins.polio.serializers.get_national_level_preparedness", return_value={})
    @mock.patch("plugins.polio.serializers.get_regional_level_preparedness", return_value={})
    @mock.patch("plugins.polio.serializers.open_sheet_by_url", return_value={})
    def test_preview_preparedness(self, mock_open_sheet_by_url, *_):
        url = "https://docs.google.com/spreadsheets/d/1"
        response = self.client.post("/api/polio/campaigns/preview_preparedness/", {"google_sheet_url": url})
        self.assertEqual(response.status_code, 200)
        mock_open_sheet_by_url.assert_called_with(url)

    @mock.patch("plugins.polio.serializers.get_national_level_preparedness", return_value={})
    @mock.patch("plugins.polio.serializers.get_regional_level_preparedness", return_value={})
    @mock.patch("plugins.polio.serializers.open_sheet_by_url", return_value={})
    def test_preview_invalid_document(self, mock_open_sheet_by_url, *_):
        url = "https://docs.google.com/spreadsheets/d/1"
        error_message = "Error test_preview_invalid_document"
        mock_open_sheet_by_url.side_effect = InvalidFormatError(error_message)
        response = self.client.post("/api/polio/campaigns/preview_preparedness/", {"google_sheet_url": url})
        mock_open_sheet_by_url.assert_called_with(url)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json().get("non_field_errors"), [error_message])

    def test_create_campaign(self):
        self.assertEqual(Campaign.objects.count(), 0)

        payload = {
            "obr_name": "obr_name",
            "detection_status": "PENDING",
            "round_one": {},
            "round_two": {},
        }
        response = self.client.post("/api/polio/campaigns/", payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Campaign.objects.count(), 1)

    def test_create_campaign_with_preparedness_data(self):
        self.assertEqual(Preparedness.objects.count(), 0)
        preparedness = {
            "spreadsheet_url": "https://docs.google.com/spreadsheets/d/1",
            "national_score": 10,
            "regional_score": 80,
            "district_score": 70,
            "payload": json.dumps({}),
        }

        payload = {
            "obr_name": "obr_name",
            "detection_status": "PENDING",
            "preparedness_data": preparedness,
            "round_one": {},
            "round_two": {},
        }
        response = self.client.post("/api/polio/campaigns/", payload, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Preparedness.objects.count(), 1)

    def test_refresh_preparedness_data(self):
        self.assertEqual(Preparedness.objects.count(), 0)
        campaign = Campaign.objects.create(
            obr_name="obr_name",
            detection_status="PENDING",
            round_one=Round.objects.create(),
            round_two=Round.objects.create(),
        )

        preparedness = {
            "spreadsheet_url": "https://docs.google.com/spreadsheets/d/1",
            "national_score": 10,
            "regional_score": 80,
            "district_score": 70,
            "payload": json.dumps({}),
        }

        payload = {
            "obr_name": "obr_name",
            "detection_status": "PENDING",
            "preparedness_data": preparedness,
            "round_one": {},
            "round_two": {},
        }
        response = self.client.put(f"/api/polio/campaigns/{campaign.pk}/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(campaign.preparedness_set.count(), 1)


class CampaignCalculatorTestCase(TestCase):
    def setUp(self) -> None:
        with open("./plugins/polio/preparedness/test_data/example1.json", "r") as json_data:
            self.preparedness_preview = json.load(json_data)

    def test_national_score(self):
        result = get_preparedness_score(self.preparedness_preview)
        self.assertEqual(result["national_score"], 93)

    def test_regional_score(self):
        result = get_preparedness_score(self.preparedness_preview)
        self.assertEqual(result["regional_score"], 68.4)

    def test_district_score(self):
        result = get_preparedness_score(self.preparedness_preview)
        self.assertAlmostEqual(result["district_score"], 56.25)
