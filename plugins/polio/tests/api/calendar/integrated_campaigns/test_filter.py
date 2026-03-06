from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from iaso.test import APITestCase
from plugins.polio.api.calendar.filter import IntegratedCampaignFilterBackend
from plugins.polio.models import CampaignType
from plugins.polio.permissions import POLIO_PERMISSION
from plugins.polio.preparedness.spreadsheet_manager import *
from plugins.polio.tests.api.test import PolioTestCaseMixin


URL = "/api/polio/v2/integratedcampaigns/"


class IntegratedCampaignsFilterTestCase(APITestCase, PolioTestCaseMixin):
    @classmethod
    def setUpTestData(cls):
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            source_name="Data source", account_name="Account", project_name="Project"
        )
        cls.user, cls.anon, cls.user_no_perms = cls.create_base_users(
            account=cls.account, permissions=[POLIO_PERMISSION]
        )
        cls.country_type = cls.create_org_unit_type(name="COUNTRY", category="COUNTRY", projects=[cls.project])
        cls.district_type = cls.create_org_unit_type(name="DISTRICT", category="DISTRICT", projects=[cls.project])

        # Campaign types
        cls.polio_type = CampaignType.objects.get(name=CampaignType.POLIO)
        cls.measles_type = CampaignType.objects.get(name=CampaignType.MEASLES)

        # Polio Campaigns
        cls.campaign, cls.rnd1, cls.rnd2, cls.rnd3, cls.country, cls.district = cls.create_campaign(
            obr_name="Polio Campaign",
            account=cls.account,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
            country_name="Testland",
            district_name="District 9",
            source_version=cls.source_version,
        )
        cls.campaign.campaign_types.set([cls.polio_type])

        cls.campaign2, cls.c2_rnd1, cls.c2_rnd2, cls.c2_rnd3, _, _ = cls.create_campaign(
            obr_name="Polio Campaign2",
            account=cls.account,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
            country_name="Lalaland",
            district_name="District 10",
            source_version=cls.source_version,
        )
        cls.campaign2.campaign_types.set([cls.polio_type])

        cls.campaign3, cls.c3_rnd1, cls.c3_rnd2, cls.c3_rnd3, _, _ = cls.create_campaign(
            obr_name="Polio Campaign3",
            account=cls.account,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
            country_name="Polygondwanaland",
            district_name="District 11",
            source_version=cls.source_version,
        )
        cls.campaign3.campaign_types.set([cls.polio_type])

        # Integrated measles campaign
        cls.measles_integrated, cls.msls_int_rnd1, cls.msls_int_rnd2, cls.msls_int_rnd3, _, _ = cls.create_campaign(
            obr_name="Measles integrated",
            account=cls.account,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
            country_name="Zombieland",
            district_name="District 12",
            source_version=cls.source_version,
        )
        cls.measles_integrated.campaign_types.set([cls.measles_type])
        cls.measles_integrated.integrated_to = cls.campaign
        cls.measles_integrated.save()

        # Non-integrated measles campaign
        cls.measles_not_integrated, cls.msls_no_int_rnd1, cls.msls_no_int_rnd2, cls.msls_no_int_rnd3, _, _ = (
            cls.create_campaign(
                obr_name="Measles not integrated",
                account=cls.account,
                country_ou_type=cls.country_type,
                district_ou_type=cls.district_type,
                country_name="Phantasialand",
                district_name="District 13",
                source_version=cls.source_version,
            )
        )
        cls.measles_not_integrated.campaign_types.set([cls.measles_type])

    def setUp(self):
        self.filter_backend = IntegratedCampaignFilterBackend()

    def _request(self, url=URL, query_params=None):
        factory = APIRequestFactory()
        request = factory.get(url, query_params)
        return Request(request)

    def test_no_params_return_empty_qs(self):
        request = self._request(query_params=None)
        queryset = Campaign.objects.all()
        filtered_queryset = self.filter_backend.filter_queryset(request, queryset, view=None)
        self.assertEqual(filtered_queryset.count(), 0)

    def test_filter_by_obr_names(self):
        request = self._request(
            query_params={"obr_names": f"{self.campaign.obr_name},{self.campaign2.obr_name},{self.campaign3.obr_name}"}
        )
        queryset = Campaign.objects.all()
        filtered_queryset = self.filter_backend.filter_queryset(request, queryset, view=None)
        self.assertEqual(filtered_queryset.count(), 1)
        self.assertEqual(filtered_queryset.first().obr_name, self.measles_integrated.obr_name)

    def test_filter_strips_whitespace(self):
        request = self._request(
            query_params={
                "obr_names": f"{self.campaign.obr_name} , {self.campaign2.obr_name},{self.campaign3.obr_name}"
            }
        )
        queryset = Campaign.objects.all()
        filtered_queryset = self.filter_backend.filter_queryset(request, queryset, view=None)
        self.assertEqual(filtered_queryset.count(), 1)
        self.assertEqual(filtered_queryset.first().obr_name, self.measles_integrated.obr_name)

    def test_filter_wrong_params(self):
        """Expect an empty queryset if the params are wrong, since the filter won't find anything"""
        request = self._request(
            query_params={"obr_names": f"{self.campaign.id} , {self.campaign2.id},{self.campaign3.id}"}
        )
        queryset = Campaign.objects.all()
        filtered_queryset = self.filter_backend.filter_queryset(request, queryset, view=None)
        self.assertEqual(filtered_queryset.count(), 0)

        request = self._request(
            query_params={"obr_names": [{self.campaign.obr_name}, {self.campaign2.obr_name}, {self.campaign3.obr_name}]}
        )
        queryset = Campaign.objects.all()
        filtered_queryset = self.filter_backend.filter_queryset(request, queryset, view=None)
        self.assertEqual(filtered_queryset.count(), 0)
