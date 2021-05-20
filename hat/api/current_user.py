from rest_framework import viewsets
from rest_framework.response import Response

from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class CurrentUserViewSet(viewsets.ViewSet):
    """
    API to get current user infos
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    def list(self, request):
        return Response(request.user.profile.as_dict())
