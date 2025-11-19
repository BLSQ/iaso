from rest_framework import status
from .common_test_data import PerformanceDashboardAPIBase
from plugins.polio.models import performance_dashboard as p


class PerformanceDashboardPermissionsAPITestCase(PerformanceDashboardAPIBase):
    """
    Test cases for permissions on the Performance Dashboard API endpoint.
    """
    def test_list_unauthenticated_returns_401(self):
        """
        Unauthenticated users should not be able to list dashboards.
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

        # GET (list) should be allowed
        response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)

        # GET (retrieve) should be allowed
        response = self.client.get(f"{self.PERFORMANCE_DASHBOARD_API_URL}{self.dashboard_1.id}/")
        self.assertJSONResponse(response, status.HTTP_200_OK)

        # POST (create) should be forbidden
        response = self.client.post(self.PERFORMANCE_DASHBOARD_API_URL, data={}, format="json")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

        # PATCH (update) should be forbidden
        response = self.client.patch(f"{self.PERFORMANCE_DASHBOARD_API_URL}{self.dashboard_1.id}/", data={}, format="json")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

        # DELETE should be forbidden
        response = self.client.delete(f"{self.PERFORMANCE_DASHBOARD_API_URL}{self.dashboard_1.id}/")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_non_admin_user_permissions(self):
        """
        Test that a non-admin user can perform GET, POST, PATCH but not DELETE.
        """
        self.client.force_authenticate(self.user_Kakashi)

        # GET (list) should be allowed
        response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)

        # GET (retrieve) should be allowed
        response = self.client.get(f"{self.PERFORMANCE_DASHBOARD_API_URL}{self.dashboard_1.id}/")
        self.assertJSONResponse(response, status.HTTP_200_OK)

        # POST (create) should be allowed
        create_data = {"date": "2023-08-01", "status": "draft", "antigen": "bOPV", "country_id": self.konoha.id}
        response = self.client.post(self.PERFORMANCE_DASHBOARD_API_URL, data=create_data, format="json")
        self.assertJSONResponse(response, status.HTTP_201_CREATED)

        # PATCH (update) should be allowed
        update_data = {"status": "final"}
        response = self.client.patch(
            f"{self.PERFORMANCE_DASHBOARD_API_URL}{self.dashboard_1.id}/",
            data=update_data,
            format="json")
        self.assertJSONResponse(response, status.HTTP_200_OK)

        # DELETE should be forbidden
        response = self.client.delete(f"{self.PERFORMANCE_DASHBOARD_API_URL}{self.dashboard_1.id}/")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_admin_user_can_delete(self):
        """
        Test that an admin user can perform a DELETE request.
        """
        self.client.force_authenticate(self.user_Hashirama)
        response = self.client.delete(f"{self.PERFORMANCE_DASHBOARD_API_URL}{self.dashboard_1.id}/")
        self.assertJSONResponse(response, status.HTTP_204_NO_CONTENT)
        # Verify soft deletion
        self.assertIsNone(p.PerformanceDashboard.objects.filter(id=self.dashboard_1.id).first())