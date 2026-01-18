from rest_framework import permissions

from iaso.permissions.core_permissions import (
    CORE_ORG_UNITS_CHANGE_REQUEST_CONFIGURATIONS_PERMISSION,
    CORE_ORG_UNITS_PERMISSION,
    CORE_SOURCE_WRITE_PERMISSION,
)


class DataSourceVersionsSynchronizationPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        return request.user.is_authenticated and all(
            [
                request.user.has_perm(CORE_SOURCE_WRITE_PERMISSION.full_name()),
                request.user.has_perm(CORE_ORG_UNITS_CHANGE_REQUEST_CONFIGURATIONS_PERMISSION.full_name()),
                request.user.has_perm(CORE_ORG_UNITS_PERMISSION.full_name()),
            ]
        )
