import django_filters

from rest_framework import filters

from iaso.api.common import ModelViewSet
from plugins.polio.api.perfomance_dashboard.serializers import (
    PerformanceDashboardListSerializer,
    PerformanceDashboardWriteSerializer,
)
from plugins.polio.models.performance_dashboard import PerformanceDashboard

from .filters import PerformanceDashboardFilter
from .permissions import PerformanceDashboardPermission


class PerformanceDashboardViewSet(ModelViewSet):
    """
    API endpoint for Performance Dashboard.

    This endpoint supports filtering by:
    - `country` (ID of the country OrgUnit)
    - `country_block` (ID of the parent OrgUnit of the country, e.g., a region)
    - `status` (draft, commented, final)
    - `vaccine` (bOPV, nOPV2, Co-administration.)

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
    filterset_class = PerformanceDashboardFilter
    ordering_fields = ["date", "country__name", "status", "vaccine", "updated_at"]
    http_method_names = ["get", "post", "patch", "delete"]

    def get_queryset(self):
        """
        Get the queryset for the view, filtered for the current user's account.
        """
        return (
            PerformanceDashboard.objects.filter_for_user_and_app_id(
                self.request.user, self.request.query_params.get("app_id", None)
            )
            .select_related("country", "created_by", "updated_by")
            .order_by("-date")
        )

    def get_serializer_class(self):
        """
        Dynamically returns the appropriate serializer class based on the action.
        """
        if self.action in ["create", "update", "partial_update"]:
            return PerformanceDashboardWriteSerializer

        return PerformanceDashboardListSerializer

    def perform_destroy(self, instance):
        """
        Perform a soft delete and log the user who performed the action.
        """
        instance.updated_by = self.request.user
        instance.delete()
