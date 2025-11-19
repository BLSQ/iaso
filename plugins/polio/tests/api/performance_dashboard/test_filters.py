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

    # def test_filter_by_antigen(self):
    #     """
    #     Test that we can filter dashboards by antigen.
    #     """
    #     # There are 2 dashboards with 'nOPV2' antigen
    #     params = {"antigen": "nOPV2"}
    #     response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL, data=params)
    #     self.assertJSONResponse(response, status.HTTP_200_OK)
    #     response_data = response.json()
    #     self.assertEqual(response_data["count"], 5)
    #
    #     result_ids = {item["id"] for item in response_data["results"]}
    #     self.assertIn(self.dashboard_4.id, result_ids)
    #     self.assertIn(self.dashboard_8.id, result_ids)
    #
    # def test_filter_by_date_range(self):
    #     """
    #     Test that we can filter dashboards by a date range.
    #     """
    #     # There are 2 dashboards between Feb 1 and Mar 31, 2023
    #     params = {"date_from": "2023-02-01", "date_to": "2023-03-31"}
    #     response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL, data=params)
    #     self.assertJSONResponse(response, status.HTTP_200_OK)
    #     response_data = response.json()
    #     self.assertEqual(response_data["count"], 2)
    #
    #     result_ids = {item["id"] for item in response_data["results"]}
    #     self.assertIn(self.dashboard_konoha_final_nopv2.id, result_ids)
    #     self.assertIn(self.dashboard_suna_commented_bopv.id, result_ids)
    #
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
    #
    # def test_filter_by_multiple_filters(self):
    #     """
    #     Test that we can combine multiple filters.
    #     """
    #     # There is 1 dashboard for Suna with 'draft' status
    #     params = {"country_id": self.suna.id, "status": "draft"}
    #     response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL, data=params)
    #     self.assertJSONResponse(response, status.HTTP_200_OK)
    #     response_data = response.json()
    #     self.assertEqual(response_data["count"], 1)
    #     self.assertEqual(response_data["results"][0]["id"], self.dashboard_suna_draft_nopv2.id)

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

