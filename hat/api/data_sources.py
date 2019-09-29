from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import DataSource

from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class DataSourceViewSet(viewsets.ViewSet):
    """
    list:
    """

    # Check with Mobile application if not broken
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):
        sources = DataSource.objects.all()
        return Response(
            {"sources": [source.as_dict() for source in sources.order_by("name")]}
        )
