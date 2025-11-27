from freezegun import freeze_time
from rest_framework import status

from plugins.polio.models.performance_dashboard import PerformanceDashboard

from .common_test_data import PerformanceDashboardAPIBase


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

        response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)

        response = self.client.post(self.PERFORMANCE_DASHBOARD_API_URL, data={}, format="json")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

        response = self.client.patch(
            f"{self.PERFORMANCE_DASHBOARD_API_URL}{self.dashboard_2.id}/", data={}, format="json"
        )
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

        response = self.client.delete(f"{self.PERFORMANCE_DASHBOARD_API_URL}{self.dashboard_2.id}/")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_non_admin_user_can_create(self):
        """
        Test that a non-admin user can create and update, but not delete.
        """
        self.client.force_authenticate(self.user_Kakashi)

        create_data = {"date": "2023-08-01", "status": "draft", "vaccine": "bOPV", "country_id": self.konoha.id}
        response = self.client.post(self.PERFORMANCE_DASHBOARD_API_URL, data=create_data, format="json")
        self.assertJSONResponse(response, status.HTTP_201_CREATED)

    @freeze_time("2023-10-10")
    def test_non_admin_can_update_recent_record(self):
        """
        Test that a non-admin user CAN update a recently created record
        """
        self.client.force_authenticate(self.user_Kakashi)
        # We are on 2023-10-10. A record created on 2023-10-05 is recent.
        with freeze_time("2023-10-05"):
            recent_dashboard = PerformanceDashboard.objects.create(
                account = self.account_hokage,
                country = self.konoha,
                date = "2023-10-05",
                status = "draft",
                vaccine = "bOPV",
                created_by = self.user_Kakashi,
            )
            # Now, back on 2023-10-10 (5 days later), try to update it.
            update_data = {"status": "final"}
            response = self.client.patch(
            f"{self.PERFORMANCE_DASHBOARD_API_URL}{recent_dashboard.id}/", data = update_data, format = "json"
            )
            self.assertJSONResponse(response, status.HTTP_200_OK)

    @freeze_time("2023-10-20")
    def test_non_admin_cannot_update_old_record(self):
        """
        Test that a non-admin user CANNOT update an old record.
        """
        self.client.force_authenticate(self.user_Kakashi)
        # We are on 2023-10-20. A record created on 2023-10-10 is 10 days old
        with freeze_time("2023-10-10"):
            old_dashboard = PerformanceDashboard.objects.create(
                account = self.account_hokage,
                country = self.konoha,
                date = "2023-10-10",
                status = "draft",
                vaccine = "bOPV",
                created_by = self.user_Kakashi,
            )
        # Now, on 2023-10-20 (10 days later), try to update it. This should fail.
        update_data = {"status": "final"}
        response = self.client.patch(
        f"{self.PERFORMANCE_DASHBOARD_API_URL}{old_dashboard.id}/", data = update_data, format = "json"
        )
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
        self.client.force_authenticate(self.user_Hashirama)  # User from Hokage account
        response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)

        response_data = response.json()
        # Check if the response is paginated or just a list
        if "results" in response_data:
            results = response_data["results"]
            count = len(results)
        else:
            self.fail("Response is not paginated as expected")

        expected_count = PerformanceDashboard.objects.filter(account=self.account_hokage).count()
        self.assertEqual(count, expected_count)

        result_ids = {item["id"] for item in results}
        # dashboard_3 belongs to account_akatsuki and should NOT be visible to user_Hashirama
        self.assertNotIn(
            self.dashboard_3.id,
            result_ids,
            "Dashboard from another account (Akatsuki) should not be listed for Hokage user",
        )

    def test_create_sets_audit_fields_correctly(self):
        """
        Test that on creation, `created_by` and `account` are set automatically by the view/serializer.
        """
        self.client.force_authenticate(self.user_Kakashi)
        data = {
            "date": "2023-09-01",
            "status": "draft",
            "vaccine": "nOPV2",
            "country_id": self.suna.id,
        }
        response = self.client.post(self.PERFORMANCE_DASHBOARD_API_URL, data=data, format="json")
        self.assertJSONResponse(response, status.HTTP_201_CREATED)

        new_dashboard = PerformanceDashboard.objects.get(id=response.json()["id"])
        self.assertEqual(new_dashboard.created_by, self.user_Kakashi)
        self.assertEqual(new_dashboard.account, self.account_hokage)
