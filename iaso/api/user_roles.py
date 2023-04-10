from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions
from django.contrib.auth.models import Group, Permission
from django.forms.models import model_to_dict
from rest_framework.response import Response


class HasRolesPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.has_perm("menupermissions.iaso_user_roles"):
            return False
        return True


class UserRolesViewSet(viewsets.ViewSet):
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

    def get_queryset(self):
        return Group.objects.all()

    def list(self, request):
        # limit = request.GET.get("limit", None)
        # page_offset = request.GET.get("page", 1)
        # orders = request.GET.get("order", "name").split(",")
        # search = request.GET.get("search", None)
        queryset = self.get_queryset()
        return Response({"userroles": [model_to_dict(userRole, fields=["id", "name"]) for userRole in queryset]})

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        userRole = get_object_or_404(self.get_queryset(), pk=pk)
        return Response(model_to_dict(userRole, fields=["id", "name"]))

    def partial_update(self, request, pk=None):
        userRole = get_object_or_404(self.get_queryset(), id=pk)
        permissions = request.data.get("permissions", [])
        userRole.permissions.clear()
        for permission_codename in permissions:
            permission = get_object_or_404(Permission, codename=permission_codename)
            userRole.permissions.add(permission)
        userRole.save()
        return Response(model_to_dict(userRole, fields=["id", "name"]))

    def delete(self, request, pk=None):
        return None
