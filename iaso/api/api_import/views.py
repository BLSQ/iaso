from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.mixins import ListModelMixin
from rest_framework.permissions import BasePermission

from hat.api_import.models import APIImport
from iaso.api.api_import.filters import APIImportFilterSet
from iaso.api.api_import.serializers import APIImportSerializer
from iaso.api.common import Paginator
from iaso.models import Project


class APIImportPagination(Paginator):
    page_size = 20


class IsAdminOrSuperUserPermission(BasePermission):
    """
    Allows access only to admins and superusers.
    """

    def has_permission(self, request, view):
        return bool(request.user and (request.user.is_staff or request.user.is_superuser))


class APIImportViewSet(viewsets.GenericViewSet, ListModelMixin):
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    permission_classes = [IsAdminOrSuperUserPermission]
    serializer_class = APIImportSerializer
    filterset_class = APIImportFilterSet
    pagination_class = APIImportPagination
    ordering_fields = ["created_at", "import_type", "user_id", "app_id", "app_version", "has_problem"]

    def get_queryset(self):
        queryset = APIImport.objects.all()
        user = self.request.user
        if not user.is_staff:
            queryset = queryset.filter(
                app_id__in=Project.objects.filter(account=user.iaso_profile.account)
                .only("app_id")
                .values_list("app_id")
            )
        return queryset
