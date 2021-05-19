from rest_framework.test import APIClient
from unittest import mock
from iaso.test import APITestCase
from iaso.models import Account


class PolioTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        account = Account.objects.create(name="Global Health Initiative")
        cls.yoda = cls.create_user_with_profile(username="yoda", account=account, permissions=["iaso_forms"])

    def setUp(self):
        """Make sure we have a fresh client at the beginning of each test"""
        self.client = APIClient()
        self.client.force_authenticate(self.yoda)

    @mock.patch("plugins.polio.serializers.get_national_level_preparedness_by_url", return_value={})
    def test_preview_preparedness(self, mock_get_national_level_preparedness_by_url):
        url = "https://docs.google.com/spreadsheets/d/1"
        response = self.client.post("/api/polio/campaigns/preview_preparedness/", {"google_sheet_url": url})
        self.assertEqual(response.status_code, 200)
        mock_get_national_level_preparedness_by_url.assert_called_with(url)
