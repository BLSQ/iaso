from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from plugins.polio.api.performance_thresholds.serializers import (
    PerformanceThresholdListSerializer,
    PerformanceThresholdWriteSerializer,
)
from plugins.polio.models.performance_thresholds import PerformanceThresholds

from .common_data import PerformanceThresholdsAPIBase


class PerformanceThresholdSerializerAPITestCase(PerformanceThresholdsAPIBase):
    """
    Test cases for the Performance Threshold serializers.
    """

    def test_list_serializer_returns_expected_data(self):
        """
        Test that the List/Read serializer returns the correct structure and data.
        """
        # Get a threshold instance from the test data (created in common_data)
        threshold = self.threshold_hokage_stock_12m
        serializer = PerformanceThresholdListSerializer(instance=threshold)
        data = serializer.data

        # Check that all expected keys are present
        self.assertIn("id", data)
        self.assertIn("indicator", data)
        self.assertIn("timeline", data)
        self.assertIn("fail_threshold", data)
        self.assertIn("success_threshold", data)
        self.assertIn("account", data)
        self.assertIn("created_at", data)
        self.assertIn("updated_at", data)
        self.assertIn("created_by", data)
        self.assertIn("updated_by", data)

        # Check that the values are correct
        self.assertEqual(data["id"], threshold.id)
        self.assertEqual(data["indicator"], "stock_out")
        self.assertEqual(data["timeline"], "last_12_months")
        self.assertEqual(data["fail_threshold"], "10")
        self.assertEqual(data["success_threshold"], "5")

        # Verify account ID matches
        self.assertEqual(data["account"], self.account_hokage.id)

    def test_write_serializer_create_success(self):
        """
        Test that the Write serializer can successfully create a new object.
        """
        # Data for a new threshold
        data = {
            "indicator": "unusable_vials",
            "timeline": "last_12_months",
            "fail_threshold": "50",
            "success_threshold": "AVERAGE",  # Testing the keyword acceptance
        }

        factory = APIRequestFactory()

        django_request = factory.post(self.PERFORMANCE_THRESHOLDS_API_URL, data, format="json")

        drf_request = Request(django_request)
        drf_request.user = self.user_Hashirama

        serializer = PerformanceThresholdWriteSerializer(data=data, context={"request": drf_request})

        self.assertTrue(serializer.is_valid(), serializer.errors)

        new_threshold = serializer.save()

        self.assertIsInstance(new_threshold, PerformanceThresholds)
        self.assertEqual(new_threshold.indicator, "unusable_vials")
        self.assertEqual(new_threshold.success_threshold, "AVERAGE")

        self.assertEqual(new_threshold.created_by, self.user_Hashirama)
        self.assertEqual(new_threshold.account, self.account_hokage)

    def test_write_serializer_invalid_data_fails(self):
        """
        Test that the Write serializer fails with invalid or missing data.
        """
        invalid_data_missing = {
            "indicator": "stock_out",
            "timeline": "to_date",
            # Missing thresholds
        }
        serializer = PerformanceThresholdWriteSerializer(data=invalid_data_missing)
        self.assertFalse(serializer.is_valid())
        self.assertIn("success_threshold", serializer.errors)
        self.assertIn("fail_threshold", serializer.errors)

        invalid_data_value = {
            "indicator": "stock_out",
            "timeline": "last_12_months",
            "fail_threshold": "banana",
            "success_threshold": "10",
        }

        serializer_val = PerformanceThresholdWriteSerializer(data=invalid_data_value)

        self.assertFalse(serializer_val.is_valid())

        self.assertIn("fail_threshold", serializer_val.errors)

    def test_write_serializer_fail_threshold_greater_than_success_fails(self):
        """
        Test that validation fails if fail_threshold > success_threshold, based on the current implementation.
        """
        data = {
            "indicator": "stock_out",
            "timeline": "last_12_months",
            "fail_threshold": "11",  # Higher than success
            "success_threshold": "10",
        }
        serializer = PerformanceThresholdWriteSerializer(data=data)

        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)
        self.assertEqual(
            str(serializer.errors["non_field_errors"][0]),
            "Fail threshold cannot be greater Success threshold.",
        )

    def test_write_serializer_fail_threshold_less_than_success_passes(self):
        """
        Test that validation passes if fail_threshold <= success_threshold.
        """
        data = {
            "indicator": "pre_campaign_activities",
            "timeline": "last_12_months",
            "fail_threshold": "80",
            "success_threshold": "90",
        }
        serializer = PerformanceThresholdWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

        # Test equal values
        data_equal = {
            "indicator": "pre_campaign_activities",
            "timeline": "last_12_months",
            "fail_threshold": "85",
            "success_threshold": "85",
        }
        serializer_equal = PerformanceThresholdWriteSerializer(data=data_equal)
        self.assertTrue(serializer_equal.is_valid(), serializer_equal.errors)

    def test_write_serializer_thresholds_with_keywords_pass_validation(self):
        """
        Test that validation passes when one or both thresholds are keywords, as the numeric comparison is skipped.
        """
        data = {
            "indicator": "stock_out",
            "timeline": "to_date",
            "fail_threshold": "AVERAGE",
            "success_threshold": "NO_LIMIT",
        }
        serializer = PerformanceThresholdWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

        data2 = {
            "indicator": "stock_out",
            "timeline": "to_date",
            "fail_threshold": "100",
            "success_threshold": "AVERAGE",
        }

        serializer2 = PerformanceThresholdWriteSerializer(data=data2)
        # The numeric check is skipped, so this will pass validation regardless of the number.

        self.assertTrue(serializer2.is_valid(), serializer2.errors)
