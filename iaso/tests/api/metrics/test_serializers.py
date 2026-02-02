from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIRequestFactory

from iaso.api.metrics.serializers import (
    ImportMetricValuesSerializer,
    MetricTypeCreateSerializer,
    MetricTypeSerializer,
    MetricTypeWriteSerializer,
    MetricValueSerializer,
    OrgUnitIdSerializer,
)
from iaso.models.base import Account
from iaso.models.metric import MetricType
from iaso.models.org_unit import OrgUnit, OrgUnitType
from iaso.test import TestCase


class MetricTypeSerializerTestCase(TestCase):
    def test_fields(self):
        serializer = MetricTypeSerializer()
        expected_fields = {
            "id",
            "code",
            "account",
            "name",
            "category",
            "description",
            "source",
            "units",
            "unit_symbol",
            "comments",
            "legend_config",
            "legend_type",
            "origin",
            "created_at",
            "updated_at",
        }
        readonly_fields = {
            "id",
            "account",
            "created_at",
            "updated_at",
        }
        self.assertEqual(set(serializer.Meta.fields), expected_fields)
        self.assertEqual(set(serializer.Meta.read_only_fields), readonly_fields)


class MetricTypeWriteSerializerTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(
            email="john@polio.org",
            username="test",
            first_name="John",
            last_name="Doe",
            account=cls.account,
        )

        cls.request = APIRequestFactory().get("/")
        cls.request.user = cls.user

        cls.request_data = {
            "code": "existing_code",
            "name": "Existing Metric Type",
            "category": "Existing Category",
            "legend_type": "threshold",
            "units": "units",
            "unit_symbol": "u",
            "description": "An existing metric type",
            "origin": "custom",
            "scale": "[10, 20, 30, 40, 50, 60, 70]",
        }

        cls.metric_type = MetricType.objects.create(
            account=cls.account,
            code="MT1",
            name="Metric Type 1",
            category="Category 1",
            legend_type="threshold",
            legend_config={"thresholds": [10, 20, 30]},
        )

    def test_fields(self):
        serializer = MetricTypeWriteSerializer()
        expected_fields = {
            "name",
            "category",
            "description",
            "units",
            "unit_symbol",
            "legend_type",
            "origin",
            "scale",
        }
        self.assertEqual(set(serializer.Meta.fields), expected_fields)

    def test_update(self):
        serializer_context = {"request": self.request}
        serializer = MetricTypeWriteSerializer(
            instance=self.metric_type,
            data={
                "name": "Updated Metric Type 1",
                "category": "Updated Category 1",
                "description": "Updated description",
                "units": "updated units",
                "unit_symbol": "uu",
                "legend_type": "threshold",
                "origin": "custom",
                "scale": "[5, 15, 25, 35]",
            },
            context=serializer_context,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_metric_type = serializer.save()

        self.assertEqual(updated_metric_type.name, "Updated Metric Type 1")
        self.assertEqual(updated_metric_type.category, "Updated Category 1")
        self.assertEqual(updated_metric_type.description, "Updated description")
        self.assertEqual(updated_metric_type.units, "updated units")
        self.assertEqual(updated_metric_type.unit_symbol, "uu")
        self.assertEqual(updated_metric_type.legend_type, "threshold")
        self.assertEqual(updated_metric_type.origin, "custom")

        expected_legend_config = {
            "domain": [5.0, 15.0, 25.0, 35.0],
            "range": ["#A2CAEA", "#ACDF9B", "#F5F1A0", "#F2B16E", "#A93A42"],
        }

        self.assertEqual(
            updated_metric_type.legend_config,
            expected_legend_config,
        )

    def test_update_metric_type_invalid_scale(self):
        invalid_data = self.request_data.copy()
        invalid_data["scale"] = "[10]"  # Invalid for threshold (needs at least 2)
        serializer_context = {"request": self.request}
        serializer = MetricTypeWriteSerializer(data=invalid_data, context=serializer_context)
        self.assertFalse(serializer.is_valid())
        self.assertIn("Threshold legend type requires at least two scale items.", serializer.errors["non_field_errors"])

        invalid_data["scale"] = "[10, 20, 30, 40, 50, 60, 70, 80, 90, 100]"  # Invalid for threshold (max 9)
        serializer = MetricTypeWriteSerializer(data=invalid_data, context=serializer_context)
        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "Threshold legend type allows a maximum of nine scale items.", serializer.errors["non_field_errors"]
        )

        invalid_data = self.request_data.copy()
        invalid_data["legend_type"] = "linear"
        invalid_data["scale"] = "[10, 20, 30]"  # Invalid for linear (needs exactly 2)
        serializer = MetricTypeWriteSerializer(data=invalid_data, context=serializer_context)
        self.assertFalse(serializer.is_valid())
        self.assertIn("Linear legend type requires exactly two scale items.", serializer.errors["non_field_errors"])

        invalid_data = self.request_data.copy()
        invalid_data["legend_type"] = "ordinal"
        invalid_data["scale"] = "[10]"  # Invalid for ordinal (needs at least 2)
        serializer = MetricTypeWriteSerializer(data=invalid_data, context=serializer_context)
        self.assertFalse(serializer.is_valid())
        self.assertIn("Ordinal legend type requires at least two scale items.", serializer.errors["non_field_errors"])

        invalid_data = self.request_data.copy()
        invalid_data["legend_type"] = "ordinal"
        invalid_data["scale"] = "[10, 20, 30, 40, 50]"  # Invalid for ordinal (max 4)
        serializer = MetricTypeWriteSerializer(data=invalid_data, context=serializer_context)
        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "Ordinal legend type allows a maximum of four scale items.", serializer.errors["non_field_errors"]
        )


class MetricTypeCreateSerializerTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(
            email="john@polio.org",
            username="test",
            first_name="John",
            last_name="Doe",
            account=cls.account,
        )

        cls.request = APIRequestFactory().get("/")
        cls.request.user = cls.user

        cls.request_data = {
            "code": "existing_code",
            "name": "Existing Metric Type",
            "category": "Existing Category",
            "legend_type": "threshold",
            "units": "units",
            "unit_symbol": "u",
            "description": "An existing metric type",
            "origin": "custom",
            "scale": "[10, 20, 30, 40, 50, 60, 70]",
        }

    def test_fields(self):
        serializer = MetricTypeCreateSerializer()
        expected_fields = {
            "code",
            "name",
            "category",
            "description",
            "units",
            "unit_symbol",
            "legend_type",
            "origin",
            "scale",
        }
        self.assertEqual(set(serializer.Meta.fields), expected_fields)

    def test_validate_code_whitespace(self):
        serializer = MetricTypeCreateSerializer(data={"code": "invalid code"}, context={"request": self.request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("Code must not contain whitespace.", serializer.errors["code"])

    def test_validate_code_existing(self):
        MetricType.objects.create(
            account=self.account,
            code=self.request_data["code"],
            name="Existing Metric Type",
            category="Existing Category",
            legend_type="threshold",
        )
        serializer = MetricTypeCreateSerializer(data=self.request_data, context={"request": self.request})
        self.assertFalse(serializer.is_valid())
        self.assertEqual("uniqueCode", serializer.errors["code"][0])

    def test_validate_code_new(self):
        serializer_context = {"request": self.request}
        serializer = MetricTypeCreateSerializer(data=self.request_data, context=serializer_context)
        self.assertTrue(serializer.is_valid())

    def test_create_metric_type(self):
        serializer_context = {"request": self.request}
        serializer = MetricTypeCreateSerializer(data=self.request_data, context=serializer_context)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        metric_type = serializer.save()
        self.assertEqual(metric_type.account, self.account)
        self.assertEqual(metric_type.code, self.request_data["code"])
        self.assertEqual(metric_type.name, self.request_data["name"])
        self.assertEqual(metric_type.category, self.request_data["category"])
        self.assertEqual(metric_type.units, self.request_data["units"])
        self.assertEqual(metric_type.unit_symbol, self.request_data["unit_symbol"])
        self.assertEqual(metric_type.description, self.request_data["description"])
        self.assertEqual(metric_type.legend_type, self.request_data["legend_type"])
        self.assertEqual(metric_type.origin, self.request_data["origin"])

        expected_legend_config = {
            "domain": [10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0],
            "range": [
                "#A2CAEA",
                "#6BD39D",
                "#ACDF9B",
                "#F5F1A0",
                "#F2B16E",
                "#E4754F",
                "#C54A53",
                "#A93A42",
            ],
        }

        self.assertEqual(
            metric_type.legend_config,
            expected_legend_config,
        )

    def test_create_metric_type_invalid_scale(self):
        invalid_data = self.request_data.copy()
        invalid_data["scale"] = "[10]"  # Invalid for threshold (needs at least 2)
        serializer_context = {"request": self.request}
        serializer = MetricTypeCreateSerializer(data=invalid_data, context=serializer_context)
        self.assertFalse(serializer.is_valid())
        self.assertIn("Threshold legend type requires at least two scale items.", serializer.errors["non_field_errors"])

        invalid_data["scale"] = "[10, 20, 30, 40, 50, 60, 70, 80, 90, 100]"  # Invalid for threshold (max 9)
        serializer = MetricTypeCreateSerializer(data=invalid_data, context=serializer_context)
        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "Threshold legend type allows a maximum of nine scale items.", serializer.errors["non_field_errors"]
        )

        invalid_data = self.request_data.copy()
        invalid_data["legend_type"] = "linear"
        invalid_data["scale"] = "[10, 20, 30]"  # Invalid for linear (needs exactly 2)
        serializer = MetricTypeCreateSerializer(data=invalid_data, context=serializer_context)
        self.assertFalse(serializer.is_valid())
        self.assertIn("Linear legend type requires exactly two scale items.", serializer.errors["non_field_errors"])

        invalid_data = self.request_data.copy()
        invalid_data["legend_type"] = "ordinal"
        invalid_data["scale"] = "[10]"  # Invalid for ordinal (needs at least 2)
        serializer = MetricTypeCreateSerializer(data=invalid_data, context=serializer_context)
        self.assertFalse(serializer.is_valid())
        self.assertIn("Ordinal legend type requires at least two scale items.", serializer.errors["non_field_errors"])

        invalid_data = self.request_data.copy()
        invalid_data["legend_type"] = "ordinal"
        invalid_data["scale"] = "[10, 20, 30, 40, 50]"  # Invalid for ordinal (max 4)
        serializer = MetricTypeCreateSerializer(data=invalid_data, context=serializer_context)
        self.assertFalse(serializer.is_valid())
        self.assertIn(
            "Ordinal legend type allows a maximum of four scale items.", serializer.errors["non_field_errors"]
        )


class MetricValueSerializerTestCase(TestCase):
    def test_fields(self):
        serializer = MetricValueSerializer()
        expected_fields = {"id", "metric_type", "org_unit", "year", "value", "string_value"}
        readonly_fields = expected_fields
        self.assertEqual(set(serializer.Meta.fields), expected_fields)
        self.assertEqual(set(serializer.Meta.read_only_fields), readonly_fields)


class ImportMetricValuesSerializerTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="Account")
        cls.user = cls.create_user_with_profile(
            email="john@polio.org",
            username="test",
            first_name="John",
            last_name="Doe",
            account=cls.account,
        )

        cls.request = APIRequestFactory().get("/")
        cls.request.user = cls.user

        cls.mt_1 = MetricType.objects.create(
            account=cls.account,
            code="MT1",
            name="Metric Type 1",
            category="Category 1",
            legend_type="threshold",
            legend_config={"thresholds": [10, 20, 30]},
        )
        cls.mt_2 = MetricType.objects.create(
            account=cls.account,
            code="MT2",
            name="Metric Type 2",
            category="Category 2",
            legend_type="linear",
            legend_config={"thresholds": [5, 15, 25]},
        )

        cls.out_district = OrgUnitType.objects.create(name="DISTRICT")
        cls.district1 = OrgUnit.objects.create(org_unit_type=cls.out_district, name="District 1")
        cls.district2 = OrgUnit.objects.create(org_unit_type=cls.out_district, name="District 2")

    def test_validate_metric_types_all_exist(self):
        csv_content = f"ADM1_NAME,ADM2_NAME,ADM2_ID,MT1\nDISTRICT,District 1,{self.district1.id},1\nDISTRICT,District 2,{self.district2.id},20"
        valid_file = SimpleUploadedFile("test.csv", csv_content.encode(), content_type="text/csv")
        serializer = ImportMetricValuesSerializer(data={"file": valid_file}, context={"request": self.request})
        self.assertTrue(serializer.is_valid())
        self.assertEqual(len(serializer.context["metric_values"]), 2)

    def test_validate_wrong_file_type(self):
        invalid_file = SimpleUploadedFile("test.txt", b"Some text content", content_type="text/plain")
        serializer = ImportMetricValuesSerializer(data={"file": invalid_file}, context={"request": self.request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("The file must be a CSV.", serializer.errors["file"][0])

    def test_validate_metric_types_some_missing(self):
        csv_content = "ADM1_NAME,ADM2_NAME,ADM2_ID,MT3\nCOMOE,DS BANFORA,738,1"
        invalid_file = SimpleUploadedFile("test.csv", csv_content.encode(), content_type="text/csv")
        serializer = ImportMetricValuesSerializer(data={"file": invalid_file}, context={"request": self.request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("The following metric types do not exist: MT3", serializer.errors["file"][0])

    def test_validate_no_metric_type(self):
        csv_content = "ADM1_NAME,ADM2_NAME,ADM2_ID\n"
        invalid_file = SimpleUploadedFile("test.csv", csv_content.encode(), content_type="text/csv")
        serializer = ImportMetricValuesSerializer(data={"file": invalid_file}, context={"request": self.request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("The CSV must contain at least one metric type column.", serializer.errors["file"][0])

    def test_validate_missing_required_headers(self):
        csv_content = "MT1\nCOMOE,738,1"
        invalid_file = SimpleUploadedFile("test.csv", csv_content.encode(), content_type="text/csv")
        serializer = ImportMetricValuesSerializer(data={"file": invalid_file}, context={"request": self.request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("The CSV must contain 'ADM1_NAME, ADM2_NAME, ADM2_ID' columns.", serializer.errors["file"][0])

    def test_validate_no_row(self):
        csv_content = "ADM1_NAME,ADM2_NAME,ADM2_ID,MT2"
        invalid_file = SimpleUploadedFile("test.csv", csv_content.encode(), content_type="text/csv")
        serializer = ImportMetricValuesSerializer(data={"file": invalid_file}, context={"request": self.request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("The CSV must contain at least one value row.", serializer.errors["file"][0])

    def test_validate_missing_org_unit_ids(self):
        csv_content = "ADM1_NAME,ADM2_NAME,ADM2_ID,MT1\nCOMOE,DS BANFORA,9999,1"
        invalid_file = SimpleUploadedFile("test.csv", csv_content.encode(), content_type="text/csv")
        serializer = ImportMetricValuesSerializer(data={"file": invalid_file}, context={"request": self.request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("The following org unit IDs do not exist: 9999", serializer.errors["file"][0])


class OrgUnitIdSerializerTestCase(TestCase):
    def test_to_representation(self):
        serializer = OrgUnitIdSerializer()
        result = serializer.to_representation(42)
        self.assertEqual(result, {"org_unit_id": 42})
