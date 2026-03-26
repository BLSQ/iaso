from rest_framework.permissions import BasePermission

from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION


class HasValidationWorkflowPermission(BasePermission):
    def has_permission(self, request, view):

        if request.method in ["HEAD", "OPTIONS"]:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return request.user.has_perm(CORE_VALIDATION_WORKFLOW_PERMISSION.full_name())
