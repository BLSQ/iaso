import django_filters
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import filters, status
from iaso.models import GroupSet
from ..common import ModelViewSet, HasPermission
from hat.menupermissions import models as permission
from iaso.api.common import Paginator
from .serializers import GroupSetSerializer
from .filters import GroupSetFilter


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

    GET /api/group_sets/      params : version, dataSource, defaultVersion, search, order
    GET /api/group_sets/<id>
    POST /api/group_sets/
    PATCH /api/group_sets/<id>
    DELETE /api/group_sets/<id>
    """
    lookup_field = "id"

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
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options", "trace"]

    def pagination_class(self):
        return GroupSetPagination(self.results_key)

    def get_queryset(self):
        query_set = (
            GroupSet.objects.all()
            .filter_for_user_and_app_id(self.request.user, self.request.query_params.get("app_id"))
            .prefetch_source_version_details()
            .prefetch_groups_details()
        )

        return query_set

    def create(self, request, *args, **kwargs):
        """
        Create a `Groupset`.
        """
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
