from typing import Optional

from rest_framework import permissions, request
from rest_framework.permissions import SAFE_METHODS, IsAuthenticated
from rest_framework.views import APIView

from iaso.api.serializers import AppIdSerializer
from iaso.models import Project
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_SUBMISSIONS_PERMISSION


class HasDevicePermission(IsAuthenticated):
    def has_permission(self, request: request.Request, view: APIView) -> bool:
        if not super().has_permission(request, view):
            return False
        user = request.user
        return user.has_perm(CORE_FORMS_PERMISSION.full_name()) or user.has_perm(
            CORE_SUBMISSIONS_PERMISSION.full_name()
        )


class GetAndListRequiresAuth(IsAuthenticated):
    def has_permission(self, request: request.Request, view: APIView):
        if self._is_read(request):
            return super().has_permission(request, view)
        return True

    @staticmethod
    def _is_read(request):
        return request.method in SAFE_METHODS


class ProjectAuthenticationEnforcedPermission(permissions.BasePermission):
    def __init__(self, project: Optional[Project] = None, *args, **kwargs):
        self.project = project
        super().__init__(*args, **kwargs)

    def has_permission(self, request: request.Request, view: APIView):
        profile = getattr(request.user, "iaso_profile", None)
        user_account = getattr(profile, "account", None)
        try:
            project = self._get_project(request)
        except Project.DoesNotExist:
            return False

        return not project.needs_authentication or (request.user.is_authenticated and project.account == user_account)

    def _get_project(self, request: request.Request):
        if self.project is not None:
            return self.project
        app_id = AppIdSerializer(data=request.query_params).get_app_id(raise_exception=True)
        return Project.objects.get(app_id=app_id)
