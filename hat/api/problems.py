from rest_framework import viewsets
from rest_framework.response import Response
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from hat.vector_control.models import PROBLEMS_CHOICES


class ProblemsViewSet(viewsets.ViewSet):
    """
    Api to list all catches problems
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        'menupermissions.x_vectorcontrol'
    ]

    def list(self, request):
        return Response(PROBLEMS_CHOICES)

