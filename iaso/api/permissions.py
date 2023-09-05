from operator import itemgetter

from django.conf import settings
from django.contrib.auth.models import Permission
from django.utils.translation import gettext as _
from rest_framework import viewsets, permissions
from rest_framework.response import Response

from hat.menupermissions.models import CustomPermissionSupport
from hat.menupermissions import models as p


class PermissionsViewSet(viewsets.ViewSet):
    f"""Permissions API

    This API is restricted to authenticated users. Note that only users with the "{p.USERS_ADMIN}" or
    "{p.USERS_MANAGED}" permission will be able to list all permissions - other users can only list their permissions.

    GET /api/permissions/
    """

    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def list(request):
        if request.user.has_perm(p.USERS_ADMIN) or request.user.has_perm(p.USERS_MANAGED):
            perms = Permission.objects
        else:
            perms = request.user.user_permissions

        perms = CustomPermissionSupport.filter_permissions(perms, settings)

        result = []
        for permission in perms:
            result.append({"id": permission.id, "name": _(permission.name), "codename": permission.codename})

        return Response({"permissions": sorted(result, key=itemgetter("name"))})
