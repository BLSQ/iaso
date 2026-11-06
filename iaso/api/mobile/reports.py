from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_spectacular.utils import extend_schema
from rest_framework import filters, permissions, serializers
from rest_framework.exceptions import NotFound

from iaso.api.common import ModelViewSet, TimestampField
from iaso.api.serializers import AppIdSerializer
from iaso.models import Project, Report


class MobileReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["name", "url", "version_id", "version_name", "created_at", "updated_at"]

    created_at = TimestampField()
    updated_at = TimestampField()

    version_name = serializers.CharField(read_only=True, source="published_version.name")
    version_id = serializers.IntegerField(read_only=True, source="published_version.id")
    url = serializers.SerializerMethodField()

    def get_url(self, obj: Report) -> str:
        # The app downloads this URL as is: with a local file storage the URL is relative.
        url = obj.published_version.file.url
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request and url.startswith("/") else url


@extend_schema(tags=["Mobile"])
class MobileReportsViewSet(ModelViewSet):
    """
    api/mobile/reports

    api/mobile/reports/id

    API to download a report. Reports are project linked.

    Only the reports whose version is published are returned, the most recently updated first:
    the mobile app downloads the first one.
    """

    results_key = "result"
    include_results_key_if_not_paginated = False
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    permission_classes = [permissions.IsAuthenticated]
    # Read-only: reports are managed through /api/reports/, which requires the reports permission.
    http_method_names = ["get", "head", "options"]

    def get_serializer_class(self):
        return MobileReportSerializer

    def get_queryset(self):
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=False)
        if app_id:
            try:
                project = Project.objects.get_for_user_and_app_id(self.request.user, app_id)
            except Project.DoesNotExist:
                raise NotFound(f"No project found for app_id {app_id}")
            queryset = Report.objects.filter(project=project)
        else:
            queryset = Report.objects.filter(project__account=self.request.user.iaso_profile.account)
        queryset = queryset.filter(
            published_version__status="published", published_version__deleted_at__isnull=True
        ).select_related("published_version")
        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset.order_by("-updated_at", "-id")
