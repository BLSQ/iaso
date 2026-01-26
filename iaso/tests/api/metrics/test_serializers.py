from django.contrib.auth import get_user_model

from iaso.api.metrics.serializers import (
    MetricTypeSerializer,
    MetricTypeWriteSerializer,
    MetricValueSerializer,
    OrgUnitIdSerializer,
)
from iaso.models.base import Account
from iaso.models.metric import MetricType
from iaso.permissions.core_permissions import CORE_ORG_UNITS_PERMISSION
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
        serializer = MetricTypeWriteSerializer()
        with self.assertRaisesMessage(Exception, "Code must not contain whitespace."):
            serializer.validate_code("invalid code")

    def test_validate_code_immutable(self):
        metric_type = MetricType(code="original_code")
        serializer = MetricTypeWriteSerializer(instance=metric_type, data={"code": "new_code"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("codeImmutable", serializer.errors["code"][0])

    def test_validate_code_same(self):
        metric_type = MetricType(code="same_code")
        account = Account.objects.create(name="Account")
        user = self.create_user_with_profile(
            username="jane_doe",
            last_name="Doe",
            first_name="Jane",
            account=account,
            permissions=[CORE_ORG_UNITS_PERMISSION],
        )
        serializer_context = {"request": type("Request", (), {"user": user})()}
        serializer = MetricTypeWriteSerializer(
            instance=metric_type, data={"code": "same_code_modified"}, context=serializer_context
        )
        is_valid = serializer.is_valid()
        self.assertFalse(is_valid)

    def test_validate_code_new(self):
        account = Account.objects.create(name="Account")
        user = self.create_user_with_profile(
            username="alice_smith",
            last_name="Smith",
            first_name="Alice",
            account=account,
            permissions=[CORE_ORG_UNITS_PERMISSION],
        )

        data = {
            "code": "new_code",
            "name": "New Metric Type",
            "category": "New Category",
            "legend_type": "Threshold",
            "units": "units",
            "unit_symbol": "u",
            "description": "A new metric type",
            "origin": "CUSTOM",
        }

        serializer_context = {"request": type("Request", (), {"user": user})()}
        serializer = MetricTypeWriteSerializer(data=data, context=serializer_context)
        is_valid = serializer.is_valid()
        self.assertTrue(is_valid)


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
