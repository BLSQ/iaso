from rest_framework import permissions
from rest_framework.request import Request

from iaso.api.permission_checks import AuthenticationEnforcedPermission
from iaso.models import Instance
from iaso.permissions.core_permissions import (
    CORE_FORMS_PERMISSION,
    CORE_REGISTRY_READ_PERMISSION,
    CORE_REGISTRY_WRITE_PERMISSION,
    CORE_SUBMISSIONS_PERMISSION,
)


class HasInstancePermission(permissions.BasePermission):
    def has_permission(self, request: Request, view):
        if request.method == "POST":  # to handle anonymous submissions sent by mobile
            return True

        return request.user.is_authenticated and (
            request.user.has_perm(CORE_FORMS_PERMISSION.full_name())
            or request.user.has_perm(CORE_SUBMISSIONS_PERMISSION.full_name())
            or request.user.has_perm(CORE_REGISTRY_WRITE_PERMISSION.full_name())
            or request.user.has_perm(CORE_REGISTRY_READ_PERMISSION.full_name())
        )

    def has_object_permission(self, request: Request, view, obj: Instance):
        # Depends on the Queryset having been filtered previously
        self.has_permission(request, view)
        if request.method in permissions.SAFE_METHODS:
            return True
        # if request.user.has_perm("menupermission.iaso_update_submission") and obj.can_user_modify(request.user):
        if obj.can_user_modify(request.user):
            return True
        return False


class HasInstanceETLPermission(permissions.BasePermission):
    def has_permission(self, request: Request, view):
        if request.user.is_authenticated and request.user.is_superuser:
            return True

        return request.user.is_authenticated and (
            request.user.has_perm(CORE_FORMS_PERMISSION.full_name())
            or request.user.has_perm(CORE_SUBMISSIONS_PERMISSION.full_name())
            or request.user.has_perm(CORE_REGISTRY_WRITE_PERMISSION.full_name())
            or request.user.has_perm(CORE_REGISTRY_READ_PERMISSION.full_name())
        )


class HasInstanceBulkPermission(permissions.BasePermission):
    """
    Designed for POST endpoints that are not designed to receive new submissions.
    """

    def has_permission(self, request: Request, view):
        return request.user.is_authenticated and (
            request.user.has_perm(CORE_FORMS_PERMISSION.full_name())
            or request.user.has_perm(CORE_SUBMISSIONS_PERMISSION.full_name())
            or request.user.has_perm(CORE_REGISTRY_WRITE_PERMISSION.full_name())
            or request.user.has_perm(CORE_REGISTRY_READ_PERMISSION.full_name())
        )


PERMISSION_CLASSES_RW = [AuthenticationEnforcedPermission, permissions.IsAuthenticated, HasInstancePermission]
