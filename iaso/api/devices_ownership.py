from rest_framework import permissions, viewsets
from rest_framework.response import Response

import iaso.permissions as core_permissions

from iaso.models import DeviceOwnership

from .common import HasPermission


class DevicesOwnershipViewSet(viewsets.ViewSet):
    f"""Iaso Devices ownership API

    This API is restricted to authenticated users having the "{core_permissions.FORMS}" or "{core_permissions.SUBMISSIONS}" permissions.

    GET /api/devicesownerships/
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(core_permissions.FORMS, core_permissions.SUBMISSIONS),  # type: ignore
    ]

    def list(self, request):
        queryset = DeviceOwnership.objects.all()

        return Response({"devicesownership": [ownerShip.as_dict() for ownerShip in queryset]})
