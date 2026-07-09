from drf_spectacular.openapi import AutoSchema
from drf_spectacular.plumbing import is_list_serializer


class AutoSchemaWithMinItems(AutoSchema):
    def _map_serializer_field(self, field, direction, bypass_extensions=False):
        print("'inde")
        schema = super()._map_serializer_field(field, direction, bypass_extensions)

        if schema and is_list_serializer(field) and not field.allow_empty and schema.get("type") == "array":
            schema.setdefault("minItems", 1)

        return schema
