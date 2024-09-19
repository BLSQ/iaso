from operator import itemgetter

from django.conf import settings
from django.contrib.auth.models import Permission
from django.utils.translation import gettext as _
from hat.menupermissions.constants import PERMISSIONS_PRESENTATION, READ_EDIT_PERMISSIONS
from iaso.utils.module_permissions import account_module_permissions
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action

from hat.menupermissions.models import CustomPermissionSupport
from hat.menupermissions import models as p


class PermissionsViewSet(viewsets.ViewSet):
    f"""Permissions API

    This API is restricted to authenticated users. Note that only users with the "{p.USERS_ADMIN}" or
    "{p.USERS_MANAGED}" permission will be able to list all permissions - other users can only list their permissions.

    GET /api/permissions/
    """

    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        perms = self.queryset(request)

        result = []
        for permission in perms:
            result.append({"id": permission.id, "name": _(permission.name), "codename": permission.codename})

        return Response({"permissions": sorted(result, key=itemgetter("name"))})

    @action(methods=["GET"], detail=False)
    def grouped_permissions(self, request):
        permissions_queryset = self.queryset(request)
        grouped_permissions = self.get_grouped_permissions(permissions_queryset)

        return Response({"permissions": grouped_permissions})

    def get_grouped_permissions(self, permissions_queryset):
        grouped_permissions = {}
        for group_name, permission_codenames in PERMISSIONS_PRESENTATION.items():
            group_permissions = self.get_permissions_for_group(permissions_queryset, permission_codenames)
            if group_permissions:
                grouped_permissions[group_name] = group_permissions

        return grouped_permissions

    def get_permissions_for_group(self, permissions_queryset, permission_codenames):
        filtered_permissions = permissions_queryset.filter(codename__in=permission_codenames)
        if not filtered_permissions:
            return None
        read_edit_permissions = list(READ_EDIT_PERMISSIONS.keys())
        permissions = []
        for permission in filtered_permissions:
            perm = [item for item in read_edit_permissions if permission.codename in item]
            if perm:
                perm = perm[0]
                in_permissions = [item for item in permissions if perm == item["codename"]]
                if not in_permissions:
                    permissions.append(
                        {
                            "id": permission.id,
                            "name": _(perm),
                            "codename": perm,
                            "read_edit": READ_EDIT_PERMISSIONS[perm],
                        }
                    )
            else:
                permissions.append({"id": permission.id, "name": _(permission.name), "codename": permission.codename})

        return permissions

    def queryset(self, request):
        if request.user.has_perm(p.USERS_ADMIN) or request.user.has_perm(p.USERS_MANAGED):
            perms = Permission.objects
        else:
            perms = request.user.user_permissions

        account = request.user.iaso_profile.account
        account_modules = account.modules if account.modules else []

        # Get all permissions linked to the modules
        modules_permissions = account_module_permissions(account_modules)

        return CustomPermissionSupport.filter_permissions(perms, modules_permissions, settings)
