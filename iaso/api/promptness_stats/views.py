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
    PromptnessPeriodSerializer,
    PromptnessStatsQueryParamsSerializer,
    PromptnessStatsRowSerializer,
    PromptnessStatsTotalsSerializer,
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

    def list(self, request: Request, *args, **kwargs) -> Response:
        """Promptness of form submissions, per org unit"""
        params_serializer = PromptnessStatsQueryParamsSerializer(
            data=request.query_params, context={"request": request}
        )
        params_serializer.is_valid(raise_exception=True)
        params = params_serializer.validated_data

        form = params["form"]
        parent_org_unit = params["parent_org_unit"]
        statuses = params["status"]
        period = PromptnessPeriod.build(params["period"], form.promptness_grace_period_days)

        target_org_units = get_target_org_units(form, period)
        totals = get_totals(parent_org_unit, target_org_units)
        rows = get_rows_queryset(parent_org_unit, params.get("org_unit_types"), target_org_units)
        rows = self.filter_queryset(rows)  # ordering

        # Excluded statuses are hidden from the totals and the rows
        output_context = {"status": statuses}

        page = self.paginate_queryset(rows)
        serialized_rows = PromptnessStatsRowSerializer(page, many=True, context=output_context).data
        paginated_response = self.get_paginated_response(serialized_rows)

        return Response(
            {
                "period": PromptnessPeriodSerializer(period).data,
                "totals": PromptnessStatsTotalsSerializer(totals, context=output_context).data,
                **paginated_response.data,
            }
        )

    @action(methods=["GET"], detail=False)
    def export_csv(self, request: Request, *args, **kwargs):
        """Same as `list`, as a CSV file and without pagination"""
        raise NotImplementedError
