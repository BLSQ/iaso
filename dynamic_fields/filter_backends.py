from django.conf import settings
from django.core.exceptions import ValidationError
from rest_framework.filters import BaseFilterBackend

from dynamic_fields.serializer import DynamicFieldsModelSerializerMixin


class DynamicFieldsFilterBackend(BaseFilterBackend):
    """
    The purpose of this filter is just to validate the "fields" query params and make it swagger compliant.
    It doesn't actually filter anything like a classic DRF filter would.
    """

    # for backward compatibility purposes
    string_field = False

    def filter_queryset(self, request, queryset, view):
        values = (
            request.query_params.getlist(settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME)
            if not self.string_field
            else request.query_params.get(settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME, "").split(",")
        )
        values = [v for v in values if v]  # filter out empty
        if not values:
            return queryset

        if (
            settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE in values
            and settings.DYNAMIC_FIELDS_DEFAULT_FIELDS_PARAM_VALUE in values
        ):
            raise ValidationError(
                f"Dynamic fields cannot contain both {settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE} and {settings.DYNAMIC_FIELDS_DEFAULT_FIELDS_PARAM_VALUE}"
            )

        serializer_class = getattr(view, "dynamic_fields_serializer_class", None) or getattr(
            view, "serializer_class", None
        )

        if serializer_class:
            valid = serializer_class.get_valid_options()
            invalid = set(values) - set(valid)
            if invalid:
                raise ValidationError(f"Invalid dynamic fields: {invalid}")

        return queryset

    def get_schema_operation_parameters(self, view):
        serializer_class = view.get_serializer_class()
        if not issubclass(serializer_class, DynamicFieldsModelSerializerMixin):
            return []

        if self.string_field:
            return [
                {
                    "name": settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME,
                    "in": "query",
                    "required": False,
                    "description": (
                        f"Dynamic serializer fields. String of comma separated values. Use '{settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE}' or '{settings.DYNAMIC_FIELDS_DEFAULT_FIELDS_PARAM_VALUE}' or specific field names."
                    ),
                    "schema": {
                        "type": "array",
                        "items": {"type": "string", "enum": serializer_class.get_valid_options()},
                    },
                    "style": "form",
                    "explode": False,
                }
            ]

        return [
            {
                "name": settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME,
                "in": "query",
                "required": False,
                "description": (
                    f"Dynamic serializer fields. Use '{settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE}' or '{settings.DYNAMIC_FIELDS_DEFAULT_FIELDS_PARAM_VALUE}' or specific field names."
                ),
                "schema": {
                    "type": "array",
                    "items": {"type": "string", "enum": serializer_class.get_valid_options()},
                },
                "style": "form",
                "explode": True,
            }
        ]


class DynamicFieldsFilterBackendBackwardCompatible(DynamicFieldsFilterBackend):
    """
    Same as dynamic fields filter , except that the fields parameter is a string with comma separated values
    """

    string_field = True
