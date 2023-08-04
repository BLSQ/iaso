from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, permissions
from rest_framework import serializers
from rest_framework.pagination import LimitOffsetPagination

from iaso.api.common import ModelViewSet, HasPermission
from iaso.models import Report
from hat.menupermissions import models as permission


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["id", "name", "published_version", "project", "created_at", "updated_at"]

    published_version = serializers.CharField(read_only=True, source="published_version.name")


class ReportsViewSet(ModelViewSet):
    """
    api/reports

    api/reports/id

    API to download a report. Reports are project linked.
    """

    results_key = "result"
    remove_results_key_if_paginated = True
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.REPORTS)]  # type: ignore
    pagination_class = LimitOffsetPagination

    def get_serializer_class(self):
        return ReportSerializer

    def get_queryset(self):
        search = self.request.query_params.get("search", None)
        queryset = Report.objects.filter(project__account=self.request.user.iaso_profile.account)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, args, kwargs)
        report_id = kwargs.get("pk")
        report = get_object_or_404(Report, pk=report_id)
        response.data["url"] = report.published_version.file.url
        response.data["status"] = report.published_version.status

        return response
