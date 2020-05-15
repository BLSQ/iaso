from rest_framework import serializers, permissions

from .common import TimestampField, ModelViewSet, HasPermission
from iaso.models import Project


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "app_id",
            "created_at",
            "updated_at",
            "needs_authentication",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)


class ProjectsViewSet(ModelViewSet):
    """Source versions API

    This API is restricted to authenticated users having the "menupermissions.iaso_forms" permission

    GET /api/projects/
    GET /api/projects/<id>
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission("menupermissions.iaso_forms"),
    ]
    serializer_class = ProjectSerializer
    results_key = "projects"
    http_method_names = ["get", "head", "options", "trace"]

    def get_queryset(self):
        """Always filter the base queryset by account"""

        return Project.objects.filter(account=self.request.user.iaso_profile.account)
