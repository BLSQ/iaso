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
        }
        self.assertEqual(set(serializer.Meta.fields), expected_fields)


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
