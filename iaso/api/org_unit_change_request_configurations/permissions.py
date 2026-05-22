from rest_framework import permissions

from iaso.permissions.core_permissions import CORE_ORG_UNITS_CHANGE_REQUEST_CONFIGURATIONS_PERMISSION


class HasOrgUnitsChangeRequestConfigurationReadPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated


class HasOrgUnitsChangeRequestConfigurationFullPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        return request.user.is_authenticated and request.user.has_perm(
            CORE_ORG_UNITS_CHANGE_REQUEST_CONFIGURATIONS_PERMISSION.full_name()
        )
