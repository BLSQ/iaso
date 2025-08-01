from django.db.models import Count
from rest_framework import permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response

import iaso.permissions as core_permissions

from iaso.api.group_sets.serializers import GroupSetSerializer
from iaso.models import DataSource, Group, Project, SourceVersion

from .common import HasPermission, ModelViewSet, TimestampField


class HasGroupPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if obj.source_version.data_source.read_only and request.method != "GET":
            return False

        user_account = request.user.iaso_profile.account
        projects = obj.source_version.data_source.projects.all()
        account_ids = [p.account_id for p in projects]

        return user_account.id in account_ids


class DataSourceSerializerForGroup(serializers.ModelSerializer):
    class Meta:
        model = DataSource
        fields = ["id", "name"]


class SourceVersionSerializerForGroup(serializers.ModelSerializer):
    class Meta:
        model = SourceVersion
        fields = ["id", "number", "data_source"]

    data_source = DataSourceSerializerForGroup()


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = [
            "id",
            "name",
            "source_ref",
            "source_version",
            "group_sets",
            "org_unit_count",
            "created_at",
            "updated_at",
            "block_of_countries",  # It's used to mark a group containing only countries
        ]
        read_only_fields = ["id", "source_version", "group_sets", "org_unit_count", "created_at", "updated_at"]
        ref_name = "iaso_group_serializer"

    source_version = SourceVersionSerializerForGroup(read_only=True)
    group_sets = GroupSetSerializer(many=True, read_only=True)
    org_unit_count = serializers.IntegerField(read_only=True)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    def validate(self, attrs):
        default_version = self._fetch_user_default_source_version()
        if "source_ref" in attrs:
            # Check if the source_ref is already used by another group
            potential_group = Group.objects.filter(source_ref=attrs["source_ref"], source_version=default_version)
            if potential_group.exists():
                raise serializers.ValidationError(
                    {"source_ref": "This source ref is already used by another group in your default version"}
                )

        return super().validate(attrs)

    def create(self, validated_data):
        default_version = self._fetch_user_default_source_version()
        validated_data["source_version"] = default_version
        return super().create(validated_data)

    def _fetch_user_default_source_version(self):
        profile = self.context["request"].user.iaso_profile
        version = profile.account.default_version
        if version is None:
            raise serializers.ValidationError("This account has no default version")
        return version


class GroupDropdownSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()

    def get_label(self, obj):
        datasource = obj.source_version.data_source.name
        version_number = obj.source_version.number
        name = obj.name
        return f"{name} ({datasource} - {version_number})"

    class Meta:
        model = Group
        fields = ["id", "name", "label"]
        read_only_fields = ["id", "name", "label"]


class GroupsViewSet(ModelViewSet):
    f"""Groups API

    This API is restricted to users having the "{core_permissions.ORG_UNITS}", "{core_permissions.ORG_UNITS_READ}" and "{core_permissions.COMPLETENESS_STATS}" permission

    GET /api/groups/
    GET /api/groups/<id>
    POST /api/groups/
    PATCH /api/groups/<id>
    DELETE /api/groups/<id>
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(core_permissions.ORG_UNITS, core_permissions.ORG_UNITS_READ, core_permissions.COMPLETENESS_STATS),  # type: ignore
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
