from rest_framework.permissions import IsAuthenticated
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
