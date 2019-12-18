from django.core.exceptions import PermissionDenied
from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import Device
from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class IasoDevicesViewSet(viewsets.ViewSet):
    """
    list devices:
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):
        if request.user.is_anonymous:
            raise PermissionDenied("Please log in")

        queryset = Device.objects.all()
        profile = request.user.iaso_profile
        queryset = queryset.filter(projects__account=profile.account)

        return Response([device.as_dict() for device in queryset])
