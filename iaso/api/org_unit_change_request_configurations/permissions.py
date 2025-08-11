from rest_framework import permissions

import iaso.permissions as core_permissions


class HasOrgUnitsChangeRequestConfigurationReadPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated


class HasOrgUnitsChangeRequestConfigurationFullPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        return request.user.is_authenticated and request.user.has_perm(
            core_permissions.ORG_UNITS_CHANGE_REQUEST_CONFIGURATIONS
        )
