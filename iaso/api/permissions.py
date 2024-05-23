from operator import itemgetter

from django.conf import settings
from django.contrib.auth.models import Permission
from django.utils.translation import gettext as _
from hat.menupermissions.constants import PERMISSIONS_PRESENTATION
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
        perms = self.queryset(request)
        result = {}
        for group in PERMISSIONS_PRESENTATION.keys():
            result[group] = []
            for permission in perms.filter(codename__in=PERMISSIONS_PRESENTATION[group]):
                result[group].append({"id": permission.id, "name": _(permission.name), "codename": permission.codename})

        return Response({"permissions": result})

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
