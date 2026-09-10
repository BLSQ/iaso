import csv

from datetime import datetime

from django.db.models import Q
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response

from iaso.api.common import CONTENT_TYPE_CSV, DropdownOptionsWithRepresentationSerializer
from iaso.api.metrics.filters import MetricValueFilter, ValueAndTypeFilterBackend, ValueFilterBackend
from iaso.api.metrics.utils import REQUIRED_METRIC_VALUES_HEADERS, get_org_unit_row
from iaso.models import MetricType, MetricValue
from iaso.plugins import is_snt_malaria_plugin_active
from iaso.utils.org_units import get_valid_org_units_with_geography

from .permissions import MetricsPermissions
from .serializers import (
    ExportMetricValuesSerializer,
    ImportMetricValuesSerializer,
    MetricTypeCreateSerializer,
    MetricTypeSerializer,
    MetricTypeWriteSerializer,
    MetricValueSerializer,
    OrgUnitIdSerializer,
)


@extend_schema(tags=["Metric types"])
class MetricTypeViewSet(viewsets.ModelViewSet):
    serializer_class = MetricTypeSerializer
    ordering_fields = ["id", "name"]
    http_method_names = ["get", "options", "post", "patch", "delete"]
    permission_classes = [MetricsPermissions]

    def get_queryset(self):
        queryset = MetricType.objects.filter(account=self.request.user.iaso_profile.account)
        include_utility = self.request.query_params.get("include_utility", "false").lower() == "true"
        if not include_utility:
            queryset = queryset.filter(is_utility=False)

        metric_kind = self.request.query_params.get("metric_kind")
        if metric_kind:
            queryset = queryset.filter(metric_kind=metric_kind)
        return queryset

    def get_serializer_class(self):
        return (
            MetricTypeCreateSerializer
            if self.action == "create"
            else MetricTypeWriteSerializer
            if self.action in ["update", "partial_update"]
            else MetricTypeSerializer
        )

    @action(detail=False, methods=["get"])
    def grouped_per_category(self, request):
        metric_types = self.get_queryset()
        grouped_data = {}
        for mt in metric_types:
            category = mt.category or "Uncategorized"
            if category not in grouped_data:
                grouped_data[category] = []
            grouped_data[category].append(MetricTypeSerializer(mt).data)

        response_data = [{"name": key, "items": items} for key, items in grouped_data.items()]

        return Response(response_data)

    @action(
        detail=False,
        methods=["get"],
    )
    def legend_types(self, _):
        serializer = DropdownOptionsWithRepresentationSerializer(
            MetricType.LegendType.choices,
            many=True,
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=["Metric values"])
class MetricValueViewSet(viewsets.ModelViewSet):
    serializer_class = MetricValueSerializer
    queryset = MetricValue.objects.all()
    filter_backends = [DjangoFilterBackend, ValueFilterBackend]
    filterset_class = MetricValueFilter
    http_method_names = ["get", "options", "post"]
    permission_classes = [MetricsPermissions]

    def get_queryset(self):
        qs = MetricValue.objects.filter(metric_type__account=self.request.user.iaso_profile.account)
        reference_year = self.request.query_params.get("reference_year")
        if reference_year is not None:
            try:
                qs = qs.filter(Q(year=int(reference_year)) | Q(year__isnull=True))
            except ValueError:
                pass
        return qs

    @action(detail=False, methods=["get"])
    def csv_template(self, request):
        account = request.user.iaso_profile.account
        # Get all custom metric types for the user's account
        metric_types = MetricType.objects.filter(account=account, origin=MetricType.MetricTypeOrigin.CUSTOM)
        if is_snt_malaria_plugin_active():
            # Composite metric types are computed from a graph, not meant to be filled in manually.
            metric_types = metric_types.filter(composite_layer__isnull=True)
        # Get All org units for the user's account
        org_units = get_valid_org_units_with_geography(account).select_related("parent").order_by("name")

        # Prepare the CSV response
        headers = REQUIRED_METRIC_VALUES_HEADERS.copy()
        for mt in metric_types:
            headers.append(f"{mt.code}")
        response = HttpResponse(content_type=CONTENT_TYPE_CSV)
        writer = csv.writer(response, delimiter=",")
        writer.writerow(headers)
        for ou in org_units:
            row = get_org_unit_row(ou)
            for mt in metric_types:
                row.append("")  # Empty value for the metric
            writer.writerow(row)

        filename = "metric_import_template.csv"
        response["Content-Disposition"] = f"attachment; filename={filename}"
        return response

    @action(
        detail=False,
        methods=["get"],
        serializer_class=ExportMetricValuesSerializer,
        renderer_classes=[JSONRenderer],
    )
    def export_csv(self, request):
        serializer = self.get_serializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        headers, rows = serializer.get_csv_rows()

        response = HttpResponse(content_type=CONTENT_TYPE_CSV)
        writer = csv.writer(response, delimiter=",")
        writer.writerow(headers)
        writer.writerows(rows)

        filename = f"metric_values_export_{datetime.now().strftime('%Y-%m-%d')}.csv"

        response["Content-Disposition"] = f"attachment; filename={filename}"
        return response

    @action(detail=False, methods=["post"], serializer_class=ImportMetricValuesSerializer)
    def import_from_csv(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        metric_values = serializer.save()

        return Response(
            {
                "total_imported": len(metric_values),
                "metric_type_import_count": len(metric_values),
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Metrics", "Org units"])
class MetricOrgUnitsViewSet(viewsets.ModelViewSet):
    """
    This viewset is used to retrieve the org units for a given metric type.
    It is used in the frontend to display the org units for a given metric type.
    """

    serializer_class = OrgUnitIdSerializer
    queryset = MetricValue.objects.all()
    filter_backends = [DjangoFilterBackend, ValueAndTypeFilterBackend]
    filterset_fields = ["metric_type_id"]
    http_method_names = ["get", "options"]
    permission_classes = [MetricsPermissions]

    def get_queryset(self):
        return MetricValue.objects.filter(metric_type__account=self.request.user.iaso_profile.account)
