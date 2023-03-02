from rest_framework import viewsets, permissions
from rest_framework.response import Response

from iaso.models import DeviceOwnership
from .common import HasPermission


class DevicesOwnershipViewSet(viewsets.ViewSet):
    """Iaso Devices ownership API

    This API is restricted to authenticated users having the "menupermissions.iaso_forms" or "menupermissions.iaso_submissions" permissions.

    GET /api/devicesownerships/
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission("menupermissions.iaso_forms", "menupermissions.iaso_submissions"),  # type: ignore
    ]

    def list(self, request):
        queryset = DeviceOwnership.objects.all()

        return Response({"devicesownership": [ownerShip.as_dict() for ownerShip in queryset]})
