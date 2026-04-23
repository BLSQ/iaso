from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.mixins import ListModelMixin

from hat.api_import.models import APIImport
from iaso.api.api_import.filters import APIImportFilterSet
from iaso.api.api_import.pagination import APIImportPagination
from iaso.api.api_import.permission import HasAccountManagementPermission
from iaso.api.api_import.serializers import APIImportSerializer
from iaso.models import Project


class APIImportViewSet(viewsets.GenericViewSet, ListModelMixin):
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    permission_classes = [HasAccountManagementPermission]
    serializer_class = APIImportSerializer
    filterset_class = APIImportFilterSet
    pagination_class = APIImportPagination
    ordering_fields = ["created_at", "import_type", "user_id", "app_id", "app_version", "has_problem"]

    def get_queryset(self):
        queryset = APIImport.objects.prefetch_related("user").all()
        user = self.request.user
        if not user.is_staff:
            queryset = queryset.filter(
                app_id__in=Project.objects.filter(account=user.iaso_profile.account)
                .only("app_id")
                .values_list("app_id")
            )
        return queryset.order_by("id")
