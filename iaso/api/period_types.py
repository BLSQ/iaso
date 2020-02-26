from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import PERIOD_TYPE_CHOICES


from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class PeriodTypesViewSet(viewsets.ViewSet):
    """
    API to list period types
    Examples:


    GET /api/period_types/

    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):
        return Response(PERIOD_TYPE_CHOICES)

