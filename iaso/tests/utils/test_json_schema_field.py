from rest_framework import serializers
from rest_framework.settings import api_settings

from iaso.api.common.serializer_fields import JSONSchemaField
from iaso.test import TestCase


TEST_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string", "minLength": 1},
    },
    "required": ["name"],
    "additionalProperties": False,
}


class TestSerializer(serializers.Serializer):
    data = JSONSchemaField(TEST_SCHEMA)


class JSONSchemaFieldTestCase(TestCase):
    def test_valid_json_payload(self):
        serializer = TestSerializer(data={"data": {"name": "valid name"}})
        self.assertTrue(serializer.is_valid())

    def test_missing_schema(self):
        with self.assertRaisesMessage(ValueError, "A JSON schema must be provided for validation."):
            JSONSchemaField(None)

    def test_invalid_schema_provided(self):
        for invalid_schema in [
            {"type": "not-a-real-type"},
            {"type": ["string", 123]},
        ]:
            with self.subTest(schema=invalid_schema):
                with self.assertRaises(ValueError) as ve:
                    JSONSchemaField(invalid_schema)
                self.assertIn("Invalid JSON Schema", str(ve.exception))

    def test_null_not_allowed(self):
        serializer = TestSerializer(data=None)
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors[api_settings.NON_FIELD_ERRORS_KEY][0].code, "null")
        self.assertEqual(serializer.errors[api_settings.NON_FIELD_ERRORS_KEY][0], "No data provided")

    def test_blank_not_allowed(self):
        serializer = TestSerializer(data="")
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors[api_settings.NON_FIELD_ERRORS_KEY][0].code, "invalid")
        self.assertEqual(
            serializer.errors[api_settings.NON_FIELD_ERRORS_KEY][0], "Invalid data. Expected a dictionary, but got str."
        )

    def test_invalid_schema(self):
        serializer = TestSerializer(data={"data": {"not_name": "invalid name"}})
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["data"][0].code, "schema_validation_error")
        self.assertEqual(serializer.errors["data"][0], "Invalid data for schema: 'name' is a required property")

        serializer = TestSerializer(data={"data": {"name": ""}})
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["data"][0].code, "schema_validation_error")
        self.assertEqual(serializer.errors["data"][0], "Invalid data for schema: '' is too short")

        serializer = TestSerializer(data={"data": {"name": "valid name", "extra": "not allowed"}})
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["data"][0].code, "schema_validation_error")
        self.assertEqual(
            serializer.errors["data"][0],
            "Invalid data for schema: Additional properties are not allowed ('extra' was unexpected)",
        )

        serializer = TestSerializer(data={"data": "not an object"})  # should be an object, not a string
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["data"][0].code, "schema_validation_error")
        self.assertEqual(
            serializer.errors["data"][0], "Invalid data for schema: 'not an object' is not of type 'object'"
        )
