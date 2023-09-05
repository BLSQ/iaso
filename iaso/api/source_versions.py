from django.http import HttpResponse
from rest_framework import serializers, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.models import DataSource
from iaso.models import SourceVersion
from .common import ModelViewSet, CONTENT_TYPE_CSV, HasPermission
from .source_versions_serializers import DiffSerializer, ExportSerializer
from .tasks import TaskSerializer
from hat.menupermissions import models as permission


class SourceVersionSerializer(serializers.ModelSerializer):
    """Source versions API

    This API is restricted to authenticated users (no specific permission check)

    GET /api/sourceversions/
    """

    data_source_name: serializers.SlugRelatedField = serializers.SlugRelatedField(
        source="data_source", slug_field="name", read_only=True
    )

    # Default version for source not global
    is_default = serializers.SerializerMethodField()

    def get_is_default(self, source_version: SourceVersion) -> bool:
        return source_version.data_source.default_version == source_version

    class Meta:
        model = SourceVersion
        fields = [
            "id",
            "data_source",
            "number",
            "description",
            "created_at",
            "updated_at",
            "data_source_name",
            "is_default",
            "org_units_count",
        ]

    def validate_data_source(self, value):
        """
        Check that data source belongs to the account
        """
        account = self.context["request"].user.iaso_profile.account
        sources = DataSource.objects.filter(projects__account=account)

        if value not in sources:
            raise serializers.ValidationError("Source does not belong to this account ")
        return value

    org_units_count = serializers.SerializerMethodField()

    def get_org_units_count(self, source_version: SourceVersion):
        return source_version.orgunit_set.count()


class SourceVersionViewSet(ModelViewSet):
    f"""Data source API

    This API is restricted to authenticated users having at least one of the "{permission.MAPPINGS}",
    "{permission.ORG_UNITS}", and "{permission.LINKS}" permissions

    GET /api/sourceversions/
    GET /api/sourceversions/<id>
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(permission.MAPPINGS, permission.ORG_UNITS, permission.LINKS),  # type: ignore
    ]
    serializer_class = SourceVersionSerializer
    results_key = "versions"
    queryset = DataSource.objects.all()
    http_method_names = ["get", "post", "put", "head", "options", "trace", "delete"]

    def get_queryset(self):
        profile = self.request.user.iaso_profile

        versions = SourceVersion.objects.filter(data_source__projects__account=profile.account).prefetch_related(
            "data_source"
        )

        source_id = self.kwargs.get("source", None)
        if source_id:
            versions = versions.filter(data_source_id=source_id)

        return versions.order_by("id").distinct()

    def create(self, request, *args, **kwargs):
        """Create a new source version

        The version number is obtained from the latest version number by adding 1
        When the is not yet source version, the new one will get 1 as number

        POST /api/sourceversions/
        """
        version_data = request.data
        description = version_data["description"]
        data_source_id = version_data["data_source_id"]

        data_source = DataSource.objects.get(id=data_source_id)
        try:
            latest_version_number = SourceVersion.objects.filter(data_source_id=data_source).latest("number").number
        except SourceVersion.DoesNotExist:
            latest_version_number = None

        new_version_number = latest_version_number + 1 if latest_version_number else 1
        new_source_version = SourceVersion.objects.create(
            data_source=data_source, number=new_version_number, description=description
        )

        new_source_version.save()

        serializer = SourceVersionSerializer(new_source_version)

        return Response(serializer.data)

    @action(methods=["GET", "POST"], detail=False, serializer_class=DiffSerializer, url_path="diff.csv")
    def diff_csv(self, request):
        serializer: DiffSerializer = self.get_serializer(
            data=request.data if request.method == "POST" else request.query_params
        )
        serializer.is_valid(raise_exception=True)
        # FIXME: FileResponse don't work, no idea why, not a priority
        filename = "comparison.csv"
        response = HttpResponse(serializer.generate_csv(), content_type=CONTENT_TYPE_CSV)
        response["Content-Disposition"] = "attachment; filename=%s" % filename
        return response

    @action(methods=["POST"], detail=False, serializer_class=ExportSerializer)
    def export_dhis2(self, request):
        """Export diff between two source to the DHIS2 server"""
        serializer: ExportSerializer = self.get_serializer(
            data=request.data if request.method == "POST" else request.query_params
        )

        serializer.is_valid(raise_exception=True)
        task = serializer.launch_export(user=request.user)
        return Response({"task": TaskSerializer(instance=task).data})
