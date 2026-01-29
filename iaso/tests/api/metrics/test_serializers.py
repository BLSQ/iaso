from rest_framework import serializers
from rest_framework.test import APIRequestFactory

from iaso.api.metrics.serializers import (
    MetricTypeCreateSerializer,
    MetricTypeSerializer,
    MetricTypeWriteSerializer,
    MetricValueSerializer,
    OrgUnitIdSerializer,
)
from iaso.models.base import Account
from iaso.models.metric import MetricType
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


class OrgUnitIdSerializerTestCase(TestCase):
    def test_to_representation(self):
        serializer = OrgUnitIdSerializer()
        result = serializer.to_representation(42)
        self.assertEqual(result, {"org_unit_id": 42})
