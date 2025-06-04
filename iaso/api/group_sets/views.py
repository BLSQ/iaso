import django_filters

from rest_framework import filters, permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response

from hat.menupermissions import models as permission
from iaso.api.common import Paginator
from iaso.models import GroupSet, Project, SourceVersion

from ..common import HasPermission, ModelViewSet
from .filters import GroupSetFilter
from .serializers import GroupSetSerializer


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


class GroupSetDropdownSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()

    def get_label(self, obj):
        datasource = obj.source_version.data_source.name
        version = obj.source_version.number
        name = obj.name
        return f"{name} ({datasource} - {version})"

    class Meta:
        model = GroupSet
        fields = ["id", "name", "label"]
        read_only_fields = ["id", "name", "label"]


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

    @action(permission_classes=[], detail=False, methods=["GET"], serializer_class=GroupSetDropdownSerializer)
    def dropdown(self, request, *args):
        """To be used in dropdowns (filters)

        * Read only
        * Readable anonymously if feature flag on project allow them and an app_id parameter is passed
        * No permission needed
        """

        app_id = self.request.query_params.get("app_id")
        user = request.user
        if user and user.is_anonymous and app_id is None:
            raise serializers.ValidationError("Parameter app_id is missing")

        if user and user.is_authenticated:
            account = user.iaso_profile.account
            # Filter on version ids (linked to the account)
            versions = SourceVersion.objects.filter(data_source__projects__account=account)

        else:
            # this check if project need auth
            try:
                project = Project.objects.get_for_user_and_app_id(user, app_id)
            except Project.DoesNotExist:
                raise serializers.ValidationError("No project found for the given app_id")
            versions = SourceVersion.objects.filter(data_source__projects=project)
        group_sets = GroupSet.objects.filter(source_version__in=versions).distinct()

        queryset = self.filter_queryset(group_sets)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
