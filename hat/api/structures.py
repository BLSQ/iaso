from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from hat.geo.models import HealthStructure, AS
from .authentication import CsrfExemptSessionAuthentication


class StructureViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = []
    permission_classes = []

    def list(self, request):
        values = ("name", "id", "AS_id")
        queryset = HealthStructure.objects.all()

        res = queryset.values(*values)
        return Response(res)
