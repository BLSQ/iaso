from rest_framework import permissions

from hat.menupermissions import models as permission


class FHIRLocationPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.has_perm(permission.ORG_UNITS)
