from rest_framework import permissions

from iaso.permissions.core_permissions import CORE_DATASTORE_READ_PERMISSION, CORE_DATASTORE_WRITE_PERMISSION


class DataStorePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        read_perm = CORE_DATASTORE_READ_PERMISSION
        write_perm = CORE_DATASTORE_WRITE_PERMISSION

        if request.method == "GET":
            can_get = (
                request.user and request.user.is_authenticated and request.user.has_perm(read_perm.full_name())
            ) or request.user.is_superuser
            return can_get
        if request.method == "POST" or request.method == "PUT" or request.method == "DELETE":
            can_post = (
                request.user and request.user.is_authenticated and request.user.has_perm(write_perm.full_name())
            ) or request.user.is_superuser
            return can_post
        return False
