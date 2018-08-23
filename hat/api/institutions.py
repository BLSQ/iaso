from rest_framework import viewsets
from rest_framework.response import Response
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication

from hat.users.models import Institution


class InstitutionsViewSet(viewsets.ViewSet):
    """
    Institution API to list all institutions.

    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = ['menupermissions.x_management_users']

    def list(self, request):
        queryset = Institution.objects.all()

        return Response(queryset.values('id', 'name'))


