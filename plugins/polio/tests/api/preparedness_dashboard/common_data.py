from iaso.models.org_unit import OrgUnitType
from iaso.test import APITestCase
from plugins.polio.models import Campaign, CampaignType
from plugins.polio.models.base import Round, SpreadSheetImport
from plugins.polio.permissions import POLIO_CONFIG_PERMISSION, POLIO_PERMISSION
from plugins.polio.tests.api.test import PolioTestCaseMixin


# The 10 preparedness indicators (everything in `parser.indicators` except `status_score`).
INDICATOR_KEYS = [
    "operational_fund",
    "vaccine_and_droppers_received",
    "vaccine_cold_chain_assessment",
    "vaccine_monitors_training_and_deployment",
    "penmarkers_supply",
    "sia_training",
    "sia_micro_planning",
    "communication_sm_fund",
    "communication_sm_activities",
    "communication_c4d",
]

# Per-district section scores (computed from the score box, may be null).
DISTRICT_SCORE_KEYS = [
    "planning_score",
    "training_score",
    "monitoring_score",
    "vaccine_score",
    "advocacy_score",
    "adverse_score",
    "security_score",
    "status_score",
]

# Indicator cells can hold a number, a leftover spreadsheet string ("3 semanas") or be empty/null.
_INDICATOR_VALUE_SCHEMA = {"type": ["number", "string", "null"]}
_SCORE_VALUE_SCHEMA = {"type": ["number", "null"]}

_NATIONAL_SCHEMA = {
    "type": "object",
    "properties": {
        **dict.fromkeys(INDICATOR_KEYS, _INDICATOR_VALUE_SCHEMA),
        "status_score": _SCORE_VALUE_SCHEMA,
        "round": {"type": "string"},
    },
    "required": INDICATOR_KEYS + ["status_score", "round"],
}

_REGION_SCHEMA = {
    "type": "object",
    "properties": {
        **dict.fromkeys(INDICATOR_KEYS, _INDICATOR_VALUE_SCHEMA),
        "status_score": _SCORE_VALUE_SCHEMA,
    },
    "required": INDICATOR_KEYS + ["status_score"],
}

# Districts always carry the section scores + a region, but indicators are optional
# (broken "#REF!" rows only expose the score skeleton).
_DISTRICT_SCHEMA = {
    "type": "object",
    "properties": {
        **dict.fromkeys(DISTRICT_SCORE_KEYS, _SCORE_VALUE_SCHEMA),
        "region": {"type": "string"},
        **dict.fromkeys(INDICATOR_KEYS, _INDICATOR_VALUE_SCHEMA),
    },
    "required": DISTRICT_SCORE_KEYS + ["region"],
}

_TOTALS_SCHEMA = {
    "type": "object",
    "properties": {
        "national_score": {"type": "number"},
        "regional_score": {"type": "number"},
        "district_score": {"type": "number"},
    },
    "required": ["national_score", "regional_score", "district_score"],
}

SCORES_SCHEMA = {
    "type": "object",
    "properties": {
        "score": _SCORE_VALUE_SCHEMA,
        "national": _NATIONAL_SCHEMA,
        "regions": {"type": "object", "additionalProperties": _REGION_SCHEMA},
        "districts": {"type": "object", "additionalProperties": _DISTRICT_SCHEMA},
        "format": {"type": "string"},
        "totals": _TOTALS_SCHEMA,
    },
    "required": ["score", "national", "regions", "districts", "format", "totals"],
}

SCORE_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "campaign_details": {
            "type": "object",
            "properties": {
                "round_id": {"type": "integer"},
                "round_number": {"type": "integer"},
                "campaign": {"type": "string"},
            },
        },
        "scores": SCORES_SCHEMA,
    },
    "required": ["campaign_details", "scores"],
}

# Realistic `get_preparedness()` payload (v2 / "v3.5" format) trimmed to a handful of
# regions and districts while keeping every shape variation seen in production:
#   - a non-numeric indicator value ("3 semanas")
#   - a fully-null "#REF!" district with no indicator keys
MOCK_PREPAREDNESS_DATA = {
    "national": {
        "operational_fund": 10,
        "vaccine_and_droppers_received": 10,
        "vaccine_cold_chain_assessment": 10,
        "vaccine_monitors_training_and_deployment": 10,
        "penmarkers_supply": 10,
        "sia_training": 10,
        "sia_micro_planning": 10,
        "communication_sm_fund": 10,
        "communication_sm_activities": 87.5,
        "communication_c4d": 5,
        "status_score": 97.5,
        "round": "Round2",
    },
    "regions": {
        "BIÉ": {
            "operational_fund": 10,
            "vaccine_and_droppers_received": 10,
            "vaccine_cold_chain_assessment": 10,
            "vaccine_monitors_training_and_deployment": 10,
            "penmarkers_supply": 10,
            "sia_training": 10,
            "sia_micro_planning": 10,
            "communication_sm_fund": 10,
            "communication_sm_activities": 95.83333333333334,
            "communication_c4d": 10,
            "status_score": 99.16666666666669,
        },
        "LUNDA SUL": {
            "operational_fund": "3 semanas",
            "vaccine_and_droppers_received": 0,
            "vaccine_cold_chain_assessment": 0,
            "vaccine_monitors_training_and_deployment": 0,
            "penmarkers_supply": 0,
            "sia_training": 0,
            "sia_micro_planning": 0,
            "communication_sm_fund": 0,
            "communication_sm_activities": 0,
            "communication_c4d": 0,
            "status_score": 0,
        },
    },
    "districts": {
        "Andulo": {
            "planning_score": 100,
            "training_score": 100,
            "monitoring_score": 100,
            "vaccine_score": 100,
            "advocacy_score": 95.83333333333334,
            "adverse_score": 99.16666666666669,
            "security_score": None,
            "status_score": 99.16666666666669,
            "region": "BIÉ",
            "operational_fund": 10,
            "vaccine_and_droppers_received": 10,
            "vaccine_cold_chain_assessment": 10,
            "vaccine_monitors_training_and_deployment": 10,
            "penmarkers_supply": 10,
            "sia_training": 10,
            "sia_micro_planning": 10,
            "communication_sm_fund": 10,
            "communication_sm_activities": 95.83333333333334,
            "communication_c4d": 10,
        },
        "#REF! (Reference does not exist.)": {
            "planning_score": None,
            "training_score": None,
            "monitoring_score": None,
            "vaccine_score": None,
            "advocacy_score": None,
            "adverse_score": None,
            "security_score": None,
            "status_score": None,
            "region": "BIÉ",
        },
    },
    "format": "v3.5",
    "totals": {
        "national_score": 97.5,
        "regional_score": 91.73,
        "district_score": 90.33,
    },
}


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
