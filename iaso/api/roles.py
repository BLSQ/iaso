from rest_framework import viewsets, permissions


class HasRolesPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.has_perm("menupermissions.iaso_user_roles"):
            return False
        return True


class RolesViewSet(viewsets.ViewSet):
    """Roles API

    This API is restricted to authenticated users having the "menupermissions.iaso_user_roles" permission for write permission
    Read access is accessible to any authenticated users as it necessary to list roles or display a particular one in
    the interface.

    GET /api/roles/
    GET /api/roles/<id>
    PATCH /api/roles/<id>
    DELETE /api/roles/<id>
    """

    # FIXME : replace by a model viewset

    permission_classes = [permissions.IsAuthenticated, HasRolesPermission]

    def list(self, request):
        return None

    def retrieve(self, request, *args, **kwargs):
        return None

    def partial_update(self, request, pk=None):
        return None

    def delete(self, request, pk=None):
        return None
