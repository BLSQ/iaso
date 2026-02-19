import jsonschema

from django.core.exceptions import ValidationError
from rest_framework import serializers


class JSONSchemaField(serializers.JSONField):
    def __init__(self, *args, **kwargs):
        self.schema = kwargs.pop("schema", None)
        super().__init__(*args, **kwargs)

    def to_internal_value(self, value):
        data = super().to_internal_value(value)
        try:
            jsonschema.validate(data, self.schema)
        except jsonschema.exceptions.ValidationError as e:
            raise ValidationError(e.message) from e
        except jsonschema.exceptions.SchemaError as e:
            raise ValidationError(e.message) from e
        return data
