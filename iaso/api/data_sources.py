from .common import ModelViewSet
from iaso.models import DataSource, OrgUnit, SourceVersion
from rest_framework import serializers, permissions
from rest_framework.generics import get_object_or_404


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
        ]

    url = serializers.SerializerMethodField()
    versions = serializers.SerializerMethodField()
    default_version = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()

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
        ds = DataSource(**validated_data)
        ds.save()
        account = self.context["request"].user.iaso_profile.account
        projects = account.project_set.filter(
            id__in=self.context["request"].data["project_ids"]
        )
        if projects is not None:
            for project in projects:
                ds.projects.add(project)
        return ds

    def update(self, data_source, validated_data):
        print(self.context["request"].data)
        name = validated_data.pop("name", None)
        read_only = validated_data.pop("read_only", None)
        description = validated_data.pop("description", None)
        default_version_id = self.context["request"].data["default_version_id"]
        account = self.context["request"].user.iaso_profile.account
        projects = account.project_set.filter(
            id__in=self.context["request"].data["project_ids"]
        )
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


class DataSourceViewSet(ModelViewSet):
    """Data source API

    This API is restricted to authenticated users having at least one of the "menupermissions.iaso_mappings",
    "menupermissions.iaso_org_units", and "menupermissions.iaso_links" permissions

    GET /api/datasources/
    GET /api/datasources/<id>
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DataSourceSerializer
    results_key = "sources"
    queryset = DataSource.objects.all()
    http_method_names = ["get", "post", "put", "head", "options", "trace", "delete"]

    def get_queryset(self):
        linked_to = self.kwargs.get("linkedTo", None)
        profile = self.request.user.iaso_profile
        order = self.request.GET.get("order", "name").split(",")
        sources = DataSource.objects.filter(
            projects__account=profile.account
        ).distinct()
        if linked_to:
            org_unit = OrgUnit.objects.get(pk=linked_to)
            useful_sources = org_unit.source_set.values_list(
                "algorithm_run__version_2__data_source_id", flat=True
            )
            sources = sources.filter(id__in=useful_sources)
        return sources.order_by(*order)