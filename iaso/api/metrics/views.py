import json
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets


from iaso.models import MetricType, MetricValue
from iaso.utils.jsonlogic import jsonlogic_to_q
from .serializers import MetricTypeSerializer, MetricValueSerializer

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


class MetricValueViewSet(viewsets.ModelViewSet):
    serializer_class = MetricValueSerializer
    queryset = MetricValue.objects.all()
    filter_backends = [DjangoFilterBackend, ValueFilterBackend]
    filterset_fields = ["metric_type_id", "org_unit_id"]

    def get_queryset(self):
        return MetricValue.objects.filter(metric_type__account=self.request.user.iaso_profile.account)
