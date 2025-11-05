from django.db.models import Count
from django.http import HttpResponse, StreamingHttpResponse
from django.utils import timezone
from django.utils.translation import gettext as _
from rest_framework import permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response

from hat.api.export_utils import Echo, generate_xlsx, iter_items
from iaso.api.common import HasPermission, ModelViewSet
from iaso.api.groups.filters import GroupListFilter
from iaso.api.groups.serializers import GroupDropdownSerializer, GroupExportSerializer, GroupSerializer
from iaso.models import Group, Project, SourceVersion
from iaso.permissions.core_permissions import (
    CORE_COMPLETENESS_STATS_PERMISSION,
    CORE_ORG_UNITS_PERMISSION,
    CORE_ORG_UNITS_READ_PERMISSION,
)


class HasGroupPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if obj.source_version.data_source.read_only and request.method != "GET":
            return False

        user_account = request.user.iaso_profile.account
        projects = obj.source_version.data_source.projects.all()
        account_ids = [p.account_id for p in projects]

        return user_account.id in account_ids


class GroupsViewSet(ModelViewSet):
    f"""Groups API

    This API is restricted to users having the "{CORE_ORG_UNITS_PERMISSION}", "{CORE_ORG_UNITS_READ_PERMISSION}" and "{CORE_COMPLETENESS_STATS_PERMISSION}" permission

    GET /api/groups/
    GET /api/groups/<id>
    POST /api/groups/
    PATCH /api/groups/<id>
    DELETE /api/groups/<id>
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(CORE_ORG_UNITS_PERMISSION, CORE_ORG_UNITS_READ_PERMISSION, CORE_COMPLETENESS_STATS_PERMISSION),
        HasGroupPermission,
    ]
    serializer_class = GroupSerializer
    results_key = "groups"
    http_method_names = ["get", "post", "patch", "delete", "head", "options", "trace"]

    def get_queryset(self):
        if self.request.user.is_anonymous:
            return Group.objects.none()

        profile = self.request.user.iaso_profile
        queryset = Group.objects.filter(
            source_version__data_source__projects__in=profile.account.project_set.all()
        ).select_related("source_version", "source_version__data_source")
        queryset = queryset.prefetch_related("group_sets")
        return queryset

    def filter_queryset(self, queryset, allow_anon=False):
        light = self.request.GET.get("light", False)
        if not light:
            queryset = queryset.annotate(org_unit_count=Count("org_units"))

        version = self.request.query_params.get("version", None)
        version_ids = self.request.query_params.get(
            "versionIds", None
        )  # Added to keep backward compatibility with version
        data_source_id = self.request.GET.get("dataSource", None)
        data_source_ids = self.request.GET.get(
            "dataSourceIds", None
        )  # Added to keep backward compatibility with dataSource
        if version:
            queryset = queryset.filter(source_version=version)
        elif version_ids:
            queryset = queryset.filter(source_version__in=version_ids.split(","))
        elif data_source_id:
            queryset = queryset.filter(source_version__data_source__id=data_source_id)
        elif data_source_ids:
            queryset = queryset.filter(source_version__data_source__id__in=data_source_ids.split(","))
        # if allow_anon is True, versions and projects are handled manually outside of this method
        elif not allow_anon:
            default_version = self.request.GET.get("defaultVersion", None)
            if default_version == "true":
                queryset = queryset.filter(source_version=self.request.user.iaso_profile.account.default_version)

            project_ids = self.request.GET.get("projectIds", None)
            if project_ids:
                versions = SourceVersion.objects.filter(data_source__projects__in=project_ids.split(","))
                queryset = queryset.filter(source_version__in=versions)

        block_of_countries = self.request.GET.get("blockOfCountries", None) == "true"
        if block_of_countries:  # Filter only org unit groups containing only countries as orgUnits
            queryset = queryset.filter(block_of_countries=block_of_countries)

        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(name__icontains=search)

        order = self.request.query_params.get("order", "name").split(",")

        return queryset.order_by(*order)

    @action(permission_classes=[], detail=False, methods=["GET"], serializer_class=GroupDropdownSerializer)
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
            # Filter on version ids (linked to the account)""
            default_version_id = account.default_version.id
            versions = SourceVersion.objects.filter(data_source__projects__account=account)

        else:
            # this check if project need auth
            try:
                project = Project.objects.get_for_user_and_app_id(user, app_id)
            except Project.DoesNotExist:
                raise serializers.ValidationError("No project found for the given app_id")
            default_version_id = project.account.default_version.id
            versions = SourceVersion.objects.filter(data_source__projects=project)

        # Apply defaultVersion filter that we skip in filter_queryset when allowing anon users
        if self.request.GET.get("defaultVersion", None) == "true":
            versions = versions.filter(pk=default_version_id)

        groups = (
            Group.objects.filter(source_version__in=versions).select_related("source_version__data_source").distinct()
        )

        queryset = self.filter_queryset(groups, allow_anon=True)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["GET"], serializer_class=GroupExportSerializer)
    def export(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        filtered_queryset = GroupListFilter(request.query_params, queryset=queryset).qs
        ordered_queryset = filtered_queryset.distinct("id").order_by("id")

        serializer = self.get_serializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        file_format = serializer.validated_data["file_format"]
        now = timezone.now()
        file_name = f"groups_{now.strftime('%Y-%m-%d-%H-%M-%S')}"

        if file_format == "csv":
            return self._export_to_csv(ordered_queryset, file_name)
        if file_format == "xlsx":
            return self._export_to_xlsx(ordered_queryset, file_name)

        return None

    def _export_to_csv(self, queryset, file_name):
        columns = [
            _("ID"),
            _("Source ref"),
            _("Name"),
            _("Data source"),
            _("Version"),
        ]
        response = StreamingHttpResponse(
            streaming_content=(
                iter_items(
                    queryset,
                    Echo(),
                    columns,
                    lambda group: self._get_table_row(group),
                )
            ),
            content_type="text/csv",
        )
        response["Content-Disposition"] = f'attachment; filename="{file_name}.csv"'
        return response

    def _export_to_xlsx(self, queryset, file_name):
        columns = [
            {"title": _("ID"), "width": 10},
            {"title": _("Source ref"), "width": 20},
            {"title": _("Name"), "width": 50},
            {"title": _("Data source"), "width": 30},
            {"title": _("Version"), "width": 10},
        ]
        response = HttpResponse(
            generate_xlsx(
                _("Groups"),
                columns,
                queryset,
                lambda group, row_num: self._get_table_row(group),
            ),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{file_name}.xlsx"'
        return response

    def _get_table_row(self, group: Group):
        return [
            group.id,
            group.source_ref,
            group.name,
            group.source_version.data_source.name,
            group.source_version.number,
        ]
