from rest_framework import permissions

from iaso.permissions.core_permissions import CORE_ORG_UNITS_PERMISSION


class FHIRLocationPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.has_perm(CORE_ORG_UNITS_PERMISSION.full_name())
