from operator import itemgetter

from django.conf import settings
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import gettext as _
from rest_framework import viewsets, permissions
from rest_framework.response import Response

from hat.menupermissions.models import CustomPermissionSupport


class PermissionsViewSet(viewsets.ViewSet):
    """Permissions API

    This API is restricted to authenticated users. Note that only users with the "menupermissions.iaso_users"
    permission will be able to list all permissions - other users can only list their permissions.

    GET /api/permissions/
    """

    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        content_type = ContentType.objects.get_for_model(CustomPermissionSupport)

        if request.user.has_perm("menupermissions.iaso_users"):
            perms = Permission.objects
        else:
            perms = request.user.user_permissions

        perms = (
            perms.filter(content_type=content_type)
            .filter(codename__startswith="iaso_")
            .exclude(codename__contains="datastore")
            .order_by("id")
        )
        #  in future filter this on a feature flags, so we can disable it by account
        if "polio" not in settings.PLUGINS:
            perms = perms.exclude(codename__startswith="iaso_polio")

        result = []
        for permission in perms:
            result.append({"id": permission.id, "name": _(permission.name), "codename": permission.codename})

        return Response({"permissions": sorted(result, key=itemgetter("name"))})
