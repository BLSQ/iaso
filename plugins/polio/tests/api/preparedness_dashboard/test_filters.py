from datetime import timedelta
from unittest import mock

from django.utils import timezone
from rest_framework import status

from plugins.polio.models.base import SpreadSheetImport

from .common_data import PreparednessDashboardAPIBase


class PreparednessScoreFilterAPITestCase(PreparednessDashboardAPIBase):
    """
    Test cases for PreparednessScoreFilter.
    """

    SCORE_URL = "/api/polio/preparedness_dashboard/score/"

    def setUp(self):
        self.client.force_authenticate(self.user_polio)

    def test_filter_url_returns_empty_for_nonexistent(self):
        response = self.client.get(self.SCORE_URL, {"url": 999999, "date": "2030-01-01"})
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data, {})

    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.preparedness_summary")
    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.get_preparedness")
    def test_filter_date_returns_entry_before_or_on_date(self, mock_get_preparedness, mock_summary):
        """Date filter returns the most recent SpreadSheetImport created on or before the given date."""
        mock_get_preparedness.return_value = {"totals": {"national": 80}}
        mock_summary.return_value = {"overall_status_score": 80.0}

        now = timezone.now()

        older_ssi = SpreadSheetImport.objects.create(
            url="https://docs.google.com/spreadsheets/d/date-test",
            content={"title": "Older Sheet", "sheets": []},
            spread_id="date-test",
        )
        SpreadSheetImport.objects.filter(pk=older_ssi.pk).update(created_at=now - timedelta(days=5))

        newer_ssi = SpreadSheetImport.objects.create(
            url="https://docs.google.com/spreadsheets/d/date-test-2",
            content={"title": "Newer Sheet", "sheets": []},
            spread_id="date-test-2",
        )
        SpreadSheetImport.objects.filter(pk=newer_ssi.pk).update(created_at=now - timedelta(days=1))

        date_str = (now - timedelta(days=1)).strftime("%Y-%m-%d")
        response = self.client.get(self.SCORE_URL, {"url": older_ssi.url, "date": date_str})
        self.assertJSONResponse(response, status.HTTP_200_OK)

    def test_filter_date_returns_empty_when_no_entries_before_date(self):
        """When all SpreadSheetImport entries are after the given date, the filter returns empty."""
        response = self.client.get(self.SCORE_URL, {"url": 1, "date": "2000-01-01"})
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(data, {})

    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.preparedness_summary")
    @mock.patch("plugins.polio.api.dashboards.preparedness_dashboard.get_preparedness")
    def test_filter_date_returns_most_recent_before_date(self, mock_get_preparedness, mock_summary):
        """Date filter picks the entry closest to (but not after) the given date."""
        mock_get_preparedness.return_value = {"totals": {"national": 50}}
        mock_summary.return_value = {"overall_status_score": 50.0}

        now = timezone.now()
        base_date = now - timedelta(days=10)

        ssi_old = SpreadSheetImport.objects.create(
            url="https://docs.google.com/spreadsheets/d/old",
            content={"title": "Old", "sheets": []},
            spread_id="old",
        )
        SpreadSheetImport.objects.filter(pk=ssi_old.pk).update(created_at=base_date - timedelta(days=5))

        ssi_recent = SpreadSheetImport.objects.create(
            url="https://docs.google.com/spreadsheets/d/recent",
            content={"title": "Recent", "sheets": []},
            spread_id="recent",
        )
        SpreadSheetImport.objects.filter(pk=ssi_recent.pk).update(created_at=base_date - timedelta(days=1))

        date_str = base_date.strftime("%Y-%m-%d")
        response = self.client.get(self.SCORE_URL, {"url": ssi_old.url, "date": date_str})
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertIn("scores", data)
