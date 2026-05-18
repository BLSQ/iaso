from unittest import mock

from plugins.polio.api.dashboards.preparedness.serializers import PreparednessScoreSerializer
from plugins.polio.models.base import SpreadSheetImport

from .common_data import PreparednessDashboardAPIBase


MOCK_PREPAREDNESS = "plugins.polio.api.dashboards.preparedness.serializers.get_preparedness"
MOCK_SUMMARY = "plugins.polio.api.dashboards.preparedness.serializers.preparedness_summary"


class PreparednessScoreSerializerAPITestCase(PreparednessDashboardAPIBase):
    """
    Test cases for the PreparednessScoreSerializer.
    """

    @mock.patch(MOCK_SUMMARY)
    @mock.patch(MOCK_PREPAREDNESS)
    def test_scores_field_returns_totals_and_score(self, mock_get_preparedness, mock_summary):
        mock_get_preparedness.return_value = {"totals": {"national": 90, "regional": 75, "district": 60}}
        mock_summary.return_value = {"overall_status_score": 75.0}

        self.ssi.round_id = self.round_with_ssi.id
        self.ssi.round_number = self.round_with_ssi.number
        self.ssi.campaign = self.campaign.obr_name
        serializer = PreparednessScoreSerializer(instance=self.ssi)
        data = serializer.data

        self.assertEqual(data["scores"]["score"], 75.0)
        self.assertEqual(data["scores"]["national"], 90)
        self.assertEqual(data["scores"]["regional"], 75)
        self.assertEqual(data["scores"]["district"], 60)

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
