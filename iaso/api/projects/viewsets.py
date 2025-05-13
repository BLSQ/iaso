from django.http import HttpResponse
from qr_code.qrcode.maker import make_qr_code_image
from qr_code.qrcode.utils import QRCodeOptions
from rest_framework import filters, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from hat.menupermissions import models as permission
from iaso.models import Project

from ..common import ModelViewSet
from .serializers import ProjectSerializer


class ProjectsViewSet(ModelViewSet):
    """Projects API

    This API is restricted to authenticated users.

    GET /api/projects/
    GET /api/projects/<id>
    GET /api/projects/list_all/
    """

    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["app_id", "name"]
    serializer_class = ProjectSerializer
    results_key = "projects"
    http_method_names = ["get", "head", "options", "trace"]

    def get_queryset(self, filter_on_user_projects=True):
        # Always filter the base queryset by account.
        projects = Project.objects.filter(account=self.request.user.iaso_profile.account)

        if filter_on_user_projects:
            projects = projects.filter_on_user_projects(self.request.user)

        return projects

    @action(detail=True, methods=["get"])
    def qr_code(self, request, *args, **kwargs):
        """Returns the qrcode image to configure the mobile application."""
        project = self.get_object()
        return HttpResponse(
            status=status.HTTP_200_OK,
            content_type="image/png",
            content=make_qr_code_image(
                data='{"url": "' + request.build_absolute_uri("/") + '", "app_id": "' + project.app_id + '"}',
                qr_code_options=QRCodeOptions(size="S", image_format="png", error_correction="L"),
            ),
        )

    @action(detail=False, methods=["get"])
    def list_all(self, request):
        """
        List all projects by skipping restrictions.
        """
        if not request.user.has_perm(permission.USERS_ADMIN):
            raise PermissionDenied(f"{permission.USERS_ADMIN} permission is required.")

        projects = self.filter_queryset(self.get_queryset(filter_on_user_projects=False))

        page = self.paginate_queryset(projects)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)
