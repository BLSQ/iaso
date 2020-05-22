from rest_framework import viewsets, permissions
from rest_framework.response import Response

from iaso.models import MatchingAlgorithm
from .common import HasPermission


class AlgorithmsViewSet(viewsets.ViewSet):
    """Algorithms API

    This API is restricted to authenticated users having the "menupermissions.iaso_links" permission

    GET /api/algorithms/
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission("menupermissions.iaso_links"),
    ]

    def list(self, request):
        queryset = MatchingAlgorithm.objects.all()

        return Response([algo.as_dict() for algo in queryset])
