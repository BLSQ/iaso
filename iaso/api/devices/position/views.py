from drf_spectacular.utils import extend_schema
from rest_framework.mixins import CreateModelMixin
from rest_framework.viewsets import GenericViewSet

from iaso.api.common import safe_api_import
from iaso.api.devices.position.serializers import DevicePositionCreateSerializer
from iaso.api.permission_checks import AuthenticationEnforcedPermission
from iaso.models import DevicePosition


@extend_schema(tags=["Device positions"])
class DevicesPositionViewSet(GenericViewSet, CreateModelMixin):
    """Iaso Devices position API

    This API is open to anonymous users on write (if the project allows it).

    POST /api/devicespositions/
    POST /api/devicesposition/ [Deprecated] will be removed in the future
    """

    permission_classes = [AuthenticationEnforcedPermission]

    http_method_names = ["post"]
    queryset = DevicePosition.objects.all()
    serializer_class = DevicePositionCreateSerializer

    @safe_api_import("devicesposition", fallback_status=201)
    def create(self, api_import, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def get_serializer(self, *args, **kwargs):
        if isinstance(kwargs.get("data", {}), list):
            kwargs["many"] = True

        return super().get_serializer(*args, **kwargs)
