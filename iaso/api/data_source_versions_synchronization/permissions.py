from rest_framework import permissions

from hat.menupermissions import models as iaso_permission


class DataSourceVersionsSynchronizationPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        return request.user.is_authenticated and request.user.has_perm(iaso_permission.SOURCE_WRITE)