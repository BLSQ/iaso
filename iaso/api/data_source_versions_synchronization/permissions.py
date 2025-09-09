from rest_framework import permissions

import iaso.permissions as core_permissions


class DataSourceVersionsSynchronizationPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        return request.user.is_authenticated and all(
            [
                request.user.has_perm(core_permissions.SOURCE_WRITE),
                request.user.has_perm(core_permissions.ORG_UNITS_CHANGE_REQUEST_CONFIGURATIONS),
                request.user.has_perm(core_permissions.ORG_UNITS),
            ]
        )
