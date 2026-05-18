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
