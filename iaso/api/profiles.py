from django.core.exceptions import PermissionDenied

from rest_framework import viewsets
from rest_framework.response import Response

from iaso.models import Profile

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

        if request.user.is_anonymous:
            raise PermissionDenied("Please log in")

        account = request.user.iaso_profile.account
        queryset = Profile.objects.filter(account=account)

        return Response({"profiles": [profile.as_short_dict() for profile in queryset]})
