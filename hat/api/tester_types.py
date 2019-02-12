from rest_framework import viewsets
from rest_framework.response import Response
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from hat.users.models import TESTER_TYPE_CHOICES


class TesterTypeViewSet(viewsets.ViewSet):
    """
    Api to list all tester types
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = ['menupermissions.x_management_users']

    def list(self, request):
        return Response(TESTER_TYPE_CHOICES)

