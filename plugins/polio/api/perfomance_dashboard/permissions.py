from rest_framework import permissions

from plugins.polio.permissions import (
    POLIO_PERFORMANCE_ADMIN_PERMISSION,
    POLIO_PERFORMANCE_NON_ADMIN_PERMISSION,
    POLIO_PERFORMANCE_READ_ONLY_PERMISSION,
)


class HasPerformanceDashboardReadOnlyPermission(permissions.BasePermission):
    """
    Allows access for users with any of the logistics permissions.
    This is for read-only actions (list, retrieve).
    """

    def has_permission(self, request, view):
        return (
            request.user.has_perm(POLIO_PERFORMANCE_READ_ONLY_PERMISSION.full_name())
            or request.user.has_perm(POLIO_PERFORMANCE_NON_ADMIN_PERMISSION.full_name())
            or request.user.has_perm(POLIO_PERFORMANCE_ADMIN_PERMISSION.full_name())
        )


class HasPerformanceDashboardWritePermission(permissions.BasePermission):
    """
    Allows access for users with non-admin or admin logistics permissions.
    This is for write actions (create, update).
    """

    def has_permission(self, request, view):
        return request.user.has_perm(
            POLIO_PERFORMANCE_NON_ADMIN_PERMISSION.full_name()
        ) or request.user.has_perm(POLIO_PERFORMANCE_ADMIN_PERMISSION.full_name())


class HasPerformanceDashboardAdminPermission(permissions.BasePermission):
    """
    Allows access only for users with admin logistics permissions.
    This is for destructive actions (delete).
    """

    def has_permission(self, request, view):
        return request.user.has_perm(POLIO_PERFORMANCE_ADMIN_PERMISSION.full_name())
