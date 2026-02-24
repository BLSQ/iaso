from django.core.exceptions import ValidationError

from iaso.test import TestCase
from iaso.utils.validators import JSONSchemaValidator


TEST_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string", "minLength": 1},
    },
    "required": ["name"],
    "additionalProperties": False,
}


class JSONSchemaValidatorTestCase(TestCase):
    def setUp(self):
        self.validator = JSONSchemaValidator(TEST_SCHEMA)

    def test_valid_json_payload(self):
        self.validator({"name": "Valid Name"})  # should not raise an exception
        self.assertTrue(True)

    def test_missing_schema(self):
        with self.assertRaisesMessage(ValueError, "A JSON schema must be provided for validation."):
            JSONSchemaValidator(None)

    def test_invalid_schema(self):
        with self.assertRaises(ValidationError) as error:
            self.validator({"not_name": "invalid name"})

        self.assertEqual(error.exception.code, "invalid_json_schema")
        self.assertIn("Provide a valid JSON schema - validation failed: ", str(error.exception))
