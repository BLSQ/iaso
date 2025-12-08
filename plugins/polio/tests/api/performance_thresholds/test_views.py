import jsonschema

from rest_framework import status

from hat.audit.models import Modification
from plugins.polio.models.performance_thresholds import PerformanceThresholds

from .common_data import PerformanceThresholdsAPIBase


name_and_id_schema = {
    "type": "object",
    "properties": {"id": {"type": "number"}, "name": {"type": "string"}},
    "required": ["name", "id"],
}

model_json_schema = PerformanceThresholds.json_schema()

PERFORMANCE_THRESHOLD_LOG_SCHEMA = Modification.make_json_schema(model_json_schema, model_json_schema)


class PerformanceThresholdsViewsAPITestCase(PerformanceThresholdsAPIBase):
    """
    Test cases for the main actions of the Performance Thresholds API endpoint (ViewSet).
    """

    def test_read_access_is_public(self):
        response = self.client.get(self.PERFORMANCE_THRESHOLDS_API_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)

        self.client.force_authenticate(self.user_no_perms)
        response = self.client.get(self.PERFORMANCE_THRESHOLDS_API_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)

        self.client.force_authenticate(self.anon)
        response = self.client.get(self.PERFORMANCE_THRESHOLDS_API_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)

        data = {
            "indicator": "lines of code per month",
            "success_threshold": self.json_logic_rule_2,
            "warning_threshold": self.json_logic_rule_3,
            "fail_threshold": self.json_logic_rule_4,
        }
        response = self.client.post(self.PERFORMANCE_THRESHOLDS_API_URL, data, format="json")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_read_only_user_permissions(self):
        """
        Test that a read-only user can only perform GET requests.
        """
        self.client.force_authenticate(self.user_read_only)

        # GET should work
        response = self.client.get(self.PERFORMANCE_THRESHOLDS_API_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)

        # POST should fail
        response = self.client.post(self.PERFORMANCE_THRESHOLDS_API_URL, data={}, format="json")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

        # PATCH should fail
        threshold_id = self.threshold_stock_12m.id
        response = self.client.patch(f"{self.PERFORMANCE_THRESHOLDS_API_URL}{threshold_id}/", data={}, format="json")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

        # DELETE should fail
        response = self.client.delete(f"{self.PERFORMANCE_THRESHOLDS_API_URL}{threshold_id}/")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_non_admin_user_can_create(self):
        """
        Test that a non-admin user can create a new threshold.
        """
        self.client.force_authenticate(self.user_non_admin)

        data = {
            "indicator": "lines of code per month",
            "success_threshold": self.json_logic_rule_2,
            "warning_threshold": self.json_logic_rule_3,
            "fail_threshold": self.json_logic_rule_4,
        }
        response = self.client.post(self.PERFORMANCE_THRESHOLDS_API_URL, data=data, format="json")
        self.assertJSONResponse(response, status.HTTP_201_CREATED)

        # Verify it exists in DB
        self.assertTrue(PerformanceThresholds.objects.filter(indicator="lines of code per month").exists())

    def test_non_admin_can_update(self):
        """
        Test that a non-admin user CAN update an existing record.
        (Unlike Dashboards, Threshold settings don't have a time limit for edits)
        """
        self.client.force_authenticate(self.user_non_admin)

        threshold = self.threshold_stock_12m

        update_data = {"success_threshold": self.json_logic_expression_1}

        response = self.client.patch(
            f"{self.PERFORMANCE_THRESHOLDS_API_URL}{threshold.id}/", data=update_data, format="json"
        )
        self.assertJSONResponse(response, status.HTTP_200_OK)

        # Verify DB update
        threshold.refresh_from_db()
        self.assertEqual(threshold.success_threshold, self.json_logic_expression_1)

    def test_admin_user_can_delete(self):
        """
        Test that an admin user can perform a DELETE request.
        """
        self.client.force_authenticate(self.user_admin)

        threshold_id = self.threshold_stock_12m.id

        response = self.client.delete(f"{self.PERFORMANCE_THRESHOLDS_API_URL}{threshold_id}/")
        self.assertJSONResponse(response, status.HTTP_204_NO_CONTENT)

        # Check soft-deletion
        self.threshold_stock_12m.refresh_from_db()
        self.assertIsNotNone(self.threshold_stock_12m.deleted_at)

    def test_list_returns_only_own_account_thresholds(self):
        """
        Test that a user can only list thresholds from their own account.
        """
        self.client.force_authenticate(self.user_admin)

        response = self.client.get(f"{self.PERFORMANCE_THRESHOLDS_API_URL}?limit=10&page=1&order=indicator")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        results = data["results"]
        count = data["count"]

        results_qs = PerformanceThresholds.objects.filter(account=self.account).order_by("indicator")
        expected_count = results_qs.count()
        expected_ids = list(results_qs.values_list("id", flat=True))
        self.assertEqual(count, expected_count)

        result_ids = [item["id"] for item in results]

        self.assertNotIn(
            self.threshold_stock_12m_other_account.id,
            result_ids,
        )
        self.assertEqual(result_ids, expected_ids)

    def test_audit_log_on_save(self):
        """
        Test that Modification instance is created on save
        """
        self.client.force_authenticate(self.superuser)

        data = {
            "indicator": "lines of code per month",
            "success_threshold": self.json_logic_rule_2,
        }
        response = self.client.patch(
            f"{self.PERFORMANCE_THRESHOLDS_API_URL}{self.threshold_stock_12m.id}/", data=data, format="json"
        )
        self.assertJSONResponse(response, status.HTTP_200_OK)

        response = self.client.get(
            f"/api/logs/?contentType=polio.performancethresholds&fields=past_value,new_value&objectId={self.threshold_stock_12m.id}"
        )
        logs = self.assertJSONResponse(response, status.HTTP_200_OK)
        log = logs["list"][0]

        try:
            jsonschema.validate(instance=log, schema=PERFORMANCE_THRESHOLD_LOG_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        past_value = log["past_value"][0]
        self.assertEqual(past_value["indicator"], "stock_out")
        self.assertEqual(past_value["fail_threshold"], self.json_logic_rule_6)
        self.assertEqual(past_value["warning_threshold"], self.json_logic_expression_2)
        self.assertEqual(past_value["success_threshold"], self.json_logic_rule_5)
        new_value = log["new_value"][0]
        self.assertEqual(new_value["indicator"], "lines of code per month")
        self.assertEqual(new_value["fail_threshold"], self.json_logic_rule_6)
        self.assertEqual(new_value["warning_threshold"], self.json_logic_expression_2)
        self.assertEqual(new_value["success_threshold"], self.json_logic_rule_2)
