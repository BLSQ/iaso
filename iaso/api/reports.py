import os
import uuid
import zipfile

from django.core.files.uploadedfile import UploadedFile
from django.db import transaction
from django.utils.text import slugify
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import filters, parsers, permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.request import Request
from rest_framework.response import Response

from iaso.api.common import HasPermission, ModelViewSet
from iaso.models import Project, Report, ReportVersion
from iaso.permissions.core_permissions import CORE_REPORTS_PERMISSION


MOBILE_REPORT_MAX_SIZE = 100 * 1024 * 1024  # 100 MB
MOBILE_REPORT_ENTRY_POINT = "index.html"


def validate_mobile_report_zip(file: UploadedFile) -> UploadedFile:
    """
    A mobile report is a zip that the mobile app extracts and opens offline: it must be a
    real zip, with `index.html` at its root and no entry escaping the extraction folder.
    """
    if file.size > MOBILE_REPORT_MAX_SIZE:
        raise serializers.ValidationError(f"The file is larger than {MOBILE_REPORT_MAX_SIZE // (1024 * 1024)} MB.")
    try:
        with zipfile.ZipFile(file) as archive:
            names = archive.namelist()
    except zipfile.BadZipFile:
        raise serializers.ValidationError("The file is not a zip archive.")
    finally:
        file.seek(0)
    if MOBILE_REPORT_ENTRY_POINT not in names:
        raise serializers.ValidationError(
            f"The zip must contain `{MOBILE_REPORT_ENTRY_POINT}` at its root, not inside a folder."
        )
    for name in names:
        if name.startswith("/") or ".." in name.split("/"):
            raise serializers.ValidationError(f"The zip contains an invalid path: {name}")
    return file


def create_report_version(report, file: UploadedFile, name: str, user) -> ReportVersion:
    # The mobile app recognises a report by the `application/zip` content type, which the
    # storage infers from the extension: the stored name always ends with `.zip`.
    base_name = slugify(os.path.splitext(file.name)[0]) or "report"
    file.name = f"{base_name[:100]}-{uuid.uuid4().hex[:8]}.zip"
    return ReportVersion.objects.create(
        report=report, file=file, name=name, status="unpublished", created_by=user, updated_by=user
    )


class ReportVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportVersion
        fields = ["id", "name", "status", "url", "file_size", "created_at", "updated_at", "created_by"]
        read_only_fields = fields

    url = serializers.SerializerMethodField()
    created_by = serializers.CharField(source="created_by.username", read_only=True, default=None, allow_null=True)

    def get_url(self, obj: ReportVersion) -> str | None:
        return obj.file.url if obj.file else None


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = [
            "id",
            "name",
            "published_version",
            "published_version_id",
            "project",
            "url",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["project"]

    # `published_version` stays the version name, as before, for existing clients.
    published_version = serializers.CharField(read_only=True, source="published_version.name")
    published_version_id = serializers.IntegerField(read_only=True)
    url = serializers.SerializerMethodField()
    status = serializers.CharField(read_only=True, source="published_version.status")

    def get_url(self, obj: Report) -> str | None:
        return obj.published_version.file.url if obj.published_version.file else None


class ReportCreateSerializer(serializers.Serializer):
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.none())
    name = serializers.CharField(max_length=255)
    file = serializers.FileField(allow_empty_file=False, validators=[validate_mobile_report_zip])
    version_name = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request:
            self.fields["project"].queryset = Project.objects.filter(
                account=request.user.iaso_profile.account
            ).filter_on_user_projects(request.user)

    def validate_project(self, project: Project):
        # The mobile app only downloads one report per project.
        existing = Report.objects.filter(project=project).first()
        if existing:
            raise serializers.ValidationError(
                f"This project already has a mobile report (id {existing.id}): "
                f"upload a new version to /api/reports/{existing.id}/versions/ instead."
            )
        return project

    @transaction.atomic
    def create(self, validated_data):
        user = self.context["request"].user
        file = validated_data["file"]
        version_name = validated_data.get("version_name") or file.name
        # `Report.published_version` is mandatory: the report and its first version are
        # created together, then linked.
        version = create_report_version(None, file, version_name, user)
        report = Report.objects.create(
            name=validated_data["name"], project=validated_data["project"], published_version=version
        )
        version.report = report
        version.save()
        report.publish(version, user)
        return report


class ReportVersionCreateSerializer(serializers.Serializer):
    file = serializers.FileField(allow_empty_file=False, validators=[validate_mobile_report_zip])
    name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    publish = serializers.BooleanField(default=True)


class ReportPublishSerializer(serializers.Serializer):
    version_id = serializers.IntegerField()


@extend_schema(tags=["Reports"])
class ReportsViewSet(ModelViewSet):
    """
    api/reports

    api/reports/id

    API to manage the mobile reports of the projects. A mobile report is a zip with an `index.html`
    at its root, displayed offline by the mobile app when the project has the `REPORTS` feature flag.
    A project has at most one report; each upload creates a new version of it, and one version is
    published (served to the mobile app).

    - `POST /api/reports/` (multipart: project, name, file, version_name): create the report of a project
    - `GET|POST /api/reports/{id}/versions/` (multipart: file, name, publish): list or add versions
    - `POST /api/reports/{id}/publish/` (version_id): choose the published version
    """

    results_key = "result"
    include_results_key_if_not_paginated = False
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    filterset_fields = ["project"]
    ordering_fields = ["id", "name", "created_at", "updated_at"]
    permission_classes = [permissions.IsAuthenticated, HasPermission(CORE_REPORTS_PERMISSION)]
    pagination_class = LimitOffsetPagination
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return ReportCreateSerializer
        if self.action == "publish":
            return ReportPublishSerializer
        if self.action == "versions":
            return ReportVersionCreateSerializer
        return ReportSerializer

    def get_queryset(self):
        search = self.request.query_params.get("search", None)
        # A user restricted to some projects only manages the reports of these projects.
        projects = Project.objects.filter(account=self.request.user.iaso_profile.account).filter_on_user_projects(
            self.request.user
        )
        queryset = Report.objects.filter(project__in=projects).select_related("published_version")
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset.order_by("id")

    @extend_schema(
        parameters=[
            OpenApiParameter("project", OpenApiTypes.INT, description="Only the report of this project"),
            OpenApiParameter("search", OpenApiTypes.STR, description="Part of the report name"),
        ]
    )
    def list(self, request: Request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(request={"multipart/form-data": ReportCreateSerializer}, responses={201: ReportSerializer})
    def create(self, request: Request, *args, **kwargs):
        serializer = ReportCreateSerializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        report = serializer.save()
        return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)

    @extend_schema(
        methods=["GET"],
        request=None,
        responses={200: ReportVersionSerializer(many=True)},
        description="List the versions of the report, the most recent first.",
    )
    @extend_schema(
        methods=["POST"],
        request={"multipart/form-data": ReportVersionCreateSerializer},
        responses={201: ReportVersionSerializer},
        description="Upload a new version of the report. It is published unless `publish` is false.",
    )
    # Not paginated: a report has few versions, and the web shows them all.
    @action(detail=True, methods=["get", "post"], pagination_class=None)
    def versions(self, request: Request, pk=None):
        report = self.get_object()
        if request.method == "GET":
            versions = report.versions.select_related("created_by").order_by("-created_at", "-id")
            return Response(ReportVersionSerializer(versions, many=True).data)

        serializer = ReportVersionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file = serializer.validated_data["file"]
        with transaction.atomic():
            version = create_report_version(
                report, file, serializer.validated_data.get("name") or file.name, request.user
            )
            if serializer.validated_data["publish"]:
                report.publish(version, request.user)
        return Response(ReportVersionSerializer(version).data, status=status.HTTP_201_CREATED)

    @extend_schema(
        request=ReportPublishSerializer,
        responses={200: ReportSerializer},
        description="Choose the version of the report served to the mobile app.",
    )
    @action(detail=True, methods=["post"])
    def publish(self, request: Request, pk=None):
        report = self.get_object()
        serializer = ReportPublishSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        version = report.versions.filter(pk=serializer.validated_data["version_id"]).first()
        if version is None:
            return Response(
                {"version_id": ["This version does not belong to this report."]}, status=status.HTTP_400_BAD_REQUEST
            )
        with transaction.atomic():
            report.publish(version, request.user)
        return Response(ReportSerializer(report).data)
