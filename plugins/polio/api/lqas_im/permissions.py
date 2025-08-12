from rest_framework import permissions

from plugins.polio import permissions as polio_permissions


class HasPolioPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.has_perm(polio_permissions.POLIO) or request.user.is_superuser
        )


class HasPolioAdminPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.has_perm(polio_permissions.POLIO_CONFIG) or request.user.is_superuser
        )
