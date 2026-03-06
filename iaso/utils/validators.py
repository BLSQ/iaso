import jsonschema

from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible


@deconstructible
class JSONSchemaValidator:
    message = "Provide a valid JSON schema - validation failed: %(error)s"
    code = "invalid_json_schema"

    def __init__(self, schema, message=None, code=None):
        if schema is None:
            raise ValueError("A JSON schema must be provided for validation.")
        self.schema = schema

        if message is not None:
            self.message = message
        if code is not None:
            self.code = code

    def __call__(self, value):
        try:
            jsonschema.validate(value, self.schema)
        except jsonschema.ValidationError as e:
            raise ValidationError(self.message, code=self.code, params={"error": e.message}) from e

    def __eq__(self, other):
        return (
            isinstance(other, self.__class__)
            and self.schema == other.schema
            and self.message == other.message
            and self.code == other.code
        )
