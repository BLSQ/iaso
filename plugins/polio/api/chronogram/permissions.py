from rest_framework import permissions

from hat.menupermissions import models as iaso_permission


class HasChronogramPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_perm(iaso_permission.POLIO_CHRONOGRAM)


class HasChronogramRestrictedWritePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_perm(
            iaso_permission.POLIO_CHRONOGRAM_RESTRICTED_WRITE
        )
