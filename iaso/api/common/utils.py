import logging

from functools import wraps
from traceback import format_exc

from django.db import transaction
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from hat.api_import.models import APIImport
from iaso.api.common import REQUEST_HEADER_INFO_KEYS


logger = logging.getLogger(__name__)


def safe_api_import(key: str, fallback_status=200):
    """This decorator allows to mark api views as "safe imports". This has two effects:

    1. The view will always return a 200 OK status, even if there was an exception while executing it
    2. The posted data will be saved in a APIImport record
    """

    def decorator(f):
        @wraps(f)
        def inner(self, request, *args, **kwargs):
            # First, store the data in a APIImport record
            api_import = APIImport()
            if not request.user.is_anonymous:
                api_import.user = request.user
            api_import.import_type = key
            api_import.headers = {
                request_key: request.META.get(request_key) for request_key in REQUEST_HEADER_INFO_KEYS
            }
            api_import.json_body = request.data

            # Run the view in a try/except
            try:
                with transaction.atomic():
                    response = f(self, api_import, request, *args, **kwargs)
            except Exception as e:
                logger.exception("Exception" + str(e))  # For logs
                api_import.has_problem = True
                api_import.exception = format_exc()
                response = Response({"res": "a problem happened, but your data was saved"}, status=fallback_status)

            # Save the APIImport record
            api_import.save()

            return response

        return inner

    return decorator


def parse_comma_separated_numeric_values(value: str, field_name: str) -> list:
    """
    Parses a comma-separated string of numeric values and returns a list of integers.
    Raises a ValidationError if the input is not valid.
    """
    ids = [val for val in value.split(",") if val.isnumeric()]
    if not ids:
        raise ValidationError({field_name: ["Invalid value."]})
    return [int(val) for val in ids]


def is_field_referenced(field_name, requested_fields, order):
    """
    Checks if a field is needed for the response, either because it was
    explicitly requested or because it's being used for sorting.
    if no fields specified... do as if all fields are requested
    """
    if not requested_fields:
        return True

    fields_list = requested_fields.split(",")
    return ":all" in fields_list or field_name in fields_list or field_name in order or f"-{field_name}" in order
