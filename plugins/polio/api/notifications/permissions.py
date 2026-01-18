from rest_framework import permissions

from plugins.polio.permissions import POLIO_NOTIFICATIONS_PERMISSION


class HasNotificationPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.has_perm(POLIO_NOTIFICATIONS_PERMISSION.full_name())
