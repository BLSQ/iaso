import datetime

from unittest.mock import patch

from django.utils import timezone
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
        self.client.force_authenticate(self.user_no_permissions_1)
        response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL)
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_read_only_user_permissions(self):
        """
        Test that a read-only user can only perform GET requests.
        """
        self.client.force_authenticate(self.user_read_only_1)

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
        self.client.force_authenticate(self.user_non_admin_1)

        create_data = {"date": "2023-08-01", "status": "draft", "vaccine": "bOPV", "country_id": self.est.id}
        response = self.client.post(self.PERFORMANCE_DASHBOARD_API_URL, data=create_data, format="json")
        self.assertJSONResponse(response, status.HTTP_201_CREATED)

    @patch("django.utils.timezone.now")
    def test_non_admin_can_update_recent_record(self, mock_now):
        """
        Test that a non-admin user CAN update a recently created record
        """
        self.client.force_authenticate(self.user_non_admin_1)

        time_of_creation = timezone.make_aware(datetime.datetime(2023, 10, 5))
        mock_now.return_value = time_of_creation
        recent_dashboard = PerformanceDashboard.objects.create(
            account=self.account_one,
            country=self.est,
            date="2023-10-05",
            status="draft",
            vaccine="bOPV",
            created_by=self.user_non_admin_1,
        )

        time_of_update = timezone.make_aware(datetime.datetime(2023, 10, 10))
        mock_now.return_value = time_of_update

        update_data = {"status": "final"}
        response = self.client.patch(
            f"{self.PERFORMANCE_DASHBOARD_API_URL}{recent_dashboard.id}/", data=update_data, format="json"
        )
        self.assertJSONResponse(response, status.HTTP_200_OK)
        recent_dashboard.refresh_from_db()
        self.assertEqual(recent_dashboard.updated_by, self.user_non_admin_1)

    @patch("django.utils.timezone.now")
    def test_non_admin_cannot_update_old_record(self, mock_now):
        """
        Test that a non-admin user CANNOT update an old record.
        """
        self.client.force_authenticate(self.user_non_admin_1)

        time_of_creation = timezone.make_aware(datetime.datetime(2023, 10, 10))
        mock_now.return_value = time_of_creation

        old_dashboard = PerformanceDashboard.objects.create(
            account=self.account_one,
            country=self.est,
            date="2023-10-10",
            status="draft",
            vaccine="bOPV",
            created_by=self.user_non_admin_1,
        )
        time_of_update = timezone.make_aware(datetime.datetime(2023, 10, 20))
        mock_now.return_value = time_of_update

        update_data = {"status": "final"}
        response = self.client.patch(
            f"{self.PERFORMANCE_DASHBOARD_API_URL}{old_dashboard.id}/", data=update_data, format="json"
        )
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_admin_user_can_delete(self):
        """
        Test that an admin user can perform a DELETE request,
        and that the system correctly logs WHO deleted it.
        """
        self.client.force_authenticate(self.user_admin_1)

        dashboard_id = self.dashboard_2.id

        response = self.client.delete(f"{self.PERFORMANCE_DASHBOARD_API_URL}{dashboard_id}/")
        self.assertJSONResponse(response, status.HTTP_204_NO_CONTENT)

        deleted_dashboard = PerformanceDashboard.objects_include_deleted.get(id=dashboard_id)

        self.assertIsNotNone(deleted_dashboard.deleted_at)

        self.assertEqual(deleted_dashboard.updated_by, self.user_admin_1)

    def test_admin_user_can_update(self):
        """
        Test that a PATCH request correctly updates the data and sets the `updated_by` field.
        """
        self.client.force_authenticate(self.user_admin_1)

        dashboard_to_update = self.dashboard_1

        update_data = {"status": "final", "vaccine": "nOPV2"}

        response = self.client.patch(
            f"{self.PERFORMANCE_DASHBOARD_API_URL}{dashboard_to_update.id}/", data=update_data, format="json"
        )

        self.assertJSONResponse(response, status.HTTP_200_OK)

        dashboard_to_update.refresh_from_db()

        self.assertEqual(dashboard_to_update.status, "final")
        self.assertEqual(dashboard_to_update.vaccine, "nOPV2")

        self.assertEqual(dashboard_to_update.updated_by, self.user_admin_1)

    def test_perform_destroy_audits_user(self):
        """
        Test that perform_destroy correctly sets updated_by and soft-deletes the instance.
        """
        # Authenticate a user who can delete (e.g., an admin)
        self.client.force_authenticate(self.user_admin_1)

        dashboard_to_delete = self.dashboard_1

        response = self.client.delete(f"{self.PERFORMANCE_DASHBOARD_API_URL}{dashboard_to_delete.id}/")

        self.assertJSONResponse(response, status.HTTP_204_NO_CONTENT)

        deleted_dashboard = PerformanceDashboard.objects_include_deleted.get(id=dashboard_to_delete.id)

        self.assertIsNotNone(deleted_dashboard.deleted_at)

        self.assertEqual(deleted_dashboard.updated_by, self.user_admin_1)

        self.assertFalse(PerformanceDashboard.objects.filter(id=dashboard_to_delete.id).exists())

    # --- Data Isolation and Functionality Tests ---

    def test_list_returns_only_own_account_dashboards(self):
        """
        Test that a user can only list dashboards from their own account.
        """
        self.client.force_authenticate(self.user_admin_1)
        response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)

        response_data = response.json()
        if "results" in response_data:
            results = response_data["results"]
            count = len(results)
        else:
            self.fail("Response is not paginated as expected")

        expected_count = PerformanceDashboard.objects.filter(account=self.account_one).count()
        self.assertEqual(count, expected_count)

        result_ids = {item["id"] for item in results}

        self.assertNotIn(
            self.dashboard_3.id,
            result_ids,
        )

    def test_create_sets_audit_fields_correctly(self):
        """
        Test that on creation, `created_by` and `account` are set automatically by the view/serializer.
        """
        self.client.force_authenticate(self.user_with_account2)
        data = {
            "date": "2023-09-01",
            "status": "draft",
            "vaccine": "nOPV2",
            "country_id": self.south.id,
        }
        response = self.client.post(self.PERFORMANCE_DASHBOARD_API_URL, data=data, format="json")
        self.assertJSONResponse(response, status.HTTP_201_CREATED)

        new_dashboard = PerformanceDashboard.objects.get(id=response.json()["id"])
        self.assertEqual(new_dashboard.created_by, self.user_with_account2)
        self.assertEqual(new_dashboard.account, self.account_two)
