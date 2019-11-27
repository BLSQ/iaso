from rest_framework import viewsets, status
from rest_framework.response import Response

from hat.users.models import Profile

from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class ProfilesViewSet(viewsets.ViewSet):
    """
    API to list profiles
    Examples:


    GET /api/profiles/

    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):
        queryset = Profile.objects.all()

        return Response([profile.as_short_dict() for profile in queryset])
