from rest_framework import permissions

from iaso.permissions.core_permissions import CORE_PLANNING_READ_PERMISSION, CORE_PLANNING_WRITE_PERMISSION


WRITE_ACTIONS = ("assign", "unassign")


class HasPlanningPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if view.action in WRITE_ACTIONS:
            return user.has_perm(CORE_PLANNING_WRITE_PERMISSION.full_name())

        return user.has_perm(CORE_PLANNING_READ_PERMISSION.full_name())
