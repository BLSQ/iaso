from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.api.common import DropdownOptionsWithRepresentationSerializer
from iaso.api.metrics.filters import ValueAndTypeFilterBackend, ValueFilterBackend
from iaso.models import MetricType, MetricValue
from iaso.utils import legend

from .serializers import MetricTypeSerializer, MetricTypeWriteSerializer, MetricValueSerializer, OrgUnitIdSerializer


# TODO for both viewsets: permission_classes


class MetricTypeViewSet(viewsets.ModelViewSet):
    serializer_class = MetricTypeSerializer
    ordering_fields = ["id", "name"]
    http_method_names = ["get", "options", "post", "put", "delete"]

    def get_queryset(self):
        return MetricType.objects.filter(account=self.request.user.iaso_profile.account, is_utility=False)

    def get_serializer_class(self):
        return (
            MetricTypeSerializer
            if self.action in ["list", "retrieve", "grouped_per_category", "legend_types"]
            else MetricTypeWriteSerializer
        )

    def perform_create(self, serializer):
        metric_type = serializer.save(
            account=self.request.user.iaso_profile.account,
        )
        metric_type.legend_config = legend.get_legend_config(metric_type, self.request.data.get("scale"))
        metric_type.save()

    def perform_destroy(self, instance):
        if instance.origin == MetricType.MetricTypeOrigin.OPENHEXA.value:
            return Response(
                {"detail": "Metric types from OpenHexa cannot be deleted."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().perform_destroy(instance)

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
