from rest_framework import permissions

from iaso.permissions.core_permissions import CORE_ACCOUNT_MANAGEMENT_PERMISSION


class HasAccountManagementPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm(CORE_ACCOUNT_MANAGEMENT_PERMISSION.full_name())
