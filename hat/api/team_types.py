from rest_framework import viewsets
from rest_framework.response import Response
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from hat.users.models import TEAM_TYPE_CHOICES


class TeamTypeViewSet(viewsets.ViewSet):
    """
    Api to list teams types
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    def list(self, request):
        return Response(TEAM_TYPE_CHOICES)

