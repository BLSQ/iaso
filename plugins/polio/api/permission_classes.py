from hat.menupermissions import models as menu_permissions
from rest_framework.permissions import SAFE_METHODS
from rest_framework import permissions


class PolioReadPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        polio = menu_permissions.POLIO
        polio_admin = menu_permissions.POLIO_CONFIG

        if request.method in SAFE_METHODS:
            can_read = (
                request.user
                and request.user.is_authenticated
                and ((request.user.has_perm(polio) or request.user.has_perm(polio_admin)) or request.user.is_superuser)
            )
            return can_read
        else:
            return False
