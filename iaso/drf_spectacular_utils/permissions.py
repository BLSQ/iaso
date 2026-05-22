from rest_framework import permissions


class HasAccountAndProfile(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if not getattr(user, "iaso_profile", None):
            return False

        if not getattr(user.iaso_profile, "account", None):
            return False

        return True
