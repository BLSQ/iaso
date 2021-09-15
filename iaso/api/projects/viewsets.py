from rest_framework import filters, permissions

from iaso.models import Project
from .serializers import ProjectSerializer
from ..common import ModelViewSet, HasPermission


class ProjectsViewSet(ModelViewSet):
    """Projects API

    This API is restricted to authenticated users having the "menupermissions.iaso_forms" permission

    GET /api/projects/
    GET /api/projects/<id>
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_forms")]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["app_id", "name"]
    serializer_class = ProjectSerializer
    results_key = "projects"
    http_method_names = ["get", "head", "options", "trace"]

    def get_queryset(self):
        """Always filter the base queryset by account"""

        return Project.objects.filter(account=self.request.user.iaso_profile.account)
