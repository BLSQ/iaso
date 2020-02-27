from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import INSTANCE_STATUS_CHOICES


from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class InstanceStatusViewSet(viewsets.ViewSet):
    """
    API to list instance status possibilities
    Examples:


    GET /api/instance_status/

    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):
        return Response({"instance_status": INSTANCE_STATUS_CHOICES})

