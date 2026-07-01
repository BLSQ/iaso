import csv

from datetime import datetime

from django.contrib.auth.models import User
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin
from rest_framework.response import Response

from hat.api_import.models import APIImport
from iaso.api.api_import.filters import APIImportFilterSet
from iaso.api.api_import.pagination import APIImportPagination
from iaso.api.api_import.permission import HasAccountManagementPermission
from iaso.api.api_import.serializers import APIImportFilterSerializer, APIImportSerializer
from iaso.api.common import CONTENT_TYPE_CSV
from iaso.models import Project


class APIImportViewSet(viewsets.GenericViewSet, ListModelMixin):
    CSV_HEADER_COLUMNS = [
        "Created At",
        "User Id",
        "User Name",
        "User First Name",
        "User Last Name",
        "Import Type",
        "JSON Body",
        "Headers",
        "Has Problem",
        "File",
        "App Id",
        "App Version",
        "Exception",
    ]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    permission_classes = [HasAccountManagementPermission]
    serializer_class = APIImportSerializer
    filterset_class = APIImportFilterSet
    pagination_class = APIImportPagination
    ordering_fields = ["created_at", "import_type", "user_id", "app_id", "app_version", "has_problem"]
    ordering = ["id"]  # default ordering

    def get_queryset(self):
        queryset = APIImport.objects.prefetch_related("user").all()
        user = self.request.user
        if not user.is_staff:
            queryset = queryset.filter(
                app_id__in=Project.objects.filter(account=user.iaso_profile.account)
                .only("app_id")
                .values_list("app_id")
            )
        return queryset

    @action(methods=["GET"], detail=False)
    def filters(self, request):
        queryset = APIImport.objects
        user = request.user
        if not user.is_staff:
            queryset = queryset.filter(
                app_id__in=Project.objects.filter(account=user.iaso_profile.account)
                .only("app_id")
                .values_list("app_id")
            )

        return Response(
            APIImportFilterSerializer(
                {
                    "users": User.objects.filter(id__in=queryset.distinct("user_id").values_list("user_id")),
                    "app_ids": queryset.distinct("app_id").values_list("app_id", flat=True),
                    "app_versions": queryset.distinct("app_version").values_list("app_version", flat=True),
                }
            ).data
        )

    @action(detail=False, methods=["get"])
    def export_to_csv(self, request):
        filename = "%s--%s" % ("api_imports", datetime.now().strftime("%Y-%m-%d"))

        filtered_request = APIImportFilterSet(request.GET, queryset=self.get_queryset()).qs

        response = HttpResponse(content_type=CONTENT_TYPE_CSV)
        writer = csv.writer(response)
        writer.writerow(self.CSV_HEADER_COLUMNS)

        for api_import in filtered_request.iterator(chunk_size=20):
            row = [
                api_import.created_at.strftime("%Y-%m-%d"),
                api_import.user.id,
                api_import.user.username,
                api_import.user.first_name,
                api_import.user.last_name,
                api_import.import_type,
                api_import.json_body,
                api_import.headers,
                api_import.has_problem,
                api_import.file,
                api_import.app_id,
                api_import.app_version,
                api_import.exception,
            ]
            writer.writerow(row)
        filename = filename + ".csv"
        response["Content-Disposition"] = "attachment; filename=" + filename
        return response
