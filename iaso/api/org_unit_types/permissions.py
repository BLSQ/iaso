from rest_framework import permissions

from iaso.permissions.core_permissions import CORE_ORG_UNITS_TYPES_PERMISSION


class HasOrgUnitTypeWritePermission(permissions.BasePermission):
    """
    Write (POST, PUT, PATCH, DELETE): CORE_ORG_UNITS_TYPES_PERMISSION, or staff/superuser.
    Read: not restricted (handled by IsAuthenticatedOrReadOnlyWhenNoAuthenticationRequired).
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.has_perm(CORE_ORG_UNITS_TYPES_PERMISSION.full_name())
