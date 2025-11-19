from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from .common_test_data import PerformanceDashboardAPIBase
from plugins.polio.api.perfomance_dashboard.serializers import (
    PerformanceDashboardListSerializer,
    PerformanceDashboardWriteSerializer,
)
from iaso import models as m
from plugins.polio.models.performance_dashboard import PerformanceDashboard


class PerformanceDashboardSerializerAPITestCase(PerformanceDashboardAPIBase):
    """
    Test cases for the Performance Dashboard serializers.
    """

    def test_list_serializer_returns_expected_data(self):
        """
        Test that the List/Read serializer returns the correct structure and data.
        """
        # Get a dashboard instance from the test data
        dashboard = self.dashboard_1
        serializer = PerformanceDashboardListSerializer(instance=dashboard)
        data = serializer.data

        # Check that all expected keys are present
        self.assertIn("id", data)
        self.assertIn("date", data)
        self.assertIn("status", data)
        self.assertIn("antigen", data)
        self.assertIn("country", data)
        self.assertIn("created_by", data)

        # Check that the values are correct
        self.assertEqual(data["id"], dashboard.id)
        self.assertEqual(data["status"], dashboard.status)

        # Check that nested objects are serialized correctly
        self.assertEqual(data["country"]["id"], dashboard.country.id)
        self.assertEqual(data["country"]["name"], dashboard.country.name)
        self.assertEqual(data["created_by"]["username"], dashboard.created_by.username)

    def test_write_serializer_create_success(self):
        """
        Test that the Write serializer can successfully create a new object.
        """
        # Data for a new dashboard
        data = {
            # "account": self.account_hokage,
            "date": "2023-05-01",
            "status": "draft",
            "antigen": "bOPV",
            "country_id": self.konoha.id,

        }
        # Ensure the user has an iaso_profile and an account
        if not hasattr(self.user_Hashirama, 'iaso_profile'):
            self.user_Hashirama.iaso_profile = m.IasoProfile.objects.create(
                user=self.user_Hashirama,account=self.account_hokage)
            self.user_Hashirama.save()
        # We need to mock a request to pass in the context,
        # because the serializer's create method needs it to get the user and account.
        factory = APIRequestFactory()
        # Create the raw Django request without setting user yet
        django_request = factory.post(self.PERFORMANCE_DASHBOARD_API_URL, data, format="json")

        # Wrap it in DRF's Request
        drf_request = Request(django_request)
        # Now, set the user directly on the DRF request object.
        drf_request.user = self.user_Hashirama  # The user performing the action

        # Create the serializer with the correctly configured DRF request in the context
        serializer = PerformanceDashboardWriteSerializer(data=data, context={"request": drf_request})

        # Check if the data is valid
        self.assertTrue(serializer.is_valid(), serializer.errors)

        # --- TEMPORARY DEBUGGING STEP ---
        is_valid = serializer.is_valid()
        if not is_valid:
            print("Serializer validation errors:", serializer.errors)

        # Save the new object
        new_dashboard = serializer.save()

        # Verify the object was created and fields are set correctly
        self.assertIsInstance(new_dashboard, PerformanceDashboard)
        self.assertEqual(new_dashboard.status, "draft")
        self.assertEqual(new_dashboard.country, self.konoha)

        # Verify that the user and account were set automatically
        self.assertEqual(new_dashboard.created_by, self.user_Hashirama)
        self.assertEqual(new_dashboard.account, self.account_hokage)

    def test_write_serializer_invalid_data_fails(self):
        """
        Test that the Write serializer fails with invalid or missing data.
        """
        # Data with a missing required field ('country_id')
        invalid_data = {
            "date": "2023-06-01",
            "status": "final",
            "antigen": "nOPV2",
        }

        serializer = PerformanceDashboardWriteSerializer(data=invalid_data)

        # Check that the serializer is not valid
        self.assertFalse(serializer.is_valid())

        # Check that the 'errors' dictionary contains the expected error
        self.assertIn("country_id", serializer.errors)
        self.assertEqual(serializer.errors["country_id"][0].code, "required")
