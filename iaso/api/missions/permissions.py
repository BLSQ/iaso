from rest_framework import permissions

from iaso.permissions.core_permissions import CORE_MISSION_READ_PERMISSION, CORE_MISSION_WRITE_PERMISSION


class MissionPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        if request.method in permissions.SAFE_METHODS:
            return request.user.has_perm(CORE_MISSION_READ_PERMISSION.full_name())

        return request.user.has_perm(CORE_MISSION_WRITE_PERMISSION.full_name())
