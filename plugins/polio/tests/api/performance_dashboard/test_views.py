import datetime

from unittest.mock import patch

import jsonschema

from django.utils import timezone
from rest_framework import status

from hat.audit.models import Modification
from plugins.polio.models.performance_dashboard import PerformanceDashboard

from .common_test_data import PerformanceDashboardAPIBase


model_json_schema = PerformanceDashboard.json_schema()
PERFORMANCE_DASHBOARD_LOG_SCHEMA = Modification.make_json_schema(model_json_schema, model_json_schema)


class PerformanceDashboardViewsAPITestCase(PerformanceDashboardAPIBase):
    """
    Test cases for the main actions of the Performance Dashboard API endpoint (ViewSet).
    """

    # --- Permissions Tests ---

    def test_unauthenticated_access_read_only(self):
        """
        Unauthenticated users should not be able to access the endpoint.
        """
        response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)

        response = self.client.post(self.PERFORMANCE_DASHBOARD_API_URL, data={}, format="json")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_list_with_no_perms_read_only(self):
        """
        Authenticated users without the correct permissions should be forbidden.
        """
        self.client.force_authenticate(self.user_no_permissions_1)
        response = self.client.get(self.PERFORMANCE_DASHBOARD_API_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)
        response = self.client.post(self.PERFORMANCE_DASHBOARD_API_URL, data={}, format="json")
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

        create_data = {"date": "2023-08-01", "status": "draft", "vaccine": "bOPV", "country_id": self.east.id}
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
            country=self.east,
            date="2023-10-05",
            status="draft",
            vaccine="bOPV",
        )

        time_of_update = timezone.make_aware(datetime.datetime(2023, 10, 10))
        mock_now.return_value = time_of_update

        update_data = {"status": "final"}
        response = self.client.patch(
            f"{self.PERFORMANCE_DASHBOARD_API_URL}{recent_dashboard.id}/", data=update_data, format="json"
        )
        self.assertJSONResponse(response, status.HTTP_200_OK)

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
            country=self.east,
            date="2023-10-10",
            status="draft",
            vaccine="bOPV",
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

    def test_admin_user_can_update(self):
        """
        Test that a PATCH request correctly updates the data field.
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

    # --- Data Isolation and Functionality Tests ---

    def test_list_filters_by_account(self):
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

    def test_audit_log_on_save(self):
        """
        Test that Modification instance is created on save
        """
        self.client.force_authenticate(self.superuser)

        dashboard_to_update = self.dashboard_1

        update_data = {"status": "final", "vaccine": "nOPV2"}

        response = self.client.patch(
            f"{self.PERFORMANCE_DASHBOARD_API_URL}{dashboard_to_update.id}/", data=update_data, format="json"
        )

        self.assertJSONResponse(response, status.HTTP_200_OK)

        response = self.client.get(
            f"/api/logs/?contentType=polio.performancedashboard&fields=past_value,new_value&objectId={dashboard_to_update.id}"
        )
        logs = self.assertJSONResponse(response, status.HTTP_200_OK)
        log = logs["list"][0]

        try:
            jsonschema.validate(instance=log, schema=PERFORMANCE_DASHBOARD_LOG_SCHEMA)
        except jsonschema.exceptions.ValidationError as ex:
            self.fail(msg=str(ex))

        past_value = log["past_value"][0]
        self.assertEqual(past_value["id"], dashboard_to_update.id)
        self.assertEqual(past_value["date"], dashboard_to_update.date.strftime("%Y-%m-%d"))
        self.assertEqual(past_value["status"], "draft")
        self.assertEqual(past_value["country_name"], self.west.name)
        self.assertEqual(past_value["country_id"], str(self.west.id))
        self.assertEqual(past_value["vaccine"], "bOPV")
        new_value = log["new_value"][0]
        self.assertEqual(new_value["id"], dashboard_to_update.id)
        self.assertEqual(new_value["date"], dashboard_to_update.date.strftime("%Y-%m-%d"))
        self.assertEqual(new_value["status"], "final")
        self.assertEqual(new_value["country_name"], self.west.name)
        self.assertEqual(new_value["country_id"], str(self.west.id))
        self.assertEqual(new_value["vaccine"], "nOPV2")
