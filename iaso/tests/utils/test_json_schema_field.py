from rest_framework import serializers

from iaso.test import TestCase
from iaso.utils.serializer.json_schema_field import JSONSchemaField


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

    def test_invalid_schema(self):
        serializer = TestSerializer(data={"data": {"not_name": "invalid name"}})
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["data"][0], "'name' is a required property")

        serializer = TestSerializer(data={"data": {"name": ""}})
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["data"][0], "'' is too short")

        serializer = TestSerializer(data={"data": {"name": "valid name", "extra": "not allowed"}})
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["data"][0], "Additional properties are not allowed ('extra' was unexpected)")

        serializer = TestSerializer(data={"data": "not an object"})  # should be an object, not a string
        self.assertFalse(serializer.is_valid())
        self.assertEqual(serializer.errors["data"][0], "'not an object' is not of type 'object'")
