from rest_framework import status

from plugins.polio.models.performance_dashboard import PerformanceDashboard

from .common_test_data import PerformanceDashboardAPIBase


class PerformanceDashboardFiltersAPITestCase(PerformanceDashboardAPIBase):
    """
    Test cases for the filters of the Performance Dashboard API endpoint.
    """

    def test_filter_by_country(self):
        """
        Test that we can filter dashboards by country.
        """
        self.client.force_authenticate(self.user_admin_1)

        response = self.client.get(f"{self.PERFORMANCE_DASHBOARD_API_URL}?country={self.est.id}")
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        results = response_data.get("results", [])
        count = len(results)
        expected_count = PerformanceDashboard.objects.filter(account=self.account_one, country=self.est).count()
        self.assertEqual(count, expected_count)

        result_ids = {item["id"] for item in response_data["results"]}
        self.assertIn(self.dashboard_2.id, result_ids)
        self.assertIn(self.dashboard_7.id, result_ids)

    def test_filter_by_country_block(self):
        """
        Test that we can filter dashboards by the country's parent (block).
        """

        self.client.force_authenticate(self.user_with_account2)

        response = self.client.get(f"{self.PERFORMANCE_DASHBOARD_API_URL}?country_block={self.north.id}")
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        results = response_data.get("results", [])
        count = len(results)
        self.assertEqual(count, 1)

        result_ids = {item["id"] for item in response_data["results"]}
        self.assertCountEqual(result_ids, [self.dashboard_3.id])
