from django.core.exceptions import PermissionDenied
from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import Device


class IasoDevicesViewSet(viewsets.ViewSet):
    """
    list devices:
    """

    permission_classes = []

    def list(self, request):
        if request.user.is_anonymous:
            raise PermissionDenied("Please log in")

        queryset = Device.objects.all()
        profile = request.user.iaso_profile
        queryset = queryset.filter(projects__account=profile.account)

        return Response([device.as_dict() for device in queryset])
