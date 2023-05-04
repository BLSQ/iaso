import enum
import logging
from datetime import datetime, date
from functools import wraps
from traceback import format_exc
from django.http import HttpResponse
from rest_framework.decorators import action
from rest_framework_csv.renderers import CSVRenderer


import pytz
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import ProtectedError, Q
from django.utils.timezone import make_aware
from rest_framework import serializers, pagination, exceptions, permissions, filters, compat
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

CONTENT_TYPE_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
CONTENT_TYPE_CSV = "text/csv"

EXPORTS_DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S"


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name", "username"]


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


# Typing: it seems quite hard to type this, so I'm not doing it for now. Use "type: ignore" comment to silence mypy
class HasPermission:
    """
    Permission class factory for simple permission checks.

    If the user has any of the provided permissions, he will be granted access

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

    def __call__(self, *args, **kwargs) -> permissions.BasePermission:
        return self._permission_class()


class ReadOnlyOrHasPermission:
    """
    Permission class factory for simple permission checks.

    Grant read only access to all and need permission to edit

    Usage:

    > class SomeViewSet(viewsets.ViewSet):
    >     permission_classes=[HasPermission("perm_1", "perm_2)]
    >     ...
    """

    def __init__(self, *perms):
        class PermissionClass(permissions.BasePermission):
            def has_permission(self, request, view):
                if request.method in permissions.SAFE_METHODS:
                    return True

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


class DateTimestampField(serializers.Field):
    """Represent a date as a timestampfield

    Use only for mobile APIs"""

    def to_representation(self, value: date):
        return datetime(value.year, value.month, value.day, 0, 0, 0, tzinfo=pytz.utc).timestamp()

    def to_internal_value(self, data: float):
        return make_aware(datetime.utcfromtimestamp(data)).date()


class Paginator(pagination.PageNumberPagination):
    page_size_query_param = "limit"

    def __init__(self, results_key="results"):
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
    results_key = "results"
    # FIXME Contrary to name it remove result key if NOT paginated
    remove_results_key_if_paginated = False

    def pagination_class(self):
        return Paginator(self.get_results_key())

    def get_results_key(self):
        """
        Get the key to use for results in list responses (resource-specific)

        Example: if your resource is CarManufacturer, use "car_manufacturers", so that the list responses look like
        {
            "car_manufacturers": [
                {"id": 1, name  : "Honda"},
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
        # """Override to return responses with {"result_key": data} structure"""

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


class ChoiceEnum(enum.Enum):
    active = "active"
    all = "all"
    deleted = "deleted"


class DeletionFilterBackend(filters.BaseFilterBackend):
    def get_schema_fields(self, view):
        # Used to generate the swagger / browsable api
        return [
            compat.coreapi.Field(
                name="deletion_status",
                required=False,
                location="query",
                # schema=compat.coreschema.Enum(enum=ChoiceEnum),
                schema=compat.coreschema.String(
                    description="Filter on deleted item: all|active|deleted. Default:active"
                ),
            )
        ]

    def get_schema_operation_parameters(self, view):
        # Used to generate the swagger / browsable api
        return [
            {
                "name": "deletion_status",
                "required": False,
                "in": "query",
                "description": "Filter on deleted item: all|active|deleted. Default:active",
                "schema": {"type": "string", "enum": [c.name for c in ChoiceEnum]},
            }
        ]

    def filter_queryset(self, request, queryset, view):
        # by default in list view filter deleted record
        # but don't outside of list view
        # otherwise we can't access, and undelete deleted object
        default_filter = "active" if view.action == "list" else "all"
        query_param = request.query_params.get("deletion_status", default_filter)

        if query_param == "deleted":
            query = Q(deleted_at__isnull=False)
            return queryset.filter(query)

        if query_param == "active":
            query = Q(deleted_at__isnull=True)
            return queryset.filter(query)

        if query_param == "all":
            return queryset
        return queryset


class FileFormatEnum(enum.Enum):
    CSV: str = "csv"
    XLSX: str = "xlsx"


# To sort timestamp by date, check mobile_orgunits for usage
def get_timestamp(d):
    return float(d["created_at"])


class CSVExportMixin:
    @action(
        detail=False,
        methods=["GET"],
    )
    def export_csv(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer_class = self.exporter_serializer_class
        serializer = serializer_class(queryset, many=True, context=self.get_serializer_context())
        data = serializer.data
        renderer = CSVRenderer()
        # Determine the order of fields
        if self.use_field_order:
            renderer.header = serializer.child.fields
        # Get column names
        if hasattr(serializer_class.Meta, "labels"):
            renderer.labels = serializer_class.Meta.labels

        date = datetime.now().strftime("%Y-%m-%d")
        filename = self.export_filename.format(date=date)
        response = HttpResponse(
            content_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
            content=renderer.render(data),
        )
        return response
