from rest_framework import permissions

from iaso.permissions.core_permissions import CORE_USERS_ADMIN_PERMISSION, CORE_USERS_MANAGED_PERMISSION


class HasUserPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()) or request.user.has_perm(
            CORE_USERS_MANAGED_PERMISSION.full_name()
        ):
            return True
        return False


def has_only_user_managed_permission(user):
    if not user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()) and user.has_perm(
        CORE_USERS_MANAGED_PERMISSION.full_name()
    ):
        return True
    return False
