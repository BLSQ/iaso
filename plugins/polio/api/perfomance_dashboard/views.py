import django_filters

from rest_framework import filters, permissions, viewsets

from plugins.polio.api.perfomance_dashboard.serializers import (
    PerformanceDashboardListSerializer,
    PerformanceDashboardWriteSerializer,
)
from plugins.polio.models.performance_dashboard import PerformanceDashboard

from .filters import PerformanceDashboardFilter
from .pagination import PerformanceDashboardPagination
from .permissions import (
    HasPerformanceDashboardAdminPermission,
    HasPerformanceDashboardReadOnlyPermission,
    HasPerformanceDashboardWritePermission,
)


class PerformanceDashboardViewSet(viewsets.ModelViewSet):
    """
    API endpoint for National Logistics Plans.

    This endpoint supports filtering by:
    - `country` (ID of the country OrgUnit)
    - `country_block` (ID of the parent OrgUnit of the country, e.g., a region)
    - `status` (draft, commented, final)
    - `antigen` (bOPV, nOPV2, etc.)

    The permissions are structured as follows:
    - **Read-only**: Can only list and retrieve plans.
    - **Non-admin**: Can create and update plans.
    - **Admin**: Can delete plans.
    """

    # The serializer_class is removed because 'get_serializer_class' is implemented
    # DRF will call get_serializer_clas() instead of looking for this attribute
    # serializer_class =
    pagination_class = PerformanceDashboardPagination
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
    ]
    filterset_class = PerformanceDashboardFilter
    ordering_fields = ["date", "country__name", "status", "antigen", "updated_at"]
    http_method_names = ["get", "post", "patch", "delete"]

    def get_queryset(self):
        """
        Get the queryset for the view, filtered for the current user's account.
        """
        return (
            PerformanceDashboard.objects.filter_for_user(self.request.user)
            .select_related("country", "created_by", "updated_by")
            .order_by("-date")
        )

    def get_permissions(self):
        """
        Instantiate and return the list of permissions that this view requires,
        based on the action being performed.
        """
        if self.action in ["list", "retrieve"]:
            permission_classes = [HasPerformanceDashboardReadOnlyPermission]
        elif self.action in ["create", "partial_update"]:
            permission_classes = [HasPerformanceDashboardWritePermission]
        elif self.action == "destroy":
            permission_classes = [HasPerformanceDashboardAdminPermission]
        else:
            permission_classes = [permissions.IsAuthenticated]

        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        """
        Dynamically returns the appropriate serializer class based on the action.
        """
        if self.action in ["list", "retrieve"]:
            # For read-only actions (GET), use the serializer that shows detailed, nested data.
            return PerformanceDashboardListSerializer

        if self.action in ["create", "update", "partial_update"]:
            # For write actions (POST, PATCH), use the serializer that accepts simple IDs.
            return PerformanceDashboardWriteSerializer
        # As a fallback, you can return the default serializer

        return super().get_serializer_class()

    def get_serializer_context(self):
        """
        Pass the request context to the serializer.
        This is crucial for the serializer's create/update methods.
        """
        # Call the parent implementation to get the default context
        context = super().get_serializer_context()
        # Explicitly add the request object to the context
        context["request"] = self.request
        return context
