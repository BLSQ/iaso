from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import DeviceOwnership


class IasoDevicesOwnershipViewSet(viewsets.ViewSet):
    """
    list devices ownerships:
    """

    authentication_classes = []
    permission_classes = []
    permission_required = ["menupermissions.iaso_forms"]

    def list(self, request):
        queryset = DeviceOwnership.objects.all()

        return Response([ownerShip.as_dict() for ownerShip in queryset])
