from django.core.exceptions import PermissionDenied

from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from iaso.models import Profile

from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class ProfilesViewSet(viewsets.ViewSet):
    """
    API to list profiles or get profile detail
    Examples:


    GET /api/profiles/
    GET /api/profiles/pk
    GET /api/profiles/me => current user

    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):

        if request.user.is_anonymous:
            raise PermissionDenied("Please log in")

        account = request.user.iaso_profile.account
        queryset = Profile.objects.filter(account=account)

        return Response({"profiles": [profile.as_short_dict() for profile in queryset]})


    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        if pk == 'me':
            profile = get_object_or_404(Profile, user__id=request.user.id)
        else:
            profile = get_object_or_404(Profile, pk=pk)
        return Response(profile.as_dict())