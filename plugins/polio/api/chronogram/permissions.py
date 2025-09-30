from rest_framework import permissions

from plugins.polio.permissions import POLIO_CHRONOGRAM_PERMISSION, POLIO_CHRONOGRAM_RESTRICTED_WRITE_PERMISSION


class HasChronogramPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_perm(POLIO_CHRONOGRAM_PERMISSION.full_name())


class HasChronogramRestrictedWritePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_perm(
            POLIO_CHRONOGRAM_RESTRICTED_WRITE_PERMISSION.full_name()
        )
