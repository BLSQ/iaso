from rest_framework import status
# from iaso import models as m
from .common_test_data import PerformanceDashboardAPIBase
from plugins.polio.models.performance_dashboard import PerformanceDashboard


class PerformanceDashboardViewsAPITestCase(PerformanceDashboardAPIBase):
    """
    Test cases for the main actions of the Performance Dashboard API endpoint (ViewSet).
    """

    # --- Permissions Tests ---

    def test_list_unauthenticated_returns_401(self):
        """
        Unauthenticated users should not be able to access the endpoint.
        """
        response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL)
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_list_with_no_perms_returns_403(self):
        """
        Authenticated users without the correct permissions should be forbidden.
        """
        self.client.force_authenticate(self.user_Naruto_no_perms)
        response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL)
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_read_only_user_permissions(self):
        """
        Test that a read-only user can only perform GET requests.
        """
        self.client.force_authenticate(self.user_Neji)

        # GET (read) should be allowed
        response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)

        # POST (create) should be forbidden
        response = self.client.post(self.PERFORMANCE_DASHBOARD_API_URL, data={}, format="json")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

        # PATCH (update) should be forbidden
        response = self.client.patch(f"{self.PERFORMANCE_DASHBOARD_API_URL}{self.dashboard_2.id}/", data={}, format="json")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

        # DELETE should be forbidden
        response = self.client.delete(f"{self.PERFORMANCE_DASHBOARD_API_URL}{self.dashboard_2.id}/")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_non_admin_user_can_create_and_update(self):
        """
        Test that a non-admin user can create and update, but not delete.
        """
        self.client.force_authenticate(self.user_Kakashi)

        # Create should be allowed
        create_data = {"date": "2023-08-01", "status": "draft", "antigen": "bOPV", "country_id": self.konoha.id}
        response = self.client.post(self.PERFORMANCE_DASHBOARD_API_URL, data=create_data, format="json")
        self.assertJSONResponse(response, status.HTTP_201_CREATED)

        # Update should be allowed
        update_data = {"status": "final"}
        response = self.client.patch(f"{self.PERFORMANCE_DASHBOARD_API_URL}{self.dashboard_2.id}/", data=update_data, format="json")
        self.assertJSONResponse(response, status.HTTP_200_OK)

        # Delete should be forbidden
        response = self.client.delete(f"{self.PERFORMANCE_DASHBOARD_API_URL}{self.dashboard_2.id}/")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_admin_user_can_delete(self):
        """
        Test that an admin user can perform a DELETE request.
        """
        self.client.force_authenticate(self.user_Hashirama)
        response = self.client.delete(f"{self.PERFORMANCE_DASHBOARD_API_URL}{self.dashboard_2.id}/")
        self.assertJSONResponse(response, status.HTTP_204_NO_CONTENT)

    # --- Data Isolation and Functionality Tests ---

    def test_list_returns_only_own_account_dashboards(self):
        """
        Test that a user can only list dashboards from their own account.
        """
        self.client.force_authenticate(self.user_Hashirama) # User from Hokage account
        response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)

        response_data = response.json()
        # print(f"Response data is: {response_data}")
        # Check if the response is paginated or just a list
        if isinstance(response_data, dict) and "results" in response_data:
            # Paginated response
            results = response_data["results"]
            count = response_data["count"]
        elif isinstance(response_data, list):
            # Non-paginated response - results is the list itself
            results = response_data
            count = len(results)
        else:
            # Unexpected structure
            self.fail(f"Unexpected response structure: {type(response_data)} - {response_data}")

        expected_count = 7
        # Should only contain the 4 dashboards from the Hokage account
        self.assertEqual(count, expected_count)

        result_ids = [item["id"] for item in results]
        # Check that IDs from the user's own account are present
        self.assertIn(self.dashboard_1.id, result_ids)
        self.assertIn(self.dashboard_2.id, result_ids)
        self.assertIn(self.dashboard_4.id, result_ids)
        self.assertIn(self.dashboard_5.id, result_ids)  # Owned by Hokage, should be visible
        self.assertIn(self.dashboard_6.id, result_ids)  # Owned by Hokage, should be visible

        # Check that an ID from a *different* account is NOT present
        # dashboard_7 belongs to account_akatsuki and should NOT be visible to user_Hashirama
        self.assertNotIn(self.dashboard_3.id, result_ids,"Dashboard from another account (Akatsuki) should not be listed for Hokage user")

    def test_create_sets_audit_fields_correctly(self):
        """
        Test that on creation, `created_by` and `account` are set automatically by the view/serializer.
        """
        self.client.force_authenticate(self.user_Kakashi)
        data = {
            "date": "2023-09-01",
            "status": "draft",
            "antigen": "nOPV2",
            "country_id": self.suna.id,
        }
        response = self.client.post(self.PERFORMANCE_DASHBOARD_API_URL, data=data, format="json")
        self.assertJSONResponse(response, status.HTTP_201_CREATED)

        new_dashboard = PerformanceDashboard.objects.get(id=response.json()["id"])
        self.assertEqual(new_dashboard.created_by, self.user_Kakashi)
        self.assertEqual(new_dashboard.account, self.account_hokage)
