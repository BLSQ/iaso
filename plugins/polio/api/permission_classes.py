from rest_framework import permissions
from rest_framework.permissions import SAFE_METHODS

from plugins.polio import permissions as polio_permissions


class PolioReadPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        polio = polio_permissions.POLIO
        polio_admin = polio_permissions.POLIO_CONFIG

        if request.method in SAFE_METHODS:
            can_read = (
                request.user
                and request.user.is_authenticated
                and ((request.user.has_perm(polio) or request.user.has_perm(polio_admin)) or request.user.is_superuser)
            )
            return can_read
        return False
