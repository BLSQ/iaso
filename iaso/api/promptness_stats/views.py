from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.request import Request
from rest_framework.response import Response

from iaso.api.common import HasPermission
from iaso.api.promptness_stats.filters import PromptnessStatsOrderingFilter
from iaso.api.promptness_stats.pagination import PromptnessStatsPagination
from iaso.api.promptness_stats.period import PromptnessPeriod
from iaso.api.promptness_stats.queries import annotate_rows, get_rows, get_target_org_units, get_totals
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

# Shared by the endpoints of the viewset: all of them validate the query params with the same serializer
ERROR_RESPONSES = {
    400: OpenApiResponse(
        description=(
            "Invalid query params, with a field-keyed body: a missing or inaccessible form, period or parent org unit, "
            "an inaccessible org unit type, a form without period type or grace period, an invalid period or one "
            "whose type does not match the form period type, an unknown or empty status"
        )
    ),
    401: OpenApiResponse(description="Not authenticated"),
    403: OpenApiResponse(description="Missing the completeness stats or registry permission"),
}


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
    filter_backends = [PromptnessStatsOrderingFilter]
    # Figures: when ordering on them, the not applicable rows always come last (see `PromptnessStatsOrderingFilter`)
    not_applicable_last_fields = [
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
    ordering_fields = ["name", "org_unit_type__name", *not_applicable_last_fields]
    ordering = ["name"]
    # Only used by the browsable API and the schema generation: the actual rows are built in `list()`
    queryset = OrgUnit.objects.none()

    @extend_schema(
        parameters=[PromptnessStatsQueryParamsSerializer],
        responses={
            200: PromptnessStatsRowSerializer(many=True),
            **ERROR_RESPONSES,
            404: OpenApiResponse(description="The page is out of range"),
        },
    )
    def list(self, request: Request, *args, **kwargs) -> Response:
        """Promptness of form submissions, per org unit: the rows of the table"""
        params, target_org_units, _ = self._validate_serializer_and_fetch_target_org_units(request)

        rows = get_rows(params["parent_org_unit"], params.get("org_unit_types"))
        # The rows are counted before being annotated to avoid higher count() costs
        rows_count = rows.count()
        annotated_rows = annotate_rows(rows, params["parent_org_unit"], target_org_units)
        annotated_rows = self.filter_queryset(annotated_rows)  # ordering
        page = self.paginator.paginate_queryset(annotated_rows, request, view=self, count=rows_count)

        # Excluded statuses are hidden from the rows
        serialized_rows = PromptnessStatsRowSerializer(page, many=True, context={"status": params["status"]}).data
        return self.get_paginated_response(serialized_rows)

    @extend_schema(
        parameters=[PromptnessStatsQueryParamsSerializer],
        responses={200: PromptnessStatsSummarySerializer, **ERROR_RESPONSES},
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
