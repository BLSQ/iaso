from rest_framework import viewsets, permissions
from rest_framework.response import Response

from hat.menupermissions import models as permission
from iaso.models import DeviceOwnership
from .common import HasPermission


class DevicesOwnershipViewSet(viewsets.ViewSet):
    f"""Iaso Devices ownership API

    This API is restricted to authenticated users having the "{permission.FORMS}" or "{permission.SUBMISSIONS}" permissions.

    GET /api/devicesownerships/
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(permission.FORMS, permission.SUBMISSIONS),  # type: ignore
    ]

    def list(self, request):
        queryset = DeviceOwnership.objects.all()

        return Response({"devicesownership": [ownerShip.as_dict() for ownerShip in queryset]})
