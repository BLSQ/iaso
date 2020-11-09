from rest_framework import permissions

from ..common import ModelViewSet, HasPermission
from .serializers import ProjectSerializer
from iaso.models import Project


class ProjectsViewSet(ModelViewSet):
    """Projects API

    This API is restricted to authenticated users having the "menupermissions.iaso_forms" permission

    GET /api/projects/
    GET /api/projects/<id>
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_forms")]
    serializer_class = ProjectSerializer
    results_key = "projects"
    http_method_names = ["get", "head", "options", "trace"]

    def get_queryset(self):
        """Always filter the base queryset by account"""

        return Project.objects.filter(account=self.request.user.iaso_profile.account)
