import django_filters
from rest_framework import permissions, serializers
from iaso.models import GroupSet, Group, DataSource, SourceVersion
from ..common import ModelViewSet, TimestampField, HasPermission
from hat.menupermissions import models as permission
from iaso.api.query_params import LIMIT, PAGE
from rest_framework.pagination import PageNumberPagination
from iaso.api.common import Paginator
from .serializers import GroupSetSerializer
from .filters import GroupSetFilter

from rest_framework import filters, status, exceptions


class HasGroupsetPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if obj.source_version.data_source.read_only and request.method != "GET":
            return False

        user_account = request.user.iaso_profile.account
        projects = obj.source_version.data_source.projects.all()
        account_ids = [p.account_id for p in projects]

        return user_account.id in account_ids


class GroupSetPagination(Paginator):
    page_size = 10


class GroupSetsViewSet(ModelViewSet):
    f"""Groups API

    This API is restricted to users having the "{permission.ORG_UNITS}", "{permission.ORG_UNITS_READ}" permission

    GET /api/groups/      params : version, dataSource, defaultVersion, search, order
    GET /api/groups/<id>
    POST /api/groups/
    PATCH /api/groups/<id>
    DELETE /api/groups/<id>
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(permission.ORG_UNITS, permission.ORG_UNITS_READ),  # type: ignore
        HasGroupsetPermission,
    ]

    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = GroupSetFilter
    ordering = ["name"]

    serializer_class = GroupSetSerializer
    results_key = "group_sets"
    http_method_names = ["get"]  # "post", "patch", "delete", "head", "options", "trace"]

    def pagination_class(self):
        return GroupSetPagination(self.results_key)

    def get_queryset(self):
        if self.request.user.is_anonymous:
            return GroupSet.objects.none()

        profile = self.request.user.iaso_profile
        queryset = GroupSet.objects.filter(source_version__data_source__projects__in=profile.account.project_set.all())
        queryset = queryset.prefetch_related("source_version")
        queryset = queryset.prefetch_related("source_version__data_source")

        queryset = queryset.prefetch_related("groups__source_version")
        queryset = queryset.prefetch_related("groups__source_version__data_source")

        order = self.request.query_params.get("order", "name").split(",")
        return queryset
