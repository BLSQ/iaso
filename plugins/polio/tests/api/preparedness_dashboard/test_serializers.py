from unittest import mock

from plugins.polio.api.dashboards.preparedness_dashboard import PreparednessScoreSerializer
from plugins.polio.models.base import Round, SpreadSheetImport

from .common_data import PreparednessDashboardAPIBase


MOCK_PREPAREDNESS = "plugins.polio.api.dashboards.preparedness_dashboard.get_preparedness"
MOCK_SUMMARY = "plugins.polio.api.dashboards.preparedness_dashboard.preparedness_summary"


class PreparednessScoreSerializerAPITestCase(PreparednessDashboardAPIBase):
    """
    Test cases for the PreparednessScoreSerializer.
    """

    @mock.patch(MOCK_SUMMARY)
    @mock.patch(MOCK_PREPAREDNESS)
    def test_scores_field_returns_totals_and_score(self, mock_get_preparedness, mock_summary):
        mock_get_preparedness.return_value = {"totals": {"national": 90, "regional": 75, "district": 60}}
        mock_summary.return_value = {"overall_status_score": 75.0}

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
    def test_campaign_details_raises_when_multiple_rounds_share_url(self, mock_get_preparedness, mock_summary):
        """When multiple rounds share the same preparedness URL, the serializer raises."""
        mock_get_preparedness.return_value = {"totals": {}}
        mock_summary.return_value = {"overall_status_score": 0}

        shared_url = "https://docs.google.com/spreadsheets/d/shared"

        ssi_shared = SpreadSheetImport.objects.create(
            url=shared_url,
            content={"title": "Shared", "sheets": []},
            spread_id="shared",
        )

        Round.objects.create(
            campaign=self.campaign,
            number=10,
            preparedness_spreadsheet_url=shared_url,
        )
        Round.objects.create(
            campaign=self.campaign,
            number=11,
            preparedness_spreadsheet_url=shared_url,
        )

        serializer = PreparednessScoreSerializer(instance=ssi_shared)
        with self.assertRaises(Exception) as ctx:
            serializer.data
        self.assertIn("Found more than one round for url:", str(ctx.exception))
