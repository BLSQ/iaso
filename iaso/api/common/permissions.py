from django.utils.translation import gettext_lazy as _
from rest_framework import permissions


# Typing: it seems quite hard to type this, so I'm not doing it for now. Use "type: ignore" comment to silence mypy
class HasPermission:
    """
    Permission class factory for simple permission checks.

    If the user has any of the provided permissions, he will be granted access

    Usage:

    > class SomeViewSet(viewsets.ViewSet):
    >     permission_classes=[HasPermission("perm_1", "perm_2)]
    >     ...
    """

    def __init__(self, *perms):
        class PermissionClass(permissions.BasePermission):
            def has_permission(self, request, view):
                return request.user and any(request.user.has_perm(perm.full_name()) for perm in perms)

        self._permission_class = PermissionClass

    def __call__(self, *args, **kwargs) -> permissions.BasePermission:
        return self._permission_class()


class ReadOnlyOrHasPermission:
    """
    Permission class factory for simple permission checks.

    Grant read only access to all and need permission to edit

    Usage:

    > class SomeViewSet(viewsets.ViewSet):
    >     permission_classes=[HasPermission("perm_1", "perm_2)]
    >     ...
    """

    def __init__(self, *perms):
        class PermissionClass(permissions.BasePermission):
            def has_permission(self, request, view):
                if request.method in permissions.SAFE_METHODS:
                    return True

                return request.user and any(request.user.has_perm(perm.full_name()) for perm in perms)

        self._permission_class = PermissionClass

    def __call__(self, *args, **kwargs):
        return self._permission_class()


class IsAdminOrSuperUser(permissions.BasePermission):
    """
    Allows access only to admin users.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff) or (request.user and request.user.is_superuser)


class IsAdminOrSuperUserWithIasoProfile(IsAdminOrSuperUser):
    """
    Allows access only to admin users with a `iaso_profile`.
    """

    def has_permission(self, request, view):
        return super().has_permission(request, view) and hasattr(request.user, "iaso_profile")


class GenericReadWritePerm(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            can_get = (
                request.user and request.user.is_authenticated and request.user.has_perm(self.read_perm.full_name())
            ) or request.user.is_superuser
            return can_get
        if (
            request.method == "POST"
            or request.method == "PUT"
            or request.method == "PATCH"
            or request.method == "DELETE"
        ):
            can_post = (
                request.user and request.user.is_authenticated and request.user.has_perm(self.write_perm.full_name())
            ) or request.user.is_superuser
            return can_post
        return False


class HasModulePermission:
    def __init__(self, *modules):
        class PermissionClass(permissions.BasePermission):
            message = _("The related module(s) are not activated for your account.")

            def has_permission(self, request, view):
                if not request.user or not request.user.is_authenticated:
                    return False

                if not getattr(request.user, "iaso_profile", None):
                    return False

                if modules:
                    account = request.user.iaso_profile.account
                    account_modules = set([x for x in getattr(account, "modules", [])])
                    return set([module.codename for module in modules]).issubset(account_modules)

                return True

        self._permission_class = PermissionClass

    def __call__(self, *args, **kwargs):
        return self._permission_class()
