from django.db.models import Q
from rest_framework import compat, filters

from iaso.api.common import ChoiceEnum


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
                    description="Filter on deleted items: `all`, `active` (default), or `deleted`."
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
                "description": "Filter on deleted items: `all`, `active` (default), or `deleted`.",
                "schema": {"type": "string", "enum": [c.name for c in ChoiceEnum]},
            }
        ]

    def filter_queryset(self, request, queryset, view):
        # By default, hide deleted records on collection requests (`list`, and custom actions with
        # `detail=False` such as a `count`), but not on a single object, otherwise deleted objects
        # couldn't be seen or restored.
        is_collection = view.action == "list" or getattr(view, "detail", None) is False
        default_filter = "active" if is_collection else "all"
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
