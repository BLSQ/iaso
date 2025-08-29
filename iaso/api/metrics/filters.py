import json

from rest_framework import filters

from iaso.models import MetricValue
from iaso.utils.jsonlogic import jsonlogic_to_exists_q_clauses, jsonlogic_to_q


class ValueFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        json_filter = request.query_params.get("json_filter")

        if json_filter:
            q = jsonlogic_to_q(jsonlogic=json.loads(json_filter))
            queryset = queryset.filter(q)

        return queryset


class ValueAndTypeFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        json_filter = request.query_params.get("json_filter")
        group_by_field_name = "org_unit_id"
        if not json_filter:
            return queryset.values(group_by_field_name).distinct().values_list(group_by_field_name, flat=True)

        q = jsonlogic_to_exists_q_clauses(
            json.loads(json_filter), MetricValue.objects, "metric_type_id", group_by_field_name
        )

        qs = queryset.filter(q).values_list(group_by_field_name, flat=True).distinct()
        return qs
