from rest_framework.test import APIRequestFactory

from plugins.polio.api.performance_thresholds.serializers import (
    PerformanceThresholdReadSerializer,
    PerformanceThresholdWriteSerializer,
)
from plugins.polio.models.performance_thresholds import PerformanceThresholds

from .common_data import PerformanceThresholdsAPIBase


class PerformanceThresholdSerializerAPITestCase(PerformanceThresholdsAPIBase):
    """
    Test cases for the Performance Threshold serializers.
    """

    def test_read_serializer_returns_expected_data(self):
        """
        Test that the List/Read serializer returns the correct structure and data.
        """
        serializer = PerformanceThresholdReadSerializer(instance=self.threshold_stock_12m)
        data = serializer.data

        # Check that the values are correct
        self.assertEqual(data["id"], self.threshold_stock_12m.id)
        self.assertEqual(data["indicator"], self.threshold_stock_12m.indicator)
        self.assertEqual(data["success_threshold"], self.threshold_stock_12m.success_threshold)
        self.assertEqual(data["warning_threshold"], self.threshold_stock_12m.warning_threshold)
        self.assertEqual(data["fail_threshold"], self.threshold_stock_12m.fail_threshold)

    def test_write_serializer(self):
        """
        Test that the Write serializer can successfully create a new object.
        """
        data = {
            "indicator": "lines of code per month",
            "success_threshold": self.json_logic_rule_2,
            "warning_threshold": self.json_logic_rule_3,
            "fail_threshold": self.json_logic_rule_4,
        }
        # mock request to pass context to serializer
        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = self.user_admin

        serializer = PerformanceThresholdWriteSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid())
        new_threshold = serializer.save()

        self.assertIsInstance(new_threshold, PerformanceThresholds)
        self.assertEqual(new_threshold.indicator, "lines of code per month")
        self.assertEqual(new_threshold.success_threshold, self.json_logic_rule_2)
        self.assertEqual(new_threshold.warning_threshold, self.json_logic_rule_3)
        self.assertEqual(new_threshold.fail_threshold, self.json_logic_rule_4)
        self.assertEqual(new_threshold.account, self.account)

    def test_write_validation(self):
        """
        Test field validation for write serializer.
        """
        # mock request to pass context to serializer
        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = self.user_admin

        data = {
            "indicator": "lines of code per month",
            "success_threshold": self.json_logic_rule_2,
            "warning_threshold": {"<<": [self.arg1, 90]},
            "fail_threshold": self.json_logic_rule_4,
        }
        serializer = PerformanceThresholdWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("Invalid JSON logic for warning threshold", serializer.errors["warning_threshold"][0])

        data = {
            "indicator": "lines of code per month",
            "warning_threshold": self.json_logic_rule_2,
            "success_threshold": {"<<": [self.arg1, 90]},
            "fail_threshold": self.json_logic_rule_4,
        }
        serializer = PerformanceThresholdWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("Invalid JSON logic for success threshold", serializer.errors["success_threshold"][0])

        data = {
            "indicator": "lines of code per month",
            "success_threshold": self.json_logic_rule_2,
            "fail_threshold": {"<<": [self.arg1, 90]},
            "warning_threshold": self.json_logic_rule_4,
        }
        serializer = PerformanceThresholdWriteSerializer(data=data, context={"request": request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("Invalid JSON logic for fail threshold", serializer.errors["fail_threshold"][0])
