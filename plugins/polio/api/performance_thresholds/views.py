import django_filters

from rest_framework import filters

from hat.audit.audit_mixin import AuditMixin
from iaso.api.common import ModelViewSet
from plugins.polio.api.country_plan.permissions import CountryPlanPermission
from plugins.polio.api.performance_thresholds.filters import PerformanceThresholdFilter
from plugins.polio.api.performance_thresholds.serializers import (
    PerformanceThresholdReadSerializer,
    PerformanceThresholdWriteSerializer,
)
from plugins.polio.models.performance_thresholds import PerformanceThresholds


class PerformanceThresholdsViewSet(AuditMixin, ModelViewSet):
    """
    API endpoint for Performance thresholds.

    This endpoint supports filtering by:
    - indicator

    The permissions are structured as follows:
    - **Read-only**: Can only list and retrieve thresholds.
    - **Non-admin**: Can create and update thresholds.
    - **Admin**: Can delete thresholds.

    We are reusing the country plan permissions since the features are related from a business point of view
    """

    permission_classes = [CountryPlanPermission]
    filter_backends = [
        filters.OrderingFilter,
        filters.SearchFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    ]
    filterset_class = PerformanceThresholdFilter
    ordering_fields = ["indicator", "created_at", "updated_at"]
    http_method_names = ["get", "post", "patch", "delete"]
    search_fields = ["indicator"]
    audit_serializer = PerformanceThresholdReadSerializer

    def get_queryset(self):
        """
        Get the queryset for the view, filtered for the current user's account.
        """
        return PerformanceThresholds.objects.filter_for_user_and_app_id(
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
