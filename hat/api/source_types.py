from rest_framework import viewsets
from rest_framework.response import Response
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from iaso.models import GEO_SOURCE_CHOICES


class SourceTypeViewSet(viewsets.ViewSet):
    """
    Api to list all source types
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    def list(self, request):
        return Response(GEO_SOURCE_CHOICES)

