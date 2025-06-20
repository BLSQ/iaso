import json
import operator

from django.db.models import Exists, OuterRef, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from iaso.models import MetricType, MetricValue
from iaso.utils.jsonlogic import LOOKUPS, annotation_jsonlogic_to_q, jsonlogic_to_q

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

        if not json_filter:
            return queryset.values("org_unit_id").distinct().values_list("org_unit_id", flat=True)

        annotations, filters = annotation_jsonlogic_to_q(json.loads(json_filter), "metric_type", "value")
        print(queryset.values("org_unit_id").annotate(**annotations).filter(filters).query)
        print(queryset.values("org_unit_id").annotate(**annotations).filter(filters).count())

        filteredOrgUnitIds = (
            queryset.values("org_unit_id").annotate(**annotations).filter(filters).values_list("org_unit_id", flat=True)
        )

        print("%" * 20)

        q = self._jsonlogic_to_exists_q_clauses(jsonlogic=json.loads(json_filter))
        qs = queryset.filter(q).values("org_unit_id").distinct()
        print(qs.query)
        print(qs.count())

        print("EQUALS", sorted(list(filteredOrgUnitIds)) == sorted(list(qs.values_list("org_unit_id", flat=True))))

        # rows = queryset.filter(org_unit_id__in=filteredOrgUnitIds)
        return filteredOrgUnitIds

    def _jsonlogic_to_exists_q_clauses(self, jsonlogic):
        if "and" in jsonlogic:
            sub_query = Q()
            for lookup in jsonlogic["and"]:
                sub_query = operator.and_(sub_query, self._jsonlogic_to_exists_q_clauses(lookup))
            return sub_query
        if "or" in jsonlogic:
            sub_query = Q()
            for lookup in jsonlogic["or"]:
                sub_query = operator.or_(sub_query, self._jsonlogic_to_exists_q_clauses(lookup))
            return sub_query
        if "!" in jsonlogic:
            return ~self._jsonlogic_to_exists_q_clauses(jsonlogic["!"])

        if not jsonlogic.keys():
            return Q()

        op = list(jsonlogic.keys())[0]
        params = jsonlogic[op]

        field_position = 1 if op == "in" else 0
        field = params[field_position]
        value = params[0] if op == "in" else params[1]

        q = Q(
            Exists(
                MetricValue.objects.filter(
                    org_unit_id=OuterRef("org_unit_id"),
                    metric_type_id=field["var"],
                ).filter(Q(**{f"value__{LOOKUPS[op]}": value}))
            )
        )

        if op == "!=":
            # invert the filter
            q = ~q
        return q


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
