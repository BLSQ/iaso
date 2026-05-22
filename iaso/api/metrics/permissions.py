from rest_framework import permissions

from iaso.permissions.core_permissions import CORE_METRIC_TYPES_PERMISSION


class MetricsPermissions(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True

        return user.has_perm(CORE_METRIC_TYPES_PERMISSION.full_name())
