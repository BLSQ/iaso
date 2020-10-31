from rest_framework import viewsets, permissions
from rest_framework.response import Response

from .common import HasPermission
from iaso.models import DeviceOwnership


class DevicesOwnershipViewSet(viewsets.ViewSet):
    """Iaso Devices ownership API

    This API is restricted to authenticated users having the "menupermissions.iaso_forms" permission

    GET /api/devicesownership/
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_forms")]

    def list(self, request):
        queryset = DeviceOwnership.objects.all()

        return Response({"devicesownership": [ownerShip.as_dict() for ownerShip in queryset]})
