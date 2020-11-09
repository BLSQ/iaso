from rest_framework import viewsets, permissions
from rest_framework.response import Response

from .common import HasPermission
from iaso.models import Device


class DevicesViewSet(viewsets.ViewSet):
    """Iaso Devices API

    This API is restricted to authenticated users having the "menupermissions.iaso_forms" permission

    GET /api/devices/
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_forms")]

    def list(self, request):
        queryset = Device.objects.all()
        profile = request.user.iaso_profile
        queryset = queryset.filter(projects__account=profile.account)

        return Response({"devices": [device.as_dict() for device in queryset]})
