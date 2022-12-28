from iaso.api.common import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, permissions
from rest_framework import serializers
from iaso.models import Report


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["name", "published_version", "project"]


class MobileReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["name", "url", "version_id", "created_at", "updated_at", "version_name"]

        def get_version_id(self):
            return


class ReportsViewSet(ModelViewSet):
    results_key = "result"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return ReportSerializer

    def get_queryset(self):
        search = self.request.query_params.get("search", None)
        queryset = Report.objects.filter(project__acount=self.request.user.iaso_profile.account)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset


class MobileReportViewSet(ModelViewSet):
    serializer_class = MobileReportSerializer
    results_key = "workflows"

    pagination_class = None
    paginator = None


