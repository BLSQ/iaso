from typing import Union

from django.db.models import Count
from django.db.models.query import QuerySet
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.request import Request
from rest_framework.response import Response

from hat.menupermissions import models as permission
from iaso.api.query_params import APP_ID
from iaso.models import Group, SourceVersion, DataSource, Project
from .common import ModelViewSet, TimestampField, HasPermission
from .serializers import AppIdSerializer


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
            "org_unit_count",
            "created_at",
            "updated_at",
            "block_of_countries",  # It's used to mark a group containing only countries
        ]
        read_only_fields = ["id", "source_version", "org_unit_count", "created_at", "updated_at"]
        ref_name = "iaso_group_serializer"

    source_version = SourceVersionSerializerForGroup(read_only=True)
    org_unit_count = serializers.IntegerField(read_only=True)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    def create(self, validated_data):
        profile = self.context["request"].user.iaso_profile
        version = profile.account.default_version

        if version is None:
            raise serializers.ValidationError("This account has no default version")

        validated_data["source_version"] = version

        return super().create(validated_data)


class GroupDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = [
            "id",
            "name",
        ]
        read_only_fields = ["id", "name"]


class GroupsViewSet(ModelViewSet):
    f"""Groups API

    This API is restricted to users having the "{permission.ORG_UNITS}" and "{permission.COMPLETENESS_STATS}" permission

    GET /api/groups/
    GET /api/groups/<id>
    POST /api/groups/
    PATCH /api/groups/<id>
    DELETE /api/groups/<id>
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(permission.ORG_UNITS, permission.COMPLETENESS_STATS),  # type: ignore
        HasGroupPermission,
    ]
    serializer_class = GroupSerializer
    results_key = "groups"
    http_method_names = ["get", "post", "patch", "delete", "head", "options", "trace"]

    def get_queryset(self):
        if self.request.user.is_anonymous:
            return Group.objects.none()

        profile = self.request.user.iaso_profile
        queryset = Group.objects.filter(source_version__data_source__projects__in=profile.account.project_set.all())
        return queryset

    def filter_queryset(self, queryset):
        light = self.request.GET.get("light", False)
        queryset = queryset.prefetch_related("source_version")
        queryset = queryset.prefetch_related("source_version__data_source")
        if not light:
            queryset = queryset.annotate(org_unit_count=Count("org_units"))

        version = self.request.query_params.get("version", None)
        data_source_id = self.request.GET.get("dataSource", None)
        if version:
            queryset = queryset.filter(source_version=version)
        elif data_source_id:
            queryset = queryset.filter(source_version__data_source__id=data_source_id)
        else:
            default_version = self.request.GET.get("defaultVersion", None)
            if default_version == "true":
                queryset = queryset.filter(source_version=self.request.user.iaso_profile.account.default_version)

        block_of_countries = self.request.GET.get("blockOfCountries", None)
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
            # Filter on version ids (linked to the account)
            versions = SourceVersion.objects.filter(data_source__projects__account=account)

        else:
            # this check if project need auth
            project = Project.objects.get_for_user_and_app_id(user, app_id)
            versions = SourceVersion.objects.filter(data_source__projects=project)
        groups = Group.objects.filter(source_version__in=versions).distinct()

        queryset = self.filter_queryset(groups)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class MobileGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = [
            "id",
            "name",
        ]


class MobileGroupsViewSet(ModelViewSet):
    """Groups API for Mobile.

    This API:

    - allows the mobile application to pass an `app_id` to filter `groups`
    - has a lighter payload
    - is open to anonymous users

    `GET /api/mobile/groups/?app_id=some.app.id`
    """

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = MobileGroupSerializer
    results_key = "groups"
    http_method_names = ["get", "head", "options"]

    app_id_param = openapi.Parameter(
        name=APP_ID,
        in_=openapi.IN_QUERY,
        required=True,
        description="Application id",
        type=openapi.TYPE_STRING,
    )

    @swagger_auto_schema(
        responses={
            200: f"list of groups for the given '{APP_ID}'",
            400: f"parameter '{APP_ID}' was not provided",
            404: f"project for given '{APP_ID}' doesn't exist",
        },
        manual_parameters=[app_id_param],
    )
    def list(self, request: Request, *args, **kwargs) -> Response:
        return super().list(request, *args, **kwargs)

    def get_queryset(self) -> QuerySet:
        app_id_serializer = AppIdSerializer(data=self.request.query_params)
        app_id_serializer.is_valid(raise_exception=True)
        self.app_id_param = app_id_serializer.data["app_id"]

        queryset = Project.objects.select_related("account__default_version")
        project = get_object_or_404(queryset, app_id=self.app_id_param)

        return Group.objects.filter(source_version=project.account.default_version)
