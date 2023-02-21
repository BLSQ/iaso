from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, permissions
from rest_framework import serializers

from iaso.api.common import ModelViewSet, TimestampField
from iaso.models import Report


class MobileReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["name", "url", "version_id", "version_name", "created_at", "updated_at"]

    created_at = TimestampField()
    updated_at = TimestampField()

    version_name = serializers.CharField(read_only=True, source="published_version.name")
    version_id = serializers.IntegerField(read_only=True, source="published_version.id")
    url = serializers.CharField(read_only=True, source="published_version.file.url")


class MobileReportsViewSet(ModelViewSet):
    """
    api/mobile/reports

    api/mobile/reports/id

    API to download a report. Reports are project linked.
    """

    results_key = "result"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return MobileReportSerializer

    def get_queryset(self):
        search = self.request.query_params.get("search", None)
        queryset = Report.objects.filter(project__account=self.request.user.iaso_profile.account)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset
