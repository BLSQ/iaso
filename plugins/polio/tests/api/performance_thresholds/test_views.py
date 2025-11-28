from rest_framework import status

from plugins.polio.models.performance_thresholds import PerformanceThresholds

from .common_data import PerformanceThresholdsAPIBase


class PerformanceThresholdsViewsAPITestCase(PerformanceThresholdsAPIBase):
    """
    Test cases for the main actions of the Performance Thresholds API endpoint (ViewSet).
    """

    # --- Permissions Tests ---

    def test_list_unauthenticated_returns_401(self):
        """
        Unauthenticated users should not be able to access the endpoint.
        """
        response = self.client.get(self.PERFORMANCE_THRESHOLDS_API_URL)
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_list_with_no_perms_returns_403(self):
        """
        Authenticated users without the correct permissions should be forbidden.
        """
        self.client.force_authenticate(self.user_Naruto_no_perms)
        response = self.client.get(self.PERFORMANCE_THRESHOLDS_API_URL)
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_read_only_user_permissions(self):
        """
        Test that a read-only user can only perform GET requests.
        """
        self.client.force_authenticate(self.user_Neji)

        # GET should work
        response = self.client.get(self.PERFORMANCE_THRESHOLDS_API_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)

        # POST should fail
        response = self.client.post(self.PERFORMANCE_THRESHOLDS_API_URL, data={}, format="json")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

        # PATCH should fail
        threshold_id = self.threshold_hokage_stock_12m.id
        response = self.client.patch(f"{self.PERFORMANCE_THRESHOLDS_API_URL}{threshold_id}/", data={}, format="json")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

        # DELETE should fail
        response = self.client.delete(f"{self.PERFORMANCE_THRESHOLDS_API_URL}{threshold_id}/")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_non_admin_user_can_create(self):
        """
        Test that a non-admin user can create a new threshold.
        """
        self.client.force_authenticate(self.user_Kakashi)

        create_data = {
            "indicator": "daily_report_completeness",
            "timeline": "last_12_months",
            "fail_threshold": "80",
            "success_threshold": "95",
        }
        response = self.client.post(self.PERFORMANCE_THRESHOLDS_API_URL, data=create_data, format="json")
        self.assertJSONResponse(response, status.HTTP_201_CREATED)

        # Verify it exists in DB
        self.assertTrue(PerformanceThresholds.objects.filter(indicator="daily_report_completeness").exists())

    def test_non_admin_can_update_threshold(self):
        """
        Test that a non-admin user CAN update an existing record.
        (Unlike Dashboards, Threshold settings usually don't have a time limit for edits)
        """
        self.client.force_authenticate(self.user_Kakashi)

        threshold = self.threshold_hokage_stock_12m

        # Change Success from 5 to 8
        update_data = {"success_threshold": "8"}

        response = self.client.patch(
            f"{self.PERFORMANCE_THRESHOLDS_API_URL}{threshold.id}/", data=update_data, format="json"
        )
        self.assertJSONResponse(response, status.HTTP_200_OK)

        # Verify DB update
        threshold.refresh_from_db()
        self.assertEqual(threshold.success_threshold, "8")

    def test_admin_user_can_delete(self):
        """
        Test that an admin user can perform a DELETE request.
        """
        self.client.force_authenticate(self.user_Hashirama)

        threshold_id = self.threshold_hokage_stock_12m.id

        response = self.client.delete(f"{self.PERFORMANCE_THRESHOLDS_API_URL}{threshold_id}/")
        self.assertJSONResponse(response, status.HTTP_204_NO_CONTENT)

        # Verify it is soft-deleted (or deleted)
        # Since we inherit SoftDeletableModel, filter() usually excludes it by default
        self.assertFalse(PerformanceThresholds.objects.filter(id=threshold_id).exists())

    # --- Data Isolation and Functionality Tests ---

    def test_list_returns_only_own_account_thresholds(self):
        """
        Test that a user can only list thresholds from their own account.
        """
        self.client.force_authenticate(self.user_Hashirama)  # User from Hokage account

        response = self.client.get(self.PERFORMANCE_THRESHOLDS_API_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)

        response_data = response.json()

        # Check pagination
        if "results" in response_data:
            results = response_data["results"]
            count = len(results)
        else:
            self.fail("Response is not paginated as expected")

        # Expected: 2 (Stock Out + Vials for Hokage). Should NOT see Akatsuki's threshold.
        expected_count = PerformanceThresholds.objects.filter(account=self.account_hokage).count()
        self.assertEqual(count, expected_count)
        self.assertEqual(count, 2)

        result_ids = {item["id"] for item in results}

        # threshold_akatsuki_stock belongs to account_akatsuki and should NOT be visible
        self.assertNotIn(
            self.threshold_akatsuki_stock.id,
            result_ids,
            "Threshold from another account (Akatsuki) should not be listed for Hokage user",
        )

    def test_create_sets_audit_fields_correctly(self):
        """
        Test that on creation, `created_by` and `account` are set automatically by the view/serializer.
        """
        self.client.force_authenticate(self.user_Kakashi)

        data = {
            "indicator": "pre_campaign_activities",
            "timeline": "last_12_months",
            "fail_threshold": "50",
            "success_threshold": "90",
        }

        response = self.client.post(self.PERFORMANCE_THRESHOLDS_API_URL, data=data, format="json")
        self.assertJSONResponse(response, status.HTTP_201_CREATED)

        new_threshold = PerformanceThresholds.objects.get(id=response.json()["id"])

        self.assertEqual(new_threshold.created_by, self.user_Kakashi)
        self.assertEqual(new_threshold.account, self.account_hokage)
