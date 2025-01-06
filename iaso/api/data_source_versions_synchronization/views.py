import django_filters

from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.request import Request

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

    def perform_create(self, serializer: DataSourceVersionsSynchronizationSerializer) -> None:
        """
        Steps to synchronize data source versions:

        1. use a POST request on this endpoint to create a new `DataSourceVersionsSynchronization`
        2. use a POST request on the `create_json_diff` endpoint to compute the differences
        3. use a POST request on the `synchronize_source_versions` endpoint to create change requests
        """
        serializer.validated_data["account"] = self.request.user.iaso_profile.account
        serializer.validated_data["created_by"] = self.request.user
        serializer.save()

    @action(detail=True, methods=["POST"])
    def create_json_diff(self, request: Request, pk: int) -> Response:
        data_source_versions_synchronization = get_object_or_404(self.get_queryset(), pk=pk)
        data_source_versions_synchronization.create_json_diff()
        return Response(self.get_serializer(data_source_versions_synchronization).data)

    @action(detail=True, methods=["POST"])
    def synchronize_source_versions(self, request: Request, pk: int) -> Response:
        data_source_versions_synchronization = get_object_or_404(self.get_queryset(), pk=pk)
        data_source_versions_synchronization.synchronize_source_versions()
        return Response(self.get_serializer(data_source_versions_synchronization).data)
