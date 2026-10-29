from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import filters

from iaso.models import DevicePosition
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_SUBMISSIONS_PERMISSION

from ...models import Device
from ..common import ModelViewSet, safe_api_import
from ..permission_checks import AuthenticationEnforcedPermission
from .filters import DeviceFilter
from .pagination import DevicePagination
from .permissions import GetAndListRequiresAuth, HasDevicePermission
from .serializers import DevicePositionSerializer, DeviceSerializer


@extend_schema(tags=["Devices"])
class DevicesViewSet(ModelViewSet):
    f"""Iaso Devices API

    This API is restricted to authenticated users having the "{CORE_FORMS_PERMISSION}" or "{CORE_SUBMISSIONS_PERMISSION}" permissions.

    GET /api/devices/
    GET /api/devices/<id>
    """

    permission_classes = [HasDevicePermission]
    serializer_class = DeviceSerializer
    queryset = Device.objects.all()
    http_method_names = ["get", "head", "options"]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    filterset_class = DeviceFilter
    pagination_class = DevicePagination
    lookup_field = "installation_id"

    def get_queryset(self):
        return (
            Device.objects.filter_for_user(user=self.request.user)
            .with_current_owner()
            .with_last_synced()
            .with_first_synced()
            .with_instance_count()
        )


@extend_schema(tags=["Device positions"])
class DevicesPositionViewSet(ModelViewSet):
    """Iaso Devices position API

    This API is open to anonymous users on write (if the project allows it).

    GET /api/devicespositions/
    GET /api/devicesposition/ [Deprecated] will be removed in the future
    POST /api/devicespositions/
    POST /api/devicesposition/ [Deprecated] will be removed in the future
    """

    permission_classes = [AuthenticationEnforcedPermission, GetAndListRequiresAuth]

    http_method_names = ["get", "post", "head", "options", "trace"]
    results_key = "devicesposition"
    queryset = DevicePosition.objects.all()
    serializer_class = DevicePositionSerializer

    @safe_api_import("devicesposition", fallback_status=201)
    def create(self, api_import, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def get_serializer(self, *args, **kwargs):
        if isinstance(kwargs.get("data", {}), list):
            kwargs["many"] = True

        return super().get_serializer(*args, **kwargs)
