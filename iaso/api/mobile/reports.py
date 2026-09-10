from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_spectacular.utils import extend_schema
from rest_framework import filters, permissions, serializers

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
    url = serializers.CharField(read_only=True, source="published_version.file.url")


@extend_schema(tags=["Reports", "Mobile"])
class MobileReportsViewSet(ModelViewSet):
    """
    api/mobile/reports

    api/mobile/reports/id

    API to download a report. Reports are project linked.
    """

    results_key = "result"
    include_results_key_if_not_paginated = False
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return MobileReportSerializer

    def get_queryset(self):
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=False)
        if app_id:
            project = Project.objects.get_for_user_and_app_id(self.request.user, app_id)
            queryset = Report.objects.filter(project=project)
        else:
            queryset = Report.objects.filter(project__account=self.request.user.iaso_profile.account)
        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset
