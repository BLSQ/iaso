import logging
from datetime import datetime
from functools import wraps
from traceback import format_exc

from django.db import transaction
from django.db.models import ProtectedError
from django.utils.timezone import make_aware
from rest_framework import serializers, pagination, exceptions, permissions
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet as BaseModelViewSet

from hat.vector_control.models import APIImport

logger = logging.getLogger(__name__)

REQUEST_HEADER_INFO_KEYS = [
    "HTTP_COOKIE",
    "PATH_INFO",
    "REMOTE_ADDR",
    "REQUEST_METHOD",
    "SCRIPT_NAME",
    "SERVER_NAME",
    "SERVER_PORT",
    "SERVER_PROTOCOL",
    "CONTENT_LENGTH",
    "CONTENT_TYPE",
    "QUERY_STRING",
    "HTTP_AUTHORIZATION",
]


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
                logger.error("Exception" + str(e))  # For logs
                api_import.has_problem = True
                api_import.exception = format_exc()
                response = Response({"res": "a problem happened, but your data was saved"}, status=fallback_status)

            # Save the APIImport record
            api_import.save()

            return response

        return inner

    return decorator


class HasPermission:
    """
    Permission class factory for simple permission checks.

    If the user has any of the the provided permissions, he will be granted access

    Usage:

    > class SomeViewSet(viewsets.ViewSet):
    >     permission_classes=[HasPermission("perm_1", "perm_2)]
    >     ...
    """

    def __init__(self, *perms):
        class PermissionClass(permissions.BasePermission):
            def has_permission(self, request, view):
                return request.user and any(request.user.has_perm(perm) for perm in perms)

        self._permission_class = PermissionClass

    def __call__(self, *args, **kwargs):
        return self._permission_class()


class DynamicFieldsModelSerializer(serializers.ModelSerializer):
    """A ModelSerializer that
    - inspects the request to check if a specific field set has been requested through the "fields" query param
    - accepts an additional optional `fields` constructor argument that allows to specify which
      fields should be included if the request does not contain the "fields" query param

    Note that the request query param will always take precedence over the constructor argument.

    This field query param or constructor argument can be either a comma-separated list of field names,
    or the :all or :default keywords.

    When implementing this serializer class, you can define a "default_fields" attribute on your inner Meta
    class. This represents the default set of fields that will be returned. If you don't define this attribute,
    the standard "fields" attribute will be used instead.

    As an example, consider a viewset using the following serializer:

    class DinosaurSerializer(DynamicFieldsModelSerializer)
        class Meta:
            model = OrgUnitType
            fields = ["id", "name", "related_species"]
            default_fields = ["id", "name"]

    1. If the request does not contain the "field" query param, "id" and "name" will e returned.
    2. If the request has a "field" query param equals to "id", only the id will be returned
    3. If the request has a "field" query param equals to "id,name,related_species", all the fields will be returned
    4. If this serializer is manually instantiated in a piece of code with the ":all" keyword, and the request
       does not contain a "field" query param, then all fields will be returned as well.
    """

    def __init__(self, *args, **kwargs):
        # Don't pass the 'fields' arg up to the superclass
        requested_fields = kwargs["context"]["request"].query_params.get("fields", kwargs.pop("fields", ":default"))
        if requested_fields == ":all":
            fields = self.Meta.fields
        elif requested_fields == ":default":
            fields = self.Meta.default_fields if hasattr(self.Meta, "default_fields") else self.Meta.fields
        else:
            # fields could be a string (query param) or a list (constructor argument)
            fields = requested_fields.split(",") if isinstance(requested_fields, str) else requested_fields
            for field in fields:
                if field not in self.Meta.fields:
                    raise serializers.ValidationError(
                        {"fields": "field unknown '" + field + "', known fields :" + ", ".join(self.Meta.fields)}
                    )

        # Instantiate the superclass normally
        super().__init__(*args, **kwargs)

        # Drop any fields that are not specified in the `fields` argument.
        allowed = set(fields)
        existing = set(self.fields)
        for field_name in existing - allowed:
            self.fields.pop(field_name)


class TimestampField(serializers.Field):
    def to_representation(self, value: datetime):
        return value.timestamp()

    def to_internal_value(self, data: float):
        return make_aware(datetime.utcfromtimestamp(data))


class Paginator(pagination.PageNumberPagination):
    page_size_query_param = "limit"

    def __init__(self, results_key):
        self.results_key = results_key

    def get_paginated_response(self, data):
        return Response(
            {
                "count": self.page.paginator.count,
                self.results_key: data,
                "has_next": self.page.has_next(),
                "has_previous": self.page.has_previous(),
                "page": self.page.number,
                "pages": self.page.paginator.num_pages,
                "limit": self.page.paginator.per_page,
            }
        )


class ModelViewSet(BaseModelViewSet):
    results_key = None
    remove_results_key_if_paginated = False

    def pagination_class(self):
        return Paginator(self.get_results_key())

    def get_results_key(self):
        """
        Get the key to use for results in list responses (resource-specific)

        Example: if your resource is CarManufacturer, use "car_manufacturers", so that the list responses look like
        {
            "car_manufacturers": [
                {"id": 1, name: "Honda"},
                {"id": 2, name: "Toyota"},
            ]
        }
        """
        assert self.results_key is not None, (
            "'%s' should either include a `results_key` attribute, "
            "or override the `get_result_key()` method." % self.__class__.__name__
        )

        return self.results_key

    def list(self, request: Request, *args, **kwargs):
        """Override to return responses with {"result_key": data} structure"""

        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        if not self.remove_results_key_if_paginated:
            return Response({self.get_results_key(): serializer.data})
        else:
            return Response(serializer.data)

    def perform_destroy(self, instance):
        """Handle ProtectedError (prevent deletion of instances when linked to protected models)"""

        try:
            super().perform_destroy(instance)
        except ProtectedError as e:
            instance_model_name = instance.__class__.__name__
            linked_model_name = e.protected_objects.model.__name__

            raise exceptions.MethodNotAllowed(
                self.request.method,
                f"Cannot delete {instance_model_name} as it is linked to one or more {linked_model_name}s",
            )
