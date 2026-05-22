from rest_framework import status

from iaso.models.org_unit import OrgUnitType
from iaso.test import APITestCase
from plugins.polio.models import CampaignType
from plugins.polio.permissions import POLIO_BUDGET_PERMISSION
from plugins.polio.tests.api.test import PolioTestCaseMixin


BASE_URL = "/api/polio/dashboards/campaigns/"


class CampaignDashboardAPITestCase(APITestCase, PolioTestCaseMixin):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            "Account", "Data source", "Project"
        )
        cls.user, cls.anon, cls.user_no_perms = cls.create_base_users(cls.account, [POLIO_BUDGET_PERMISSION])
        cls.country_type = OrgUnitType.objects.create(name="COUNTRY", short_name="COUNTRY")
        cls.district_type = OrgUnitType.objects.create(name="DISTRICT", short_name="DISTRICT")
        # Campaign type.
        cls.polio_type = CampaignType.objects.get(name=CampaignType.POLIO)

        cls.campaign_1, cls.round_1, cls.round_2, cls.round_3, cls.country, cls.district = cls.create_campaign(
            obr_name="Test Campaign 1",
            account=cls.account,
            source_version=cls.source_version,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.campaign_1.campaign_types.set([cls.polio_type])

        cls.campaign_2, _, _, _, _, _ = cls.create_campaign(
            obr_name="Test Campaign 2",
            account=cls.account,
            source_version=cls.source_version,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.campaign_2.campaign_types.set([cls.polio_type])

        cls.campaign_3_deleted, _, _, _, _, _ = cls.create_campaign(
            obr_name="Test Campaign 3",
            account=cls.account,
            source_version=cls.source_version,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )
        cls.campaign_3_deleted.campaign_types.set([cls.polio_type])
        cls.campaign_3_deleted.delete()

    def test_default_pagination_is_added(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{BASE_URL}")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["limit"], 20)

    def test_max_page_size_is_enforced(self):
        default_max_page_size = 1000  # default value from EtlPaginator
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{BASE_URL}?limit=2000&page=1")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["limit"], default_max_page_size)

    def test_list_campaigns(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{BASE_URL}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["campaigns"]
        result_obr_names = [c["obr_name"] for c in results]

        expected_names = [
            self.campaign_1.obr_name,
            self.campaign_2.obr_name,
        ]
        self.assertCountEqual(result_obr_names, expected_names)
