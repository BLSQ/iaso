import django_filters

from rest_framework import filters

from hat.audit.audit_mixin import AuditMixin
from iaso.api.common import ModelViewSet, ReadOnlyOrHasPermission
from plugins.polio.api.perfomance_dashboard.permissions import PerformanceDashboardPermission
from plugins.polio.api.performance_thresholds.filters import PerformanceThresholdFilter
from plugins.polio.api.performance_thresholds.serializers import (
    PerformanceThresholdReadSerializer,
    PerformanceThresholdWriteSerializer,
)
from plugins.polio.models.performance_thresholds import PerformanceThresholds


class PerformanceThresholdsViewSet(ModelViewSet, AuditMixin):
    """
    API endpoint for Performance dashboard tresholds.

    This endpoint supports filtering by:
    - indicator

    The permissions are structured as follows:
    - **Read-only**: Can only list and retrieve tresholds.
    - **Non-admin**: Can create and update tresholds.
    - **Admin**: Can delete tresholds.

    We are reusing the performance dashboard permissions since the features are related from a business point of view
    """

    permission_classes = [ReadOnlyOrHasPermission(PerformanceDashboardPermission)]
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    ]
    filterset_class = PerformanceThresholdFilter
    ordering_fields = ["indicator", "created_at", "updated_at"]
    http_method_names = ["get", "post", "patch", "delete"]

    def get_queryset(self):
        """
        Get the queryset for the view, filtered for the current user's account.
        """
        return PerformanceThresholds.objects.filter_for_user(
            self.request.user, self.request.query_params.get("app_id", None)
        ).order_by("indicator")

    def get_serializer_class(self):
        """
        Dynamically returns the appropriate serializer class based on the action.
        """
        if self.action in ["list", "retrieve"]:
            return PerformanceThresholdReadSerializer

        if self.action in ["create", "update", "partial_update"]:
            return PerformanceThresholdWriteSerializer

        return super().get_serializer_class()
