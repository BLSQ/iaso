import django_filters

from rest_framework import filters, viewsets

from iaso.api.data_source_versions_synchronization.filters import DataSourceVersionsSynchronizationFilter
from iaso.api.data_source_versions_synchronization.pagination import DataSourceVersionsSynchronizationPagination
from iaso.api.data_source_versions_synchronization.permissions import DataSourceVersionsSynchronizationPermission
from iaso.api.data_source_versions_synchronization.serializers import DataSourceVersionsSynchronizationSerializer
from iaso.models import DataSourceVersionsSynchronization


class DataSourceVersionsSynchronizationViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = DataSourceVersionsSynchronizationFilter
    ordering_fields = [
        "id",
        "name",
        "count_create",
        "count_update",
        "account",
        "created_by__username",
        "created_at",
        "updated_at",
    ]
    http_method_names = ["get", "options", "patch", "post", "head", "trace"]
    pagination_class = DataSourceVersionsSynchronizationPagination
    permission_classes = [DataSourceVersionsSynchronizationPermission]
    serializer_class = DataSourceVersionsSynchronizationSerializer

    def get_queryset(self):
        account = self.request.user.iaso_profile.account
        return (
            DataSourceVersionsSynchronization.objects.select_related(
                "source_version_to_update__data_source",
                "source_version_to_compare_with__data_source",
                "account",
                "created_by",
            )
            .filter(account=account)
            .order_by("-id")
        )
