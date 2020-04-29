from rest_framework import viewsets, status
from rest_framework.response import Response

from iaso.models import MatchingAlgorithm
from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class AlgorithmsViewSet(viewsets.ViewSet):
    """
    API list algorithms
    Examples:


    GET /api/algorithms/

    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []
    permission_required = ["menupermissions.iaso_links"]

    def list(self, request):
        queryset = MatchingAlgorithm.objects.all()

        return Response([algo.as_dict() for algo in queryset])
