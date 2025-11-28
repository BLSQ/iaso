from rest_framework import status

from .common_data import PerformanceThresholdsAPIBase


class PerformanceThresholdFilterAPITestCase(PerformanceThresholdsAPIBase):
    """
    Test cases for the Performance Threshold filters.
    """

    def setUp(self):
        """
        Authenticate the user for the tests.
        """
        self.client.force_authenticate(self.user_Hashirama)

    def test_filter_by_indicator(self):
        """
        Test that we can filter the list by a specific indicator.
        """
        # There is one threshold with indicator "stock_out" in the test data
        response = self.client.get(self.PERFORMANCE_THRESHOLDS_API_URL, {"indicator": "stock_out"})

        self.assertJSONResponse(response, status.HTTP_200_OK)

        response_data = response.json()
        results = response_data.get("results", response_data)

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["indicator"], "stock_out")
        self.assertEqual(results[0]["id"], self.threshold_hokage_stock_12m.id)

    def test_filter_by_timeline(self):
        """
        Test that we can filter the list by a specific timeline.
        """
        # There is one threshold with timeline "to_date"
        response = self.client.get(self.PERFORMANCE_THRESHOLDS_API_URL, {"timeline": "to_date"})

        self.assertJSONResponse(response, status.HTTP_200_OK)

        response_data = response.json()
        results = response_data.get("results", response_data)

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["timeline"], "to_date")
        self.assertEqual(results[0]["id"], self.threshold_hokage_vials_todate.id)

    def test_filter_by_indicator_and_timeline(self):
        """
        Test that filtering by both indicator and timeline works correctly.
        """
        params = {"indicator": "unusable_vials", "timeline": "to_date"}
        response = self.client.get(self.PERFORMANCE_THRESHOLDS_API_URL, params)

        self.assertJSONResponse(response, status.HTTP_200_OK)

        response_data = response.json()
        results = response_data.get("results", response_data)

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], self.threshold_hokage_vials_todate.id)
