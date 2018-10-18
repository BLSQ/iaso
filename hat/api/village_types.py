from rest_framework import viewsets
from rest_framework.response import Response
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from hat.geo.models import VILLAGE_SOURCE_CHOICES


class VillageTypeViewSet(viewsets.ViewSet):
    """
    Api to list all village types
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = ['menupermissions.x_management_villages']

    def list(self, request):
        return Response(VILLAGE_SOURCE_CHOICES)

