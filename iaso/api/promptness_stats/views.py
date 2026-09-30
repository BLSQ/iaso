from drf_spectacular.utils import extend_schema
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.request import Request
from rest_framework.response import Response

from iaso.api.common import HasPermission
from iaso.api.promptness_stats.pagination import PromptnessStatsPagination
from iaso.api.promptness_stats.serializers import PromptnessStatsQueryParamsSerializer
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

    def list(self, request: Request, *args, **kwargs) -> Response:
        """Promptness of form submissions, per org unit"""
        raise NotImplementedError

    @action(methods=["GET"], detail=False)
    def export_csv(self, request: Request, *args, **kwargs):
        """Same as `list`, as a CSV file and without pagination"""
        raise NotImplementedError
