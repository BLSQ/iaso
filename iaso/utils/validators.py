import jsonschema

from django.core.exceptions import ValidationError
from django.core.validators import BaseValidator


class JSONSchemaValidator(BaseValidator):
    def __init__(self, schema, message=None):
        self.schema = schema
        super().__init__(limit_value=None, message=message)

    def __call__(self, value):
        try:
            jsonschema.validate(value, self.schema)
        except jsonschema.ValidationError as e:
            raise ValidationError(e.message) from e
        except jsonschema.exceptions.SchemaError as e:
            raise ValidationError(e.message) from e
