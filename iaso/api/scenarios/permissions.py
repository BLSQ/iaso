from rest_framework.permissions import BasePermission

from iaso.permissions.core_permissions import CORE_WORKFLOW_PERMISSION


class HasScenarioPermission(BasePermission):
    """Scenarios simulate workflows: `iaso_workflows` for everything, for now (TODO a lighter permission for field
    implementers). A user without profile has no account, so no scenarios."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated or not hasattr(user, "iaso_profile"):
            return False
        return user.has_perm(CORE_WORKFLOW_PERMISSION.full_name())
