from drf_spectacular.utils import extend_schema
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.request import Request
from rest_framework.response import Response

from iaso.api.common import HasPermission
from iaso.api.promptness_stats.pagination import PromptnessStatsPagination
from iaso.api.promptness_stats.period import PromptnessPeriod
from iaso.api.promptness_stats.queries import get_rows_queryset, get_target_org_units, get_totals
from iaso.api.promptness_stats.serializers import (
    PromptnessStatsQueryParamsSerializer,
    PromptnessStatsRowSerializer,
    PromptnessStatsSummarySerializer,
)
from iaso.models import OrgUnit
from iaso.permissions.core_permissions import (
    CORE_COMPLETENESS_STATS_PERMISSION,
    CORE_REGISTRY_READ_PERMISSION,
    CORE_REGISTRY_WRITE_PERMISSION,
)


CSV_FILENAME_TEMPLATE = "promptness_{form_id}_{period}.csv"


@extend_schema(tags=["Promptness statistics"])
class PromptnessStatsViewSet(viewsets.GenericViewSet):
    """Promptness Stats API: see docs/pages/dev/reference/API/promptness_stats.en.md"""

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(
            CORE_COMPLETENESS_STATS_PERMISSION, CORE_REGISTRY_WRITE_PERMISSION, CORE_REGISTRY_READ_PERMISSION
        ),  # type: ignore
    ]
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]
    serializer_class = PromptnessStatsQueryParamsSerializer
    pagination_class = PromptnessStatsPagination
    filter_backends = [OrderingFilter]
    ordering_fields = [
        "name",
        "org_unit_type__name",
        "expected",
        "received",
        "completeness_percent",
        "on_time",
        "on_time_percent",
        "late",
        "late_percent",
        "missing",
        "missing_percent",
    ]
    ordering = ["name"]
    # Only used by the browsable API and the schema generation: the actual rows are built in `list()`
    queryset = OrgUnit.objects.none()

    @extend_schema(
        parameters=[PromptnessStatsQueryParamsSerializer],
        responses=PromptnessStatsRowSerializer(many=True),
    )
    def list(self, request: Request, *args, **kwargs) -> Response:
        """Promptness of form submissions, per org unit: the rows of the table"""
        params, target_org_units, _ = self._validate_serializer_and_fetch_target_org_units(request)

        rows = get_rows_queryset(params["parent_org_unit"], params.get("org_unit_types"), target_org_units)
        rows = self.filter_queryset(rows)  # ordering
        page = self.paginate_queryset(rows)

        # Excluded statuses are hidden from the rows
        serialized_rows = PromptnessStatsRowSerializer(page, many=True, context={"status": params["status"]}).data
        return self.get_paginated_response(serialized_rows)

    @extend_schema(
        parameters=[PromptnessStatsQueryParamsSerializer],
        responses=PromptnessStatsSummarySerializer,
    )
    @action(methods=["GET"], detail=False)
    def summary(self, request: Request, *args, **kwargs) -> Response:
        """Period and totals for the parent org unit. They don't depend on the ordering or the page of the rows."""
        params, target_org_units, period = self._validate_serializer_and_fetch_target_org_units(request)

        totals = get_totals(params["parent_org_unit"], target_org_units)

        # Excluded statuses are hidden from the totals
        summary_serializer = PromptnessStatsSummarySerializer(
            {"period": period, "totals": totals}, context={"status": params["status"]}
        )
        return Response(summary_serializer.data)

    def _validate_serializer_and_fetch_target_org_units(self, request: Request):
        params_serializer = self.get_serializer(data=request.query_params)
        params_serializer.is_valid(raise_exception=True)
        params = params_serializer.validated_data

        form = params["form"]
        period = PromptnessPeriod.build(params["period"], form.promptness_grace_period_days)

        target_org_units = get_target_org_units(form, period)
        return params, target_org_units, period

    @extend_schema(parameters=[PromptnessStatsQueryParamsSerializer])
    @action(methods=["GET"], detail=False)
    def export_csv(self, request: Request, *args, **kwargs):
        """Same as `list`, as a CSV file and without pagination"""
        raise NotImplementedError
