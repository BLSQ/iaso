from rest_framework import permissions, viewsets
from rest_framework.response import Response

from iaso.models import DeviceOwnership
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_SUBMISSIONS_PERMISSION

from .common import HasPermission


class DevicesOwnershipViewSet(viewsets.ViewSet):
    f"""Iaso Devices ownership API

    This API is restricted to authenticated users having the "{CORE_FORMS_PERMISSION}" or "{CORE_SUBMISSIONS_PERMISSION}" permissions.

    GET /api/devicesownerships/
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(CORE_FORMS_PERMISSION, CORE_SUBMISSIONS_PERMISSION),
    ]

    def list(self, request):
        queryset = DeviceOwnership.objects.all()

        return Response({"devicesownership": [ownerShip.as_dict() for ownerShip in queryset]})
