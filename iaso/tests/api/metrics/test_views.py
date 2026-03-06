from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from rest_framework import status

from iaso.models.base import Account
from iaso.models.data_source import DataSource, SourceVersion
from iaso.models.metric import MetricType, MetricValue
from iaso.models.org_unit import OrgUnit, OrgUnitType
from iaso.models.project import Project
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

    def test_metric_type_list_unauthenticated(self):
        response = self.client.get("/api/metrictypes/")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

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
                "legend_config": {"domain": [1.0, 2.0, 3.0], "range": ["#A2CAEA", "#ACDF9B", "#F2B16E", "#A93A42"]},
                "legend_type": MetricType.LegendType.THRESHOLD.value,
            },
        )
        self.assertJSONResponse(response, status.HTTP_201_CREATED)

        created_mt = MetricType.objects.get(code="MT003")
        self.assertEqual(created_mt.account, self.account)
        self.assertEqual(created_mt.legend_type, MetricType.LegendType.THRESHOLD.value)
        self.assertEqual(created_mt.origin, MetricType.MetricTypeOrigin.CUSTOM.value)
        self.assertEqual(
            created_mt.legend_config,
            {
                "domain": [1.0, 2.0, 3.0],
                "range": [
                    "#A2CAEA",
                    "#ACDF9B",
                    "#F2B16E",
                    "#A93A42",
                ],
            },
        )

    def test_metric_type_post_unauthenticated(self):
        response = self.client.post(
            "/api/metrictypes/",
            data={
                "code": "MT003",
                "name": "Metric Type 3",
                "description": "Description for Metric Type 3",
                "category": "Category C",
                "origin": MetricType.MetricTypeOrigin.CUSTOM.value,
                "legend_config": {"domain": [1.0, 2.0, 3.0], "range": ["#A2CAEA", "#ACDF9B", "#F2B16E", "#A93A42"]},
                "legend_type": MetricType.LegendType.THRESHOLD.value,
            },
        )
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_metric_type_patch(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            f"/api/metrictypes/{self.metric_type_1.id}/",
            data={
                "code": "MT001",
                "name": "Updated Metric Type 1",
                "description": "Updated description for Metric Type 1",
                "origin": MetricType.MetricTypeOrigin.CUSTOM.value,
                "category": "Category A",
                "legend_config": {
                    "domain": [1.0, 2.0, 3.0, 4.0],
                    "range": ["#A2CAEA", "#ACDF9B", "#F2B16E", "#A93A42"],
                },
                "legend_type": MetricType.LegendType.THRESHOLD.value,
            },
        )
        self.assertJSONResponse(response, status.HTTP_200_OK)

        # Verify the update
        updated_metric_type = MetricType.objects.get(id=self.metric_type_1.id)
        self.assertEqual(updated_metric_type.name, "Updated Metric Type 1")
        self.assertEqual(updated_metric_type.description, "Updated description for Metric Type 1")

    def test_metric_type_update_unauthenticated(self):
        response = self.client.patch(
            f"/api/metrictypes/{self.metric_type_1.id}/",
            data={
                "code": "MT001",
                "name": "Updated Metric Type 1",
                "description": "Updated description for Metric Type 1",
                "origin": MetricType.MetricTypeOrigin.CUSTOM.value,
                "category": "Category A",
                "legend_config": {
                    "domain": [1.0, 2.0, 3.0, 4.0],
                    "range": ["#A2CAEA", "#ACDF9B", "#F2B16E", "#A93A42"],
                },
                "legend_type": MetricType.LegendType.THRESHOLD.value,
            },
        )
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_metric_type_delete(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f"/api/metrictypes/{self.metric_type_1.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify deletion
        with self.assertRaises(MetricType.DoesNotExist):
            MetricType.objects.get(id=self.metric_type_1.id)

    def test_metric_type_delete_unauthenticated(self):
        response = self.client.delete(f"/api/metrictypes/{self.metric_type_1.id}/")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

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

    def test_metric_org_units_patch(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
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

        cls.other_account = Account.objects.create(name="Other Account")

        cls.metric_type = MetricType.objects.create(
            account=cls.account,
            code="MT001",
            name="Metric Type 1",
            description="Description for Metric Type 1",
            origin=MetricType.MetricTypeOrigin.OPENHEXA,
        )

        cls.metric_type_wrong_account = MetricType.objects.create(
            account=cls.other_account,
            code="MT999",
            name="Other Metric Type",
            description="Description for Other Metric Type",
            origin=MetricType.MetricTypeOrigin.OPENHEXA,
        )

        # Create Org Units
        cls.project = project = Project.objects.create(
            name="Project",
            app_id="APP_ID",
            account=cls.account,
        )
        sw_source = DataSource.objects.create(name="data_source")
        sw_source.projects.add(project)
        cls.sw_source = sw_source
        cls.sw_version_1 = sw_version_1 = SourceVersion.objects.create(data_source=sw_source, number=1)
        cls.account.default_version = sw_version_1
        cls.account.save()
        cls.out_district = OrgUnitType.objects.create(name="DISTRICT")
        cls.mock_multipolygon = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))

        cls.org_unit = OrgUnit.objects.create(
            org_unit_type=cls.out_district,
            name="District Wrong Version",
            validation_status=OrgUnit.VALIDATION_VALID,
            version=cls.account.default_version,
            location=Point(x=4, y=50, z=100),
            geom=cls.mock_multipolygon,
        )

        cls.org_unit_rejected = OrgUnit.objects.create(
            org_unit_type=cls.out_district,
            name="District Rejected",
            validation_status=OrgUnit.VALIDATION_REJECTED,
            version=sw_version_1,
            location=Point(x=4, y=50, z=100),
            geom=cls.mock_multipolygon,
        )

        cls.org_unit_wrong_version = OrgUnit.objects.create(
            org_unit_type=cls.out_district,
            name="District Wrong Version",
            validation_status=OrgUnit.VALIDATION_VALID,
            version=None,
            location=Point(x=4, y=50, z=100),
            geom=cls.mock_multipolygon,
        )

        cls.org_unit_no_location = OrgUnit.objects.create(
            org_unit_type=cls.out_district,
            name="District No Location",
            validation_status=OrgUnit.VALIDATION_VALID,
            version=sw_version_1,
            location=None,
            geom=cls.mock_multipolygon,
        )

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
                "value": 200.0,
                "year": 2022,
                "string_value": "200",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_metric_value_post_unauthenticated(self):
        response = self.client.post(
            "/api/metricvalues/",
            data={
                "metric_type": self.metric_type.id,
                "org_unit": self.org_unit.id,
                "value": 200.0,
                "year": 2022,
                "string_value": "200",
            },
        )
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_metric_value_post_invalid_metric_type(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/metricvalues/",
            data={
                "metric_type": 9999,  # Invalid metric type ID
                "org_unit": self.org_unit.id,
                "value": 200.0,
                "year": 2022,
                "string_value": "200",
            },
        )
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

    def test_metric_value_post_metric_type_not_in_account(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/metricvalues/",
            data={
                "metric_type": self.metric_type_wrong_account.id,  # Metric type not in user's account
                "org_unit": self.org_unit.id,
                "value": 200.0,
                "year": 2022,
                "string_value": "200",
            },
        )
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

    def test_metric_value_post_invalid_org_unit(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/metricvalues/",
            data={
                "metric_type": self.metric_type.id,
                "org_unit": 9999,  # Invalid org unit ID
                "value": 200.0,
                "year": 2022,
                "string_value": "200",
            },
        )
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

    def test_metric_value_post_org_unit_rejected(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/metricvalues/",
            data={
                "metric_type": self.metric_type.id,
                "org_unit": self.org_unit_rejected.id,  # Rejected org unit
                "value": 200.0,
                "year": 2022,
                "string_value": "200",
            },
        )
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

    def test_metric_value_post_org_unit_wrong_version(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/metricvalues/",
            data={
                "metric_type": self.metric_type.id,
                "org_unit": self.org_unit_wrong_version.id,  # Org unit with wrong version
                "value": 200.0,
                "year": 2022,
                "string_value": "200",
            },
        )
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

    def test_metric_value_post_org_unit_no_location(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/metricvalues/",
            data={
                "metric_type": self.metric_type.id,
                "org_unit": self.org_unit_no_location.id,  # Org unit with no location
                "value": 200.0,
                "year": 2022,
                "string_value": "200",
            },
        )
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

    def test_metric_value_post_org_unit_not_accessible(self):
        inaccessible_org_unit = OrgUnit.objects.create(name="Inaccessible Org Unit")

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/metricvalues/",
            data={
                "metric_type": self.metric_type.id,
                "org_unit": inaccessible_org_unit.id,  # Org unit not accessible to user
                "value": 200.0,
                "year": 2022,
                "string_value": "200",
            },
        )
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

    def test_metric_value_patch(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
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
