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
        with self.assertRaisesMessage(serializers.ValidationError, "Code must not contain whitespace."):
            serializer.validate_code("invalid code")

    def test_validate_code_same(self):
        metric_type = MetricType(code="same_code")
        serializer = MetricTypeCreateSerializer(
            instance=metric_type, data={"code": "same_code_modified"}, context={"request": self.request}
        )
        self.assertFalse(serializer.is_valid())

    def test_validate_code_new(self):
        data = {
            "code": "new_code",
            "name": "New Metric Type",
            "category": "New Category",
            "legend_type": "threshold",
            "units": "units",
            "unit_symbol": "u",
            "description": "A new metric type",
            "origin": "custom",
        }

        serializer_context = {"request": self.request}
        serializer = MetricTypeCreateSerializer(data=data, context=serializer_context)
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
