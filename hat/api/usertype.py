from rest_framework import viewsets
from rest_framework.response import Response
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication

from hat.users.models import UserType


class UserTypeViewSet(viewsets.ViewSet):
    """
    Institution API to list all user types.

    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = ['menupermissions.x_management_users']

    def list(self, request):
        res = map(lambda userType: userType.as_dict(),  UserType.objects.all())

        return Response(res)


