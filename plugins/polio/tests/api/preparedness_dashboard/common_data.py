from iaso.models.org_unit import OrgUnitType
from iaso.test import APITestCase
from plugins.polio.models import Campaign, CampaignType
from plugins.polio.models.base import Round, SpreadSheetImport
from plugins.polio.permissions import POLIO_CONFIG_PERMISSION, POLIO_PERMISSION
from plugins.polio.tests.api.test import PolioTestCaseMixin


class PreparednessDashboardAPIBase(APITestCase, PolioTestCaseMixin):
    """
    Common setup for Preparedness Dashboard API tests.
    """

    PREPAREDNESS_DASHBOARD_API_URL = "/api/polio/preparedness_dashboard/"

    @classmethod
    def setUpTestData(cls):
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            "Datasource", "account", "Project"
        )

        cls.user_polio, cls.anon, cls.user_no_perms = cls.create_base_users(
            cls.account, [POLIO_PERMISSION], user_name="polio_user"
        )

        cls.superuser = cls.create_user_with_profile(
            username="superuser", account=cls.account, language="en", is_superuser=True
        )

        cls.user_config = cls.create_user_with_profile(
            username="config_user",
            account=cls.account,
            permissions=[POLIO_CONFIG_PERMISSION],
        )

        cls.user_both_perms = cls.create_user_with_profile(
            username="both_perms_user",
            account=cls.account,
            permissions=[POLIO_PERMISSION, POLIO_CONFIG_PERMISSION],
        )

        cls.country_type = OrgUnitType.objects.create(name="COUNTRY", short_name="COUNTRY")
        cls.district_type = OrgUnitType.objects.create(name="DISTRICT", short_name="DISTRICT")

        cls.campaign, cls.round_1, cls.round_2, cls.round_3, cls.country, cls.district = cls.create_campaign(
            obr_name="test-campaign",
            account=cls.account,
            source_version=cls.source_version,
            country_ou_type=cls.country_type,
            district_ou_type=cls.district_type,
        )

        cls.polio_type, _ = CampaignType.objects.get_or_create(name=CampaignType.POLIO)
        cls.campaign.campaign_types.add(cls.polio_type)

        cls.round_1.preparedness_spreadsheet_url = "https://docs.gogole.com/spreadsheets/d/spread1"
        cls.round_1.save()
        cls.round_2.preparedness_spreadsheet_url = "https://docs.gogole.com/spreadsheets/d/spread2"
        cls.round_2.save()

        cls.campaign_b, cls.campaign_b_round_1, cls.campaign_b_round_2, cls.campaign_b_round_3, _, _ = (
            cls.create_campaign(
                obr_name="other-campaign",
                account=cls.account,
                source_version=cls.source_version,
                country_ou_type=cls.country_type,
                district_ou_type=cls.district_type,
                country_name="Otherlandia",
                district_name="Otherville",
            )
        )
        cls.campaign_b.campaign_types.add(cls.polio_type)

        cls.non_polio_campaign = Campaign.objects.create(obr_name="measles-campaign", account=cls.account)

        cls.spreadsheet_url = "https://docs.gogole.com/spreadsheets/d/score-sheet"

        cls.ssi = SpreadSheetImport.objects.create(
            url=cls.spreadsheet_url,
            content={
                "title": "Preparedness Sheet",
                "sheets": [],
            },
            spread_id="score-sheet",
        )

        cls.round_with_ssi = Round.objects.create(
            campaign=cls.campaign,
            number=4,
            preparedness_spreadsheet_url=cls.spreadsheet_url,
        )
