from rest_framework import permissions

from plugins.polio import permissions as polio_permissions


class HasChronogramPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_perm(polio_permissions.POLIO_CHRONOGRAM)


class HasChronogramRestrictedWritePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_perm(
            polio_permissions.POLIO_CHRONOGRAM_RESTRICTED_WRITE
        )
