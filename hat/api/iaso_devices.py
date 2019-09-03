from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import Device

class IasoDevicesViewSet(viewsets.ViewSet):
    """
    list devices:
    """

    authentication_classes = []
    permission_classes = []

    def list(self, request):
        queryset = Device.objects.all()

        return Response([device.as_dict() for device in queryset])
