from rest_framework import viewsets
from rest_framework.response import Response
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from hat.vector_control.models import HABITAT_CHOICES


class HabitatsViewSet(viewsets.ViewSet):
    """
    Api to list all habitats
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        'menupermissions.x_vectorcontrol'
    ]

    def list(self, request):
        return Response(HABITAT_CHOICES)

