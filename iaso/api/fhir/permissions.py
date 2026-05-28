from rest_framework import permissions

from iaso.permissions.core_permissions import CORE_ORG_UNITS_PERMISSION, CORE_ORG_UNITS_READ_PERMISSION


class FHIRLocationPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return any(
            request.user.has_perm(perm.full_name())
            for perm in (CORE_ORG_UNITS_PERMISSION, CORE_ORG_UNITS_READ_PERMISSION)
        )
