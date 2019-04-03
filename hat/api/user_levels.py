from rest_framework import viewsets
from rest_framework.response import Response
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from hat.users.models import LEVEL_CHOICES

authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
permission_required = ['menupermissions.x_management_users']

class UserLevelsViewSet(viewsets.ViewSet):
    """
    Api to list users levels
    """

    def list(self, request):
        return Response(LEVEL_CHOICES)
