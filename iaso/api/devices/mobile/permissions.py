from typing import Optional

from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.views import APIView

from iaso.api.serializers import AppIdSerializer
from iaso.models import Project


class ProjectAuthenticationEnforcedPermission(permissions.BasePermission):
    def __init__(self, project: Optional[Project] = None, *args, **kwargs):
        self.project = project
        super().__init__(*args, **kwargs)

    def has_permission(self, request: Request, view: APIView):
        profile = getattr(request.user, "iaso_profile", None)
        account = getattr(profile, "account", None)
        try:
            project = self._get_project(request)
        except Project.DoesNotExist:
            return False

        return not project.needs_authentication or project.account == account

    def _get_project(self, request: Request) -> Project:
        if self.project is not None:
            return self.project
        app_id = AppIdSerializer(data=request.query_params).get_app_id(raise_exception=True)

        # We need to use `.get` otherwise we can't know why the user cannot access it.
        # Is the project really not found or not returned because they don't have access?
        return Project.objects.select_related("account").get(app_id=app_id)
