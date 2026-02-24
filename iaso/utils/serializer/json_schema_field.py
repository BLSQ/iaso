import jsonschema

from django.core.exceptions import ValidationError
from rest_framework import serializers


class JSONSchemaField(serializers.JSONField):
    def __init__(self, schema, *args, **kwargs):
        if not schema:
            raise ValueError("A JSON schema must be provided for validation.")
        self.schema = schema

        super().__init__(*args, **kwargs)

    def to_internal_value(self, value):
        data = super().to_internal_value(value)
        try:
            jsonschema.validate(data, self.schema)
        except jsonschema.ValidationError as e:
            raise ValidationError(e.message) from e

        return data
