from iaso.test import APITestCase
from plugins.polio.models import CampaignType
from plugins.polio.permissions import POLIO_PERMISSION
from plugins.polio.tests.api.test import PolioTestCaseMixin


URL = "/api/polio/v2/integratedcampaigns/"


class IntegratedCampaignsTestCase(APITestCase, PolioTestCaseMixin):
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

    def test_anon_user_has_access(self):
        self.client.force_authenticate(self.anon)
        response = self.client.get(
            URL,
            format="json",
        )
        self.assertJSONResponse(response, 200)

    def test_logged_user_has_access(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(
            URL,
            format="json",
        )
        self.assertJSONResponse(response, 200)
