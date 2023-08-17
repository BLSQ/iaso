import logging

import dhis2
import requests
from rest_framework import serializers, permissions
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response

from iaso.models import DataSource, OrgUnit, SourceVersion, ExternalCredentials
from .common import ModelViewSet
from ..tasks.dhis2_ou_importer import get_api
from hat.menupermissions import models as permission


class DataSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSource

        fields = [
            "id",
            "name",
            "read_only",
            "description",
            "created_at",
            "updated_at",
            "versions",
            "url",
            "projects",
            "default_version",
            "credentials",
        ]

    url = serializers.SerializerMethodField()
    versions = serializers.SerializerMethodField()
    default_version = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()
    credentials = serializers.SerializerMethodField()

    @staticmethod
    def get_credentials(obj: DataSource):
        return obj.credentials.as_dict() if obj.credentials else None

    @staticmethod
    def get_url(obj: DataSource):
        return obj.credentials.url if obj.credentials else None

    @staticmethod
    def get_versions(obj: DataSource):
        return [v.as_dict_without_data_source() for v in obj.versions.all()]

    @staticmethod
    def get_default_version(obj: DataSource):
        return obj.default_version.as_dict_without_data_source() if obj.default_version else None

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
            new_credentials.url = credentials["dhis_url"]
            new_credentials.save()
            ds.credentials = new_credentials

        ds.save()
        projects = account.project_set.filter(id__in=self.context["request"].data.get("project_ids", []))
        if projects is not None:
            for project in projects:
                ds.projects.add(project)
        return ds

    def update(self, data_source, validated_data):
        credentials = self.context["request"].data.get("credentials", None)
        account = self.context["request"].user.iaso_profile.account

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
            new_credentials.url = credentials["dhis_url"]
            new_credentials.save()
            data_source.credentials = new_credentials

        name = validated_data.pop("name", None)
        read_only = validated_data.pop("read_only", None)
        description = validated_data.pop("description", None)
        default_version_id = self.context["request"].data["default_version_id"]
        projects = account.project_set.filter(id__in=self.context["request"].data.get("project_ids", None))
        if name is not None:
            data_source.name = name
        if read_only is not None:
            data_source.read_only = read_only
        if description is not None:
            data_source.description = description
        if default_version_id is not None:
            sourceVersion = get_object_or_404(
                SourceVersion,
                id=default_version_id,
            )
            data_source.default_version = sourceVersion
        else:
            data_source.default_version = None

        data_source.save()

        if projects is not None:
            data_source.projects.clear()
            for project in projects:
                data_source.projects.add(project)
        return data_source


class TestCredentialSerializer(serializers.Serializer):
    dhis2_url = serializers.CharField()
    dhis2_login = serializers.CharField()
    dhis2_password = serializers.CharField(required=False, allow_blank=True)
    data_source = serializers.PrimaryKeyRelatedField(queryset=DataSource.objects.all(), required=False, allow_null=True)

    def test_api(self):
        self.is_valid(raise_exception=True)
        data = self.validated_data

        password = data["dhis2_password"]
        # Since we obviously don't send password to front but may want to test an
        # existing setup, if url is same we reuse the current password
        ds: DataSource = data["data_source"]
        if not password and ds and ds.credentials and ds.credentials.url == data["dhis2_url"]:
            password = ds.credentials.password

        if not password:
            raise serializers.ValidationError({"dhis2_password": ["This field may not be blank."]})

        api = get_api(
            data["dhis2_url"],
            data["dhis2_login"],
            password,
        )

        try:
            rep = api.get("system/ping")
        except dhis2.exceptions.RequestException as err:
            if err.code == 401:
                print(err)
                raise serializers.ValidationError({"dhis2_password": ["Invalid user or password"]})
            raise serializers.ValidationError({"dhis2_password": [err.description]})
        except requests.exceptions.ConnectionError:
            raise serializers.ValidationError({"dhis2_url": ["Could not connect to server"]})
        except Exception as err:
            logging.exception(err)
            raise
        return rep


class DataSourcePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        # see permission logic on view
        read_perms = (
            permission.MAPPINGS,
            permission.ORG_UNITS,
            permission.LINKS,
            permission.SOURCES,
        )
        write_perms = (permission.SOURCE_WRITE,)

        if (
            request.method in permissions.SAFE_METHODS
            and request.user
            and any(request.user.has_perm(perm) for perm in read_perms)
        ):
            return True
        if request.method == "DELETE":
            return False
        return request.user and any(request.user.has_perm(perm) for perm in write_perms)


class DataSourceViewSet(ModelViewSet):
    f"""Data source API

    This API is restricted to authenticated users:
    Read permission are restricted to user with at least one of the "{permission.SOURCES}",
        "{permission.MAPPINGS}","{permission.ORG_UNITS}", and "{permission.LINKS}" permissions
    Write permission are restricted to user having the "{permission.SOURCES}" permissions.

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
        sources = DataSource.objects.filter(projects__account=profile.account).distinct()
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
