import typing
from .common import ModelViewSet
from iaso.models import DataSource, OrgUnit
from rest_framework import serializers, permissions


class DataSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSource

        fields = ["id", "name", "read_only", "description", "created_at", "updated_at", "versions", "url", "projects"]

    url = serializers.SerializerMethodField()
    versions = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()

    @staticmethod
    def get_url(obj: DataSource):
        return obj.credentials.url if obj.credentials else None

    @staticmethod
    def get_versions(obj: DataSource):
        return [v.as_dict_without_data_source() for v in obj.versions.all()]

    @staticmethod
    def get_projects(obj: DataSource):
        return ([v.as_dict() for v in obj.projects.all()],)

    def create(self, validated_data):
        ds = DataSource(**validated_data)
        ds.save()
        account = self.context["request"].user.iaso_profile.account
        project = account.project_set.first()  # not wonderful, there should maybe be a default project rather than this
        ds.projects.add(project)
        return ds


class DataSourceViewSet(ModelViewSet):
    """ Data source API

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
        sources = DataSource.objects.filter(projects__account=profile.account).distinct()
        if linked_to:
            org_unit = OrgUnit.objects.get(pk=linked_to)
            useful_sources = org_unit.source_set.values_list("algorithm_run__version_2__data_source_id", flat=True)
            sources = sources.filter(id__in=useful_sources)
        return sources.order_by("name")
