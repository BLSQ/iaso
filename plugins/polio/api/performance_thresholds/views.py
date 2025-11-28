import django_filters

from rest_framework import filters

from iaso.api.common import ModelViewSet
from plugins.polio.api.performance_thresholds.filters import PerformanceThresholdFilter
from plugins.polio.api.performance_thresholds.serializers import (
    PerformanceThresholdListSerializer,
    PerformanceThresholdWriteSerializer,
)
from plugins.polio.models.performance_thresholds import PerformanceThresholds

# from .filters import PerformanceDashboardFilter
from ..perfomance_dashboard.permissions import PerformanceDashboardPermission


class PerformanceThresholdsViewSet(ModelViewSet):
    """
    API endpoint for Performance Dashboard.

    This endpoint supports filtering by:
    - indicator
    - timeline
    - level

    The permissions are structured as follows:
    - **Read-only**: Can only list and retrieve plans.
    - **Non-admin**: Can create and update plans.
    - **Admin**: Can delete plans.
    """

    permission_classes = [PerformanceDashboardPermission]
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    ]
    filterset_class = PerformanceThresholdFilter
    ordering_fields = ["indicator", "timeline", "updated_at"]
    http_method_names = ["get", "post", "patch", "delete"]

    def get_queryset(self):
        """
        Get the queryset for the view, filtered for the current user's account.
        """
        return (
            PerformanceThresholds.objects.filter_for_user(self.request.user)
            .select_related("created_by", "updated_by")
            .order_by("indicator")
        )

    def get_serializer_class(self):
        """
        Dynamically returns the appropriate serializer class based on the action.
        """
        if self.action in ["list", "retrieve"]:
            return PerformanceThresholdListSerializer

        if self.action in ["create", "update", "partial_update"]:
            return PerformanceThresholdWriteSerializer

        return super().get_serializer_class()
