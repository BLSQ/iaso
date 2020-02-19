from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS

from iaso.models import Project
from .common import TimestampField, ModelViewSet
from .auth.authentication import CsrfExemptSessionAuthentication


class HasProjectPermission(IsAuthenticated):
    """Rules:

    - The projects API is only accessible to authenticated users
    - Write operations are not allowed for now
    - Actions on specific projects can only be performed by users linked to the project account
    """

    def has_permission(self, request, view):
        if request.method not in SAFE_METHODS:  # write operations are not allowed for now
            return False

        return super().has_permission(request, view)

    def has_object_permission(self, request: Request, view, obj: Project):
        return request.user.iaso_profile.account == obj.account


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'name', 'app_id', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    created_at = TimestampField()
    updated_at = TimestampField()


class ProjectsViewSet(ModelViewSet):
    """Projects API: /api/projects/"""

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (HasProjectPermission,)
    serializer_class = ProjectSerializer
    results_key = "projects"

    def get_queryset(self):
        """Always filter the base queryset by account"""

        return Project.objects.filter(account=self.request.user.iaso_profile.account)
