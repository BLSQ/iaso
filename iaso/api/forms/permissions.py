from rest_framework import permissions

from iaso.api.permission_checks import IsAuthenticatedOrReadOnlyWhenNoAuthenticationRequired
from iaso.models import Form
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION


class HasFormPermission(IsAuthenticatedOrReadOnlyWhenNoAuthenticationRequired):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return super().has_permission(request, view)

        return request.user.is_authenticated and request.user.has_perm(CORE_FORMS_PERMISSION.full_name())

    def has_object_permission(self, request, view, obj):
        if not self.has_permission(request, view):
            return False
        return (
            Form.objects_include_deleted.filter_for_user_and_app_id(request.user, request.query_params.get("app_id"))
            .filter(id=obj.id)
            .exists()
        )
