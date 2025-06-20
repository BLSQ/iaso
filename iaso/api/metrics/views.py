import json

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from iaso.models import MetricType, MetricValue
from iaso.utils.jsonlogic import LOOKUPS, jsonlogic_to_exists_q_clauses, jsonlogic_to_q

from .serializers import MetricTypeSerializer, MetricValueSerializer, OrgUnitIdSerializer


# TODO for both viewsets: permission_classes


class MetricTypeViewSet(viewsets.ModelViewSet):
    serializer_class = MetricTypeSerializer
    ordering_fields = ["id", "name"]
    http_method_names = ["get", "options"]

    def get_queryset(self):
        return MetricType.objects.filter(account=self.request.user.iaso_profile.account)


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
            jsonlogic=json.loads(json_filter), 
            entities=MetricValue.objects, 
            id_field_name="metric_type_id", 
            value_field_name="value", 
            group_by_field_name=group_by_field_name
        )

        qs = queryset.filter(q).values_list(group_by_field_name, flat=True).distinct()
        return qs


class MetricValueViewSet(viewsets.ModelViewSet):
    serializer_class = MetricValueSerializer
    queryset = MetricValue.objects.all()
    filter_backends = [DjangoFilterBackend, ValueFilterBackend]
    filterset_fields = ["metric_type_id", "org_unit_id"]

    def get_queryset(self):
        return MetricValue.objects.filter(metric_type__account=self.request.user.iaso_profile.account)


class MetricOrgUnitsViewSet(viewsets.ModelViewSet):
    """
    This viewset is used to retrieve the org units for a given metric type.
    It is used in the frontend to display the org units for a given metric type.
    """

    serializer_class = OrgUnitIdSerializer
    queryset = MetricValue.objects.all()
    filter_backends = [DjangoFilterBackend, ValueAndTypeFilterBackend]
    filterset_fields = ["metric_type_id"]

    def get_queryset(self):
        return MetricValue.objects.filter(metric_type__account=self.request.user.iaso_profile.account)
