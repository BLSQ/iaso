from rest_framework import viewsets
from rest_framework.response import Response
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from hat.cases.models import USER_TYPE_CHOICES


class CasesUserTypes(viewsets.ViewSet):
    """
    Api to list all user types used by mobile app
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        'menupermissions.x_case_cases'
    ]

    def list(self, request):
        return Response(USER_TYPE_CHOICES)
