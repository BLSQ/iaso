from rest_framework import status

from iaso.models.base import Account
from iaso.models.metric import MetricType, MetricValue
from iaso.models.org_unit import OrgUnit
from iaso.permissions.core_permissions import CORE_ORG_UNITS_PERMISSION
from iaso.test import APITestCase


class MetricTypeAPITestCase(APITestCase):
    def setUp(cls):
        cls.account = Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(
            username="jane_doe",
            last_name="Doe",
            first_name="Jane",
            account=cls.account,
            permissions=[CORE_ORG_UNITS_PERMISSION],
        )

        cls.metric_type_1 = MetricType.objects.create(
            account=cls.account,
            code="MT001",
            name="Metric Type 1",
            description="Description for Metric Type 1",
            category="Category A",
            origin=MetricType.MetricTypeOrigin.CUSTOM.value,
        )
        cls.metric_type_2 = MetricType.objects.create(
            account=cls.account,
            code="MT002",
            name="Metric Type 2",
            description="Description for Metric Type 2",
            category="Category B",
            origin=MetricType.MetricTypeOrigin.OPENHEXA.value,
        )

    def test_metric_type_list(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/metrictypes/")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(data), 2)
        metric_type_codes = {mt["code"] for mt in data}
        self.assertIn("MT001", metric_type_codes)
        self.assertIn("MT002", metric_type_codes)
        custom_metric_types = [mt for mt in data if mt["origin"] == MetricType.MetricTypeOrigin.CUSTOM]
        self.assertEqual(len(custom_metric_types), 1)
        self.assertEqual(custom_metric_types[0]["code"], "MT001")
        oh_metric_types = [mt for mt in data if mt["origin"] == MetricType.MetricTypeOrigin.OPENHEXA]
        self.assertEqual(len(oh_metric_types), 1)
        self.assertEqual(oh_metric_types[0]["code"], "MT002")

    def test_metric_type_post(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/metrictypes/",
            data={
                "code": "MT003",
                "name": "Metric Type 3",
                "description": "Description for Metric Type 3",
                "category": "Category C",
                "origin": MetricType.MetricTypeOrigin.CUSTOM.value,
                "scale": "[1, 2, 3]",
                "legend_type": MetricType.LegendType.THRESHOLD.value,
            },
        )
        self.assertJSONResponse(response, status.HTTP_201_CREATED)

    def test_metric_type_put(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.put(
            f"/api/metrictypes/{self.metric_type_1.id}/",
            data={
                "code": "MT001",
                "name": "Updated Metric Type 1",
                "description": "Updated description for Metric Type 1",
                "origin": MetricType.MetricTypeOrigin.CUSTOM.value,
                "category": "Category A",
                "scale": "[1, 2, 3, 4]",
                "legend_type": MetricType.LegendType.THRESHOLD.value,
            },
        )
        self.assertJSONResponse(response, status.HTTP_200_OK)

        # Verify the update
        updated_metric_type = MetricType.objects.get(id=self.metric_type_1.id)
        self.assertEqual(updated_metric_type.name, "Updated Metric Type 1")
        self.assertEqual(updated_metric_type.description, "Updated description for Metric Type 1")

    def test_metric_type_delete(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f"/api/metrictypes/{self.metric_type_1.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify deletion
        with self.assertRaises(MetricType.DoesNotExist):
            MetricType.objects.get(id=self.metric_type_1.id)

    def test_delete_openhexa_metric_type_forbidden(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f"/api/metrictypes/{self.metric_type_2.id}/")
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        # Verify data contains error message
        self.assertIn("Cannot delete OpenHexa metric types", data)
        # Verify that the MetricType still exists
        metric_type = MetricType.objects.get(id=self.metric_type_2.id)
        self.assertIsNotNone(metric_type)

    def test_metric_type_grouped_per_category(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get("/api/metrictypes/grouped_per_category/")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)

        grouped_data = {group["name"]: group["items"] for group in data}
        self.assertIn("Category A", grouped_data)
        self.assertIn("Category B", grouped_data)

        category_a_items = grouped_data["Category A"]
        category_b_items = grouped_data["Category B"]

        self.assertEqual(len(category_a_items), 1)
        self.assertEqual(category_a_items[0]["code"], "MT001")

        self.assertEqual(len(category_b_items), 1)
        self.assertEqual(category_b_items[0]["code"], "MT002")


class OrgUnitMetricAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(
            username="alice_smith",
            last_name="Smith",
            first_name="Alice",
            account=cls.account,
            permissions=[CORE_ORG_UNITS_PERMISSION],
        )

        cls.metric_type = MetricType.objects.create(
            account=cls.account,
            code="MT001",
            name="Metric Type 1",
            description="Description for Metric Type 1",
            origin=MetricType.MetricTypeOrigin.OPENHEXA,
        )

        cls.org_unit_1 = OrgUnit.objects.create(name="Org Unit 1")
        cls.org_unit_2 = OrgUnit.objects.create(name="Org Unit 2")

        MetricValue.objects.create(
            metric_type=cls.metric_type,
            org_unit=cls.org_unit_1,
            year=2020,
            value=100.0,
        )
        MetricValue.objects.create(
            metric_type=cls.metric_type,
            org_unit=cls.org_unit_2,
            year=2021,
            value=150.0,
        )

    def test_metric_org_units_list(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/metricorgunits/?metric_type_id={self.metric_type.id}")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(data), 2)
        org_unit_ids = {ou["org_unit_id"] for ou in data}
        self.assertIn(self.org_unit_1.id, org_unit_ids)
        self.assertIn(self.org_unit_2.id, org_unit_ids)

    def test_metric_org_units_post(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/metricorgunits/",
            data={
                "metric_type_id": self.metric_type.id,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)  # Method Not Allowed

    def test_metric_org_units_put(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.put(
            f"/api/metricorgunits/{self.org_unit_1.id}/",
            data={
                "metric_type_id": self.metric_type.id,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)  # Method Not Allowed

    def test_metric_org_units_delete(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f"/api/metricorgunits/{self.org_unit_1.id}/")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)  # Method Not Allowed


class MetricValueAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(
            username="john_doe",
            last_name="Doe",
            first_name="John",
            account=cls.account,
            permissions=[CORE_ORG_UNITS_PERMISSION],
        )

        cls.metric_type = MetricType.objects.create(
            account=cls.account,
            code="MT001",
            name="Metric Type 1",
            description="Description for Metric Type 1",
            origin=MetricType.MetricTypeOrigin.OPENHEXA,
        )

        cls.org_unit = OrgUnit.objects.create(name="Org Unit 1")

        cls.metric_value_1 = MetricValue.objects.create(
            metric_type=cls.metric_type,
            org_unit=cls.org_unit,
            year=2020,
            value=100.0,
        )
        cls.metric_value_2 = MetricValue.objects.create(
            metric_type=cls.metric_type,
            org_unit=cls.org_unit,
            year=2021,
            value=150.0,
        )

    def test_metric_value_list(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/metricvalues/")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(data), 2)

    def test_metric_value_post(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/metricvalues/",
            data={
                "metric_type": self.metric_type.id,
                "org_unit": self.org_unit.id,
                "year": 2022,
                "value": 200.0,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)  # Method Not Allowed

    def test_metric_value_put(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.put(
            f"/api/metricvalues/{self.metric_value_1.id}/",
            data={
                "metric_type": self.metric_type.id,
                "org_unit": self.org_unit.id,
                "year": 2020,
                "value": 120.0,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)  # Method Not Allowed

    def test_metric_value_delete(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f"/api/metricvalues/{self.metric_value_1.id}/")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)  # Method Not Allowed
