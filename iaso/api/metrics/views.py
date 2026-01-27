from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.api.metrics.filters import ValueAndTypeFilterBackend, ValueFilterBackend
from iaso.models import MetricType, MetricValue

from .serializers import MetricTypeSerializer, MetricValueSerializer, OrgUnitIdSerializer


# TODO for both viewsets: permission_classes


class MetricTypeViewSet(viewsets.ModelViewSet):
    serializer_class = MetricTypeSerializer
    ordering_fields = ["id", "name"]
    http_method_names = ["get", "options"]

    def get_queryset(self):
        return MetricType.objects.filter(account=self.request.user.iaso_profile.account, is_utility=False)

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
