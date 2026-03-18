from unittest import mock

import jsonschema
import time_machine

from rest_framework import status

from .common_data import PreparednessDashboardAPIBase


INDICATOR_SCHEMA = {
    "type": "object",
    "properties": {
        "sn": {"type": "integer"},
        "key": {"type": "string"},
        "title": {"type": "string"},
        "national": {"type": "number"},
        "regions": {"type": "number"},
        "districts": {"type": "number"},
    },
    "required": ["sn", "key", "title", "national", "regions", "districts"],
}

HISTORY_ENTRY_SCHEMA = {
    "type": "object",
    "properties": {
        "days_before": {"type": "integer"},
        "expected_score": {"type": "integer"},
        "preparedness_score": {"type": ["number", "null"]},
        "date": {"type": "string"},
        "sync_time": {"type": ["string", "null"]},
    },
    "required": ["days_before", "expected_score", "preparedness_score", "date", "sync_time"],
}

PREPAREDNESS_LIST_ITEM_SCHEMA = {
    "type": "object",
    "properties": {
        "campaign_id": {"type": "string"},
        "campaign_obr_name": {"type": "string"},
        "indicators": {
            "type": "object",
            "additionalProperties": INDICATOR_SCHEMA,
        },
        "round": {"type": "string"},
        "round_number": {"type": "integer"},
        "round_id": {"type": "integer"},
        "round_start": {"type": ["string", "null"]},
        "round_end": {"type": ["string", "null"]},
        "date": {"type": ["string", "null"]},
        "overall_status_score": {"type": "number"},
        "history": {
            "type": "array",
            "items": HISTORY_ENTRY_SCHEMA,
        },
    },
    "required": [
        "campaign_id",
        "campaign_obr_name",
        "indicators",
        "round",
        "round_number",
        "round_id",
        "round_start",
        "round_end",
        "overall_status_score",
        "history",
    ],
}

PREPAREDNESS_LIST_SCHEMA = {
    "type": "array",
    "items": PREPAREDNESS_LIST_ITEM_SCHEMA,
}


class PreparednessDashboardListAPITestCase(PreparednessDashboardAPIBase):
    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.get_or_set_preparedness_cache_for_round")
    def test_list_returns_preparedness_for_polio_campaigns(self, mock_get_cache):
        mock_get_cache.return_value = {"campaign_obr_name": "test-campaign", "round": "Round1", "score": 80}

        self.client.force_authenticate(self.user_polio)
        response = self.client.get(self.PREPAREDNESS_DASHBOARD_API_URL)
        data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertIsInstance(data, list)
        # 4 rounds on "test-campaign" + 3 rounds on "other-campaign"
        self.assertEqual(len(data), 7)

    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.get_or_set_preparedness_cache_for_round")
    def test_list_response_shape(self, mock_get_cache):
        """Validate the JSON schema of the list endpoint response."""
        mock_get_cache.return_value = {
            "campaign_id": str(self.campaign.id),
            "campaign_obr_name": "test-campaign",
            "indicators": {
                "operational_fund": {
                    "sn": 1,
                    "key": "operational_fund",
                    "title": "Operational funds",
                    "national": 10,
                    "regions": 6.27,
                    "districts": 6.97,
                },
                "status_score": {
                    "sn": 0,
                    "key": "status_score",
                    "title": "Total score",
                    "national": 10.0,
                    "regions": 7.65,
                    "districts": 689.21,
                },
            },
            "round": "Round1",
            "round_number": 1,
            "round_id": self.round_1.id,
            "round_start": "2021-01-01",
            "round_end": "2021-01-10",
            "date": "2023-08-25T16:53:14.534926Z",
            "overall_status_score": 235.62,
            "history": [
                {
                    "days_before": 1,
                    "expected_score": 90,
                    "preparedness_score": 46.93,
                    "date": "2022-01-13",
                    "sync_time": "2022-01-13T00:03:16.080530Z",
                },
                {
                    "days_before": 7,
                    "expected_score": 80,
                    "preparedness_score": 33.47,
                    "date": "2022-01-07",
                    "sync_time": "2022-01-08T00:03:21.968552Z",
                },
            ],
        }

        self.client.force_authenticate(self.user_polio)
        response = self.client.get(self.PREPAREDNESS_DASHBOARD_API_URL, {"campaign": "test-campaign"})
        data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(len(data), 4)

        try:
            jsonschema.validate(instance=data, schema=PREPAREDNESS_LIST_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.get_or_set_preparedness_cache_for_round")
    def test_list_filters_by_campaign_name(self, mock_get_cache):
        mock_get_cache.return_value = {"campaign_obr_name": "test-campaign", "round": "Round1"}

        self.client.force_authenticate(self.user_polio)
        response = self.client.get(self.PREPAREDNESS_DASHBOARD_API_URL, {"campaign": "test-campaign"})
        data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 4)
        for item in data:
            self.assertEqual(item["campaign_obr_name"], "test-campaign")

    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.get_or_set_preparedness_cache_for_round")
    def test_list_returns_empty_for_nonexistent_campaign(self, mock_get_cache):
        mock_get_cache.return_value = None

        self.client.force_authenticate(self.user_polio)
        response = self.client.get(self.PREPAREDNESS_DASHBOARD_API_URL, {"campaign": "does-not-exist"})
        data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(data, [])

    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.get_or_set_preparedness_cache_for_round")
    def test_list_excludes_none_results(self, mock_get_cache):
        """Rounds where get_or_set_preparedness_cache_for_round returns None are excluded."""
        mock_get_cache.return_value = None

        self.client.force_authenticate(self.user_polio)
        response = self.client.get(self.PREPAREDNESS_DASHBOARD_API_URL)
        data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(data, [])

    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.get_or_set_preparedness_cache_for_round")
    def test_list_excludes_non_polio_campaigns(self, mock_get_cache):
        """Only campaigns with POLIO type should be included."""
        mock_get_cache.return_value = {"campaign_obr_name": "test-campaign", "round": "Round1"}

        self.client.force_authenticate(self.user_polio)

        # Filtering by the non-polio campaign returns nothing
        response = self.client.get(self.PREPAREDNESS_DASHBOARD_API_URL, {"campaign": "measles-campaign"})
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data, [])

        # Unfiltered still only returns polio campaigns (7 rounds total, none from "measles-campaign")
        response = self.client.get(self.PREPAREDNESS_DASHBOARD_API_URL)
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(data), 7)
        obr_names = {item["campaign_obr_name"] for item in data}
        self.assertNotIn("measles-campaign", obr_names)


@time_machine.travel("2025-01-01T00:00:00Z", tick=False)
class PreparednessDashboardScoreAPITestCase(PreparednessDashboardAPIBase):
    SCORE_URL = "/api/polio/preparedness_dashboard/score/"
    VALID_SCORE_PARAMS = {"date": "2030-01-01"}

    def setUp(self):
        super().setUp()
        self.VALID_SCORE_PARAMS = {**self.VALID_SCORE_PARAMS, "url": self.spreadsheet_url}

    def test_score_requires_authentication(self):
        self.client.force_authenticate(self.anon)
        response = self.client.get(self.SCORE_URL, self.VALID_SCORE_PARAMS)
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_score_denied_without_permissions(self):
        self.client.force_authenticate(self.user_no_perms)
        response = self.client.get(self.SCORE_URL, self.VALID_SCORE_PARAMS)
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_score_raises_when_both_params_missing(self):
        self.client.force_authenticate(self.user_polio)
        response = self.client.get(self.SCORE_URL)
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

        self.assertIn("url", data)
        self.assertIn("date", data)

    def test_score_raises_when_url_missing(self):
        self.client.force_authenticate(self.user_polio)
        response = self.client.get(self.SCORE_URL, {"date": "2030-01-01"})
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

        self.assertIn("url", data)
        self.assertNotIn("date", data)

    def test_score_raises_when_date_missing(self):
        self.client.force_authenticate(self.user_polio)
        response = self.client.get(self.SCORE_URL, {"url": 1})
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

        self.assertIn("date", data)
        self.assertNotIn("url", data)

    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.preparedness_summary")
    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.get_preparedness")
    def test_score_accessible_with_polio_permission(self, mock_get_preparedness, mock_summary):
        mock_get_preparedness.return_value = {"totals": {"national": 80}}
        mock_summary.return_value = {"overall_status_score": 80.0}

        self.client.force_authenticate(self.user_polio)
        response = self.client.get(self.SCORE_URL, self.VALID_SCORE_PARAMS)
        self.assertJSONResponse(response, status.HTTP_200_OK)

    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.preparedness_summary")
    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.get_preparedness")
    def test_score_accessible_with_config_permission(self, mock_get_preparedness, mock_summary):
        mock_get_preparedness.return_value = {"totals": {"national": 80}}
        mock_summary.return_value = {"overall_status_score": 80.0}

        self.client.force_authenticate(self.user_config)
        response = self.client.get(self.SCORE_URL, self.VALID_SCORE_PARAMS)
        self.assertJSONResponse(response, status.HTTP_200_OK)

    def test_score_returns_empty_when_no_match(self):
        self.client.force_authenticate(self.user_polio)
        response = self.client.get(self.SCORE_URL, {"url": 999999, "date": "2030-01-01"})
        data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(data, {})

    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.preparedness_summary")
    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.get_preparedness")
    def test_score_returns_serialized_data(self, mock_get_preparedness, mock_summary):
        mock_get_preparedness.return_value = {"totals": {"national": 80, "regional": 70, "district": 60}}
        mock_summary.return_value = {"overall_status_score": 70.0}

        self.client.force_authenticate(self.user_polio)
        response = self.client.get(self.SCORE_URL, self.VALID_SCORE_PARAMS)
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        print("DATA", data)

        self.assertIn("scores", data)
        self.assertEqual(data["scores"]["score"], 70.0)
        self.assertEqual(data["scores"]["national"], 80)
        self.assertIn("campaign_details", data)

    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.preparedness_summary")
    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.get_preparedness")
    def test_score_returns_campaign_details_with_linked_round(self, mock_get_preparedness, mock_summary):
        mock_get_preparedness.return_value = {"totals": {"national": 80}}
        mock_summary.return_value = {"overall_status_score": 80.0}

        self.client.force_authenticate(self.user_polio)
        response = self.client.get(self.SCORE_URL, self.VALID_SCORE_PARAMS)
        data = self.assertJSONResponse(response, status.HTTP_200_OK)

        campaign_details = data.get("campaign_details", {})
        self.assertEqual(campaign_details["round_id"], self.round_with_ssi.id)
        self.assertEqual(campaign_details["round_number"], 4)
        self.assertEqual(campaign_details["campaign"], "test-campaign")
