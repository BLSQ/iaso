import copy

from unittest import mock

import jsonschema

from plugins.polio.api.dashboards.preparedness.serializers import PreparednessScoreSerializer
from plugins.polio.models.base import SpreadSheetImport

from .common_data import MOCK_PREPAREDNESS_DATA, SCORE_RESPONSE_SCHEMA, PreparednessDashboardAPIBase


MOCK_PREPAREDNESS = "plugins.polio.api.dashboards.preparedness.serializers.get_preparedness"
MOCK_SUMMARY = "plugins.polio.api.dashboards.preparedness.serializers.preparedness_summary"


class PreparednessScoreSerializerAPITestCase(PreparednessDashboardAPIBase):
    """
    Test cases for the PreparednessScoreSerializer.
    """

    @mock.patch(MOCK_SUMMARY)
    @mock.patch(MOCK_PREPAREDNESS)
    def test_scores_field_returns_totals_and_score(self, mock_get_preparedness, mock_summary):
        mock_get_preparedness.return_value = MOCK_PREPAREDNESS_DATA
        mock_summary.return_value = {"overall_status_score": 75.0}

        self.ssi.round_id = self.round_with_ssi.id
        self.ssi.round_number = self.round_with_ssi.number
        self.ssi.campaign = self.campaign.obr_name
        serializer = PreparednessScoreSerializer(instance=self.ssi)
        data = serializer.data

        try:
            jsonschema.validate(instance=data, schema=SCORE_RESPONSE_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        scores = data["scores"]
        # `score` is taken from preparedness_summary; everything else is the get_preparedness() payload.
        self.assertEqual(scores["score"], 75.0)
        self.assertEqual(scores["format"], "v3.5")
        self.assertEqual(scores["totals"]["national_score"], 97.5)
        self.assertEqual(scores["totals"]["regional_score"], 91.73)
        self.assertEqual(scores["totals"]["district_score"], 90.33)
        self.assertEqual(set(scores.keys()), {"score", "national", "regions", "districts", "format", "totals"})

    @mock.patch(MOCK_SUMMARY)
    @mock.patch(MOCK_PREPAREDNESS)
    def test_scores_field_preserves_region_and_district_shape(self, mock_get_preparedness, mock_summary):
        # Deep copy so per-test attribute access can't mutate the shared fixture.
        mock_get_preparedness.return_value = copy.deepcopy(MOCK_PREPAREDNESS_DATA)
        mock_summary.return_value = {"overall_status_score": 75.0}

        self.ssi.round_id = self.round_with_ssi.id
        self.ssi.round_number = self.round_with_ssi.number
        self.ssi.campaign = self.campaign.obr_name
        scores = PreparednessScoreSerializer(instance=self.ssi).data["scores"]

        bie = scores["regions"]["BIÉ"]
        self.assertEqual(bie["status_score"], 99.16666666666669)
        self.assertEqual(bie["operational_fund"], 10)
        # Non-numeric indicator cells are forwarded as-is.
        self.assertEqual(scores["regions"]["LUNDA SUL"]["operational_fund"], "3 semanas")

        andulo = scores["districts"]["Andulo"]
        self.assertEqual(andulo["region"], "BIÉ")
        self.assertIsNone(andulo["security_score"])
        # Broken "#REF!" districts only expose the null score skeleton, no indicators.
        broken = scores["districts"]["#REF! (Reference does not exist.)"]
        self.assertIsNone(broken["status_score"])
        self.assertNotIn("operational_fund", broken)

    @mock.patch(MOCK_SUMMARY)
    @mock.patch(MOCK_PREPAREDNESS)
    def test_campaign_details_with_linked_round(self, mock_get_preparedness, mock_summary):
        mock_get_preparedness.return_value = {"totals": {}}
        mock_summary.return_value = {"overall_status_score": 0}

        self.ssi.round_id = self.round_with_ssi.id
        self.ssi.round_number = self.round_with_ssi.number
        self.ssi.campaign = self.campaign.obr_name
        serializer = PreparednessScoreSerializer(instance=self.ssi)
        details = serializer.data["campaign_details"]

        self.assertEqual(details["round_id"], self.round_with_ssi.id)
        self.assertEqual(details["round_number"], 4)
        self.assertEqual(details["campaign"], "test-campaign")

    @mock.patch(MOCK_SUMMARY)
    @mock.patch(MOCK_PREPAREDNESS)
    def test_campaign_details_empty_when_no_round_linked(self, mock_get_preparedness, mock_summary):
        mock_get_preparedness.return_value = {"totals": {}}
        mock_summary.return_value = {"overall_status_score": 0}

        orphan_ssi = SpreadSheetImport.objects.create(
            url="https://docs.google.com/spreadsheets/d/orphan",
            content={"title": "Orphan", "sheets": []},
            spread_id="orphan",
        )

        serializer = PreparednessScoreSerializer(instance=orphan_ssi)
        self.assertEqual(serializer.data["campaign_details"], {})

    @mock.patch(MOCK_SUMMARY)
    @mock.patch(MOCK_PREPAREDNESS)
    def test_campaign_details_returns_provided_attrs(self, mock_get_preparedness, mock_summary):
        """The serializer renders whatever round attrs were set by the view."""
        mock_get_preparedness.return_value = {"totals": {}}
        mock_summary.return_value = {"overall_status_score": 0}

        self.ssi.round_id = 999
        self.ssi.round_number = 42
        self.ssi.campaign = "custom-campaign"
        serializer = PreparednessScoreSerializer(instance=self.ssi)
        details = serializer.data["campaign_details"]

        self.assertEqual(details["round_id"], 999)
        self.assertEqual(details["round_number"], 42)
        self.assertEqual(details["campaign"], "custom-campaign")
