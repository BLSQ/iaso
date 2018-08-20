from rest_framework.authentication import SessionAuthentication
from rest_framework import permissions


class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # To not perform the csrf check previously happening


class UserAccessPermission(permissions.BasePermission):
    def has_permission(self, request, view):  # type: ignore
        user = request.user
        return user and user.is_authenticated and \
            (user.is_superuser or user.has_perm('cases.view') or user.has_perm('quality.change_check'))