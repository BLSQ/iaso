from rest_framework import permissions


class UserAccessPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return user and user.is_authenticated() and \
            (user.is_superuser or user.has_perm('cases.view'))
