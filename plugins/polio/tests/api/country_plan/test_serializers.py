from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from plugins.polio.api.country_plan.serializers import (
    CountryPlanListSerializer,
    CountryPlanWriteSerializer,
)
from plugins.polio.models.country_plan import CountryPlan

from .common_test_data import CountryPlanAPIBase


class CountryPlanSerializerAPITestCase(CountryPlanAPIBase):
    """
    Test cases for the Performance Dashboard serializers.
    """

    def test_list_serializer_returns_expected_data(self):
        """
        Test that the List/Read serializer returns the correct structure and data.
        """
        dashboard = self.dashboard_1
        serializer = CountryPlanListSerializer(instance=dashboard)
        data = serializer.data

        self.assertIn("id", data)
        self.assertIn("date", data)
        self.assertIn("status", data)
        self.assertIn("vaccine", data)

        # Check that the values are correct
        self.assertEqual(data["id"], dashboard.id)
        self.assertEqual(data["status"], dashboard.status)

        self.assertEqual(data["country_name"], dashboard.country.name)

    def test_write_serializer_create_success(self):
        """
        Test that the Write serializer can successfully create a new object.
        """
        data = {
            "date": "2023-05-01",
            "status": "draft",
            "vaccine": "bOPV",
            "country_id": self.east.id,
        }
        factory = APIRequestFactory()
        django_request = factory.post(self.COUNTRY_PLAN_API_URL, data, format="json")

        drf_request = Request(django_request)
        drf_request.user = self.user_admin_1

        serializer = CountryPlanWriteSerializer(data=data, context={"request": drf_request})

        self.assertTrue(serializer.is_valid(), serializer.errors)

        new_dashboard = serializer.save()

        self.assertIsInstance(new_dashboard, CountryPlan)
        self.assertEqual(new_dashboard.status, "draft")
        self.assertEqual(new_dashboard.country, self.east)

        self.assertEqual(new_dashboard.account, self.account_one)

    def test_write_serializer_invalid_data_fails(self):
        """
        Test that the Write serializer fails with invalid or missing data.
        """
        invalid_data = {
            "date": "2023-06-01",
            "status": "final",
            "vaccine": "nOPV2",
        }

        serializer = CountryPlanWriteSerializer(data=invalid_data)

        self.assertFalse(serializer.is_valid())

        self.assertIn("country_id", serializer.errors)
        self.assertEqual(serializer.errors["country_id"][0].code, "required")

    def test_create_raises_validation_error_if_request_missing(self):
        """Test that .save() fails if request is not in serializer context."""
        data = {
            "date": "2023-05-01",
            "status": "draft",
            "vaccine": "bOPV",
            "country_id": self.east.id,
        }
        serializer = CountryPlanWriteSerializer(data=data, context={})
        self.assertTrue(serializer.is_valid())

        with self.assertRaises(serializers.ValidationError) as e:
            serializer.save()
        self.assertIn("Request context is missing", str(e.exception))

    def test_create_raises_validation_error_if_country_does_not_exist(self):
        """
        Test that providing a non-existent country_id returns a 400 Bad Request,
        not a 500 Server Error.
        """
        data = {
            "date": "2023-05-01",
            "status": "draft",
            "vaccine": "bOPV",
            "country_id": 999999,
        }

        serializer = CountryPlanWriteSerializer(data=data)

        self.assertFalse(serializer.is_valid(), "Serializer accepted a non-existent country ID!")

        self.assertIn("country_id", serializer.errors)
