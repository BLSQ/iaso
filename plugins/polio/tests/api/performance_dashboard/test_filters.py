from rest_framework import status

from plugins.polio.models.performance_dashboard import PerformanceDashboard

from .common_test_data import PerformanceDashboardAPIBase


class PerformanceDashboardFiltersAPITestCase(PerformanceDashboardAPIBase):
    """
    Test cases for the filters of the Performance Dashboard API endpoint.
    """

    def setUp(self):
        """
        Log in as a user with read permissions before each test.
        """
        self.client.force_authenticate(self.user_Hashirama)

    def test_filter_by_country(self):
        """
        Test that we can filter dashboards by country.
        """
        # There are 2 dashboards for Konoha in the test data
        response = self.client.get(f"{self.PERFORMANCE_DASHBOARD_API_URL}?country={self.konoha.id}")
        self.assertJSONResponse(response, status.HTTP_200_OK)
        response_data = response.json()
        results = response_data.get("results", [])
        count = len(results)
        expected_count = PerformanceDashboard.objects.filter(account=self.account_hokage, country=self.konoha).count()
        self.assertEqual(count, expected_count)

        result_ids = {item["id"] for item in response_data["results"]}
        self.assertIn(self.dashboard_2.id, result_ids)
        self.assertIn(self.dashboard_7.id, result_ids)

    def test_filter_by_country_block(self):
        """
        Test that we can filter dashboards by the country's parent (block).
        """
        # There are 2 dashboards for Konoha (which is in Land of Fire block)
        response = self.client.get(f"{self.PERFORMANCE_DASHBOARD_API_URL}?country_block={self.land_of_fire.id}")
        self.assertJSONResponse(response, status.HTTP_200_OK)
        response_data = response.json()
        results = response_data.get("results", [])
        count = len(results)
        self.assertEqual(count, 2)

        result_ids = {item["id"] for item in response_data["results"]}
        self.assertIn(self.dashboard_2.id, result_ids)
        self.assertIn(self.dashboard_7.id, result_ids)
