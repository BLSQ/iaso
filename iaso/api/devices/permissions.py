from rest_framework.permissions import SAFE_METHODS, IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView

from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_SUBMISSIONS_PERMISSION


class HasDevicePermission(IsAuthenticated):
    def has_permission(self, request: Request, view: APIView) -> bool:
        if not super().has_permission(request, view):
            return False
        user = request.user
        return user.has_perm(CORE_FORMS_PERMISSION.full_name()) or user.has_perm(
            CORE_SUBMISSIONS_PERMISSION.full_name()
        )


class GetAndListRequiresAuth(IsAuthenticated):
    def has_permission(self, request, view):
        if self._is_read(request):
            return super().has_permission(request, view)
        return True

    @staticmethod
    def _is_read(request):
        return request.method in SAFE_METHODS
