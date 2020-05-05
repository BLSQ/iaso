from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import DeviceOwnership
from hat.api.authentication import UserAccessPermission


class IasoDevicesOwnershipViewSet(viewsets.ViewSet):
    """
    list devices ownerships:
    """

    permission_required = ["menupermissions.iaso_forms"]
    permission_classes = [UserAccessPermission]

    def list(self, request):
        queryset = DeviceOwnership.objects.all()

        return Response([ownerShip.as_dict() for ownerShip in queryset])
