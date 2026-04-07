from rest_framework.permissions import BasePermission

from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION


class HasValidationNodeTemplatePermission(BasePermission):
    def has_permission(self, request, view):
        if request.method in ["HEAD", "OPTIONS"]:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.has_perm(CORE_VALIDATION_WORKFLOW_PERMISSION.full_name())


class HasAccountFeatureFlag(BasePermission):
    def has_permission(self, request, view):
        return request.user.iaso_profile.account.feature_flags.filter(code="SUBMISSION_VALIDATION_WORKFLOW").exists()
