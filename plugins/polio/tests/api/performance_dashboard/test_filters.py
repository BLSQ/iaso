from rest_framework import status

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
        params = {"country_id": self.konoha.id}
        response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL, data=params)
        self.assertJSONResponse(response, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data["count"], 7)

        result_ids = {item["id"] for item in response_data["results"]}
        self.assertIn(self.dashboard_2.id, result_ids)
        self.assertIn(self.dashboard_7.id, result_ids)

    def test_filter_by_status(self):
        """
        Test that we can filter dashboards by status.
        """
        # There are 2 dashboards with 'draft' status
        params = {"status": "draft"}
        response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL, data=params)
        self.assertJSONResponse(response, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data["count"], 2)

        result_ids = {item["id"] for item in response_data["results"]}
        self.assertIn(self.dashboard_1.id, result_ids)
        self.assertIn(self.dashboard_8.id, result_ids)

    def test_filter_by_search(self):
        """
        Test that we can search by country name.
        """
        # Searching for "Kono" should return the 2 dashboards for Konoha
        params = {"search": "Kono"}
        response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL, data=params)
        self.assertJSONResponse(response, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data["count"], 7)

        result_ids = {item["id"] for item in response_data["results"]}
        self.assertIn(self.dashboard_2.id, result_ids)
        self.assertIn(self.dashboard_7.id, result_ids)

    def test_filter_by_country_block(self):
        """
        Test that we can filter dashboards by the country's parent (block).
        """
        # There are 2 dashboards for Konoha (which is in Land of Fire block)
        params = {"country_block": self.land_of_fire.id}
        response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL, data=params)
        self.assertJSONResponse(response, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data["count"], 2)

        result_ids = {item["id"] for item in response_data["results"]}
        self.assertIn(self.dashboard_2.id, result_ids)
        self.assertIn(self.dashboard_7.id, result_ids)

