import jsonschema

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class JSONSchemaFieldValidator:
    message = _("Invalid data for schema: %(error)s")
    code = "schema_validation_error"

    def __init__(self, schema, message=None, code=None):
        if not schema:
            raise ValueError("A JSON schema must be provided for validation.")
        try:
            self.schema_validator = jsonschema.validators.validator_for(schema)
            self.schema_validator.check_schema(schema)
            self.schema_validator = self.schema_validator(schema)
        except jsonschema.exceptions.SchemaError as e:
            raise ValueError(f"Invalid JSON Schema: {e.message}")

        if message:
            self.message = message
        if code:
            self.code = code

    def __call__(self, value):
        if value is None or value == "":
            return

        try:
            self.schema_validator.validate(value)
        except jsonschema.exceptions.ValidationError as e:
            raise ValidationError(self.message, code=self.code, params={"error": e.message})
