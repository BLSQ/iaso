import json
import logging

import dhis2
import requests

from django.db.models import Count, Prefetch
from rest_framework import permissions, serializers
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

import iaso.permissions as core_permissions

from iaso.models import DataSource, ExternalCredentials, OrgUnit, SourceVersion

from ..dhis2.url_helper import clean_url
from ..tasks.dhis2_ou_importer import get_api
from .common import ModelViewSet


class DataSourceSerializer(serializers.ModelSerializer):
    credentials = serializers.SerializerMethodField()
    default_version = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()
    versions = serializers.SerializerMethodField()

    class Meta:
        model = DataSource
        fields = [
            "id",
            "name",
            "read_only",
            "credentials",
            "description",
            "created_at",
            "updated_at",
            "default_version",
            "tree_config_status_fields",
            "projects",
            "versions",
            "url",
        ]

    @staticmethod
    def get_credentials(obj: DataSource):
        return obj.credentials.as_dict() if obj.credentials else None

    @staticmethod
    def get_url(obj: DataSource):
        return obj.credentials.url if obj.credentials else None

    @staticmethod
    def get_versions(obj: DataSource):
        versions = []
        for version in obj.versions.all():
            org_units_count = getattr(version, "annotated_org_units_count", None)
            versions.append(version.as_dict_without_data_source(org_units_count=org_units_count))
        return versions

    @staticmethod
    def get_default_version(obj: DataSource):
        if not obj.default_version:
            return None
        org_units_count = getattr(obj, "annotated_org_units_count", None)
        return obj.default_version.as_dict_without_data_source(org_units_count=org_units_count)

    @staticmethod
    def get_projects(obj: DataSource):
        return ([v.as_dict() for v in obj.projects.all()],)

    def create(self, validated_data):
        # TO-DO use credentials serializer as https://github.com/BLSQ/iaso/blob/development/iaso/api/forms.py
        credentials = self.context["request"].data.get("credentials", None)
        account = self.context["request"].user.iaso_profile.account
        ds = DataSource(**validated_data)
        if credentials:
            new_credentials = ExternalCredentials()
            new_credentials.account = account
            new_credentials.name = credentials["dhis_name"]
            new_credentials.login = credentials["dhis_login"]
            new_credentials.password = credentials["dhis_password"]
            new_credentials.url = clean_url(credentials["dhis_url"])
            new_credentials.save()
            ds.credentials = new_credentials

        ds.save()
        projects = account.project_set.filter(id__in=self.context["request"].data.get("project_ids", []))
        if projects is not None:
            for project in projects:
                ds.projects.add(project)
        return ds

    def update(self, data_source, validated_data):
        request = self.context["request"]

        credentials = request.data.get("credentials")
        account = request.user.iaso_profile.account

        if credentials:
            if data_source.credentials:
                new_credentials = get_object_or_404(ExternalCredentials, pk=data_source.credentials.pk)
            else:
                new_credentials = ExternalCredentials()
                new_credentials.account = account

            new_credentials.name = credentials["dhis_name"]
            new_credentials.login = credentials["dhis_login"]
            if credentials["dhis_password"]:
                new_credentials.password = credentials["dhis_password"]
            if credentials["dhis_url"] != new_credentials.url and not credentials["dhis_password"]:
                # Don't keep old password if we change the dhis2 url so the password can't be ex-filtrated.
                new_credentials.password = ""

            new_credentials.url = clean_url(credentials["dhis_url"])
            new_credentials.save()
            data_source.credentials = new_credentials

        name = validated_data.get("name")
        if name:
            data_source.name = name

        read_only = validated_data.get("read_only")
        if read_only is not None:
            data_source.read_only = read_only

        description = validated_data.get("description")
        if description:
            data_source.description = description

        # TODO: `default_version_id` should be part of the serializer.
        default_version_id = request.data.get("default_version_id")
        if default_version_id:
            source_version = get_object_or_404(data_source.versions, id=default_version_id)

            new_default_version: bool = data_source.default_version_id != source_version.id
            if new_default_version and not request.user.has_perm(core_permissions.SOURCES_CAN_CHANGE_DEFAULT_VERSION):
                raise serializers.ValidationError(
                    "User doesn't have the permission to change the default version of a data source."
                )

            data_source.default_version = source_version
        else:
            data_source.default_version = None

        data_source.save()

        # TODO: `project_ids` should be part of the serializer.
        project_ids = request.data.get("project_ids")
        if project_ids:
            projects = account.project_set.filter(id__in=project_ids)
            if projects:
                data_source.projects.set(projects, clear=True)

        return data_source


class TestCredentialSerializer(serializers.Serializer):
    dhis2_url = serializers.CharField()
    dhis2_login = serializers.CharField()
    dhis2_password = serializers.CharField(required=False, allow_blank=True)
    data_source = serializers.PrimaryKeyRelatedField(queryset=DataSource.objects.all(), required=False, allow_null=True)

    def raise_exception(self, field):
        message = "dhis2InvalideUserOrPasswordError" if field == "dhis2_password" else "dhis2ServerConnectionError"
        raise serializers.ValidationError({field: [message]})

    def test_api(self):
        self.is_valid(raise_exception=True)
        data = self.validated_data

        password = data["dhis2_password"]
        dhis2_login = data["dhis2_login"]
        dhis2_url = clean_url(data["dhis2_url"])
        dhis2_system_info_api = dhis2_url + "/api/system/info"
        # Since we obviously don't send password to front but may want to test an
        # existing setup, if url is same we reuse the current password
        ds: DataSource = data["data_source"]
        if not password and ds and ds.credentials and ds.credentials.url == dhis2_url:
            password = ds.credentials.password

        if not password:
            raise serializers.ValidationError({"dhis2_password": ["dhis2PasswordBlankError"]})

        api = get_api(
            dhis2_url,
            dhis2_login,
            password,
        )

        # check the authentication on the dhis2
        try:
            rep = api.get("system/info")
        except dhis2.exceptions.RequestException as err:
            if err.code == 404:
                self.raise_exception("dhis2_url")
            if err.code == 401:
                self.raise_exception("dhis2_password")
            self.raise_exception("dhis2_url", err.description)
        except requests.exceptions.ConnectionError:
            self.raise_exception("dhis2_url")
        except Exception as err:
            logging.exception(err)
            raise

        # check the url authenticity throught the dhis2 api
        try:
            response = requests.get(dhis2_system_info_api, auth=(dhis2_login, password)).json()
            # dependending on the version the field url is not always the same
            if "instanceBaseUrl" in response and response["instanceBaseUrl"] != dhis2_url:
                self.raise_exception("dhis2_url")
            if "contextPath" in response and response["contextPath"] != dhis2_url:
                self.raise_exception("dhis2_url")
            # just in case both fields are empty, at least verify that we have a version field
            if "version" not in response:
                self.raise_exception("dhis2_url")

        except json.decoder.JSONDecodeError:
            self.raise_exception("dhis2_url")
        return rep


class DataSourcePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        # see permission logic on view
        read_perms = (
            core_permissions.MAPPINGS,
            core_permissions.ORG_UNITS,
            core_permissions.ORG_UNITS_READ,
            core_permissions.LINKS,
            core_permissions.SOURCES,
        )
        write_perms = (core_permissions.SOURCE_WRITE,)

        if (
            request.method in permissions.SAFE_METHODS
            and request.user
            and any(request.user.has_perm(perm) for perm in read_perms)
        ):
            return True
        if request.method == "DELETE":
            return False
        return request.user and any(request.user.has_perm(perm) for perm in write_perms)


class DataSourceDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSource
        fields = ["id", "name", "projects"]
        read_only_fields = ["id", "name", "projects"]


class DataSourceViewSet(ModelViewSet):
    f"""Data source API

    This API is restricted to authenticated users:
    Read permission are restricted to user with at least one of the "{core_permissions.SOURCES}",
        "{core_permissions.MAPPINGS}","{core_permissions.ORG_UNITS}","{core_permissions.ORG_UNITS_READ}" and "{core_permissions.LINKS}" permissions
    Write permission are restricted to user having the "{core_permissions.SOURCES}" permissions.

    GET /api/datasources/
    GET /api/datasources/<id>
    """

    permission_classes = [DataSourcePermission]  # type: ignore

    serializer_class = DataSourceSerializer
    results_key = "sources"
    queryset = DataSource.objects.all()
    http_method_names = ["get", "post", "put", "head", "options", "trace"]

    def get_queryset(self):
        linked_to = self.kwargs.get("linkedTo", None)
        profile = self.request.user.iaso_profile
        order = self.request.GET.get("order", "name").split(",")
        filter_empty_versions = self.request.GET.get("filter_empty_versions", "false").lower() == "true"
        project_ids = self.request.GET.get("project_ids")
        name = self.request.GET.get("name", None)

        versions_prefetch = Prefetch(
            "versions",
            queryset=SourceVersion.objects.filter(data_source__projects__account=profile.account).annotate(
                annotated_org_units_count=Count("orgunit")
            ),
        )

        sources = (
            DataSource.objects.select_related("default_version", "credentials")
            .prefetch_related("projects", versions_prefetch)
            .filter(projects__account=profile.account)
            .annotate(annotated_org_units_count=Count("default_version__orgunit"))
            .distinct()
        )

        if filter_empty_versions:
            sources = sources.annotate(version_count=Count("versions")).filter(version_count__gt=0)
        if name:
            sources = sources.filter(name__icontains=name)
        if project_ids:
            sources = sources.filter(projects__in=project_ids.split(","))
        if linked_to:
            org_unit = OrgUnit.objects.get(pk=linked_to)
            useful_sources = org_unit.source_set.values_list("algorithm_run__version_2__data_source_id", flat=True)
            sources = sources.filter(id__in=useful_sources)
        return sources.order_by(*order)

    @action(methods=["POST"], detail=False, serializer_class=TestCredentialSerializer)
    def check_dhis2(self, request):
        serializer = TestCredentialSerializer(data=request.data)
        serializer.test_api()

        return Response({"test": "ok"})

    @action(methods=["GET"], detail=False, serializer_class=DataSourceDropdownSerializer)
    def dropdown(self, request, *args):
        """To be used in dropdowns (filters)

        * Read only
        """

        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
