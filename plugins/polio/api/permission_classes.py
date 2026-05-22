from rest_framework import permissions
from rest_framework.permissions import SAFE_METHODS

from plugins.polio.permissions import POLIO_CONFIG_PERMISSION, POLIO_PERMISSION


class PolioReadPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        polio = POLIO_PERMISSION
        polio_admin = POLIO_CONFIG_PERMISSION

        if request.method in SAFE_METHODS:
            can_read = (
                request.user
                and request.user.is_authenticated
                and (
                    (request.user.has_perm(polio.full_name()) or request.user.has_perm(polio_admin.full_name()))
                    or request.user.is_superuser
                )
            )
            return can_read
        return False
