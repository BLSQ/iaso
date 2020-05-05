from rest_framework import viewsets, status
from rest_framework.response import Response
from hat.api.authentication import UserAccessPermission

from iaso.models import MatchingAlgorithm


class AlgorithmsViewSet(viewsets.ViewSet):
    """
    API list algorithms
    Examples:


    GET /api/algorithms/

    """

    permission_required = ["menupermissions.iaso_links"]
    permission_classes = [UserAccessPermission]

    def list(self, request):
        queryset = MatchingAlgorithm.objects.all()

        return Response([algo.as_dict() for algo in queryset])
