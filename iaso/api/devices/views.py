from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import filters

from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_SUBMISSIONS_PERMISSION

from ...models import Device
from ...models.device import DeviceQuerySet
from ..common import ModelSerializer
from ..common.views import ReadOnlyModelViewSet
from .filters import DeviceFilter
from .pagination import DevicePagination
from .permissions import HasDevicePermission
from .serializers import DetailsDeviceSerializer, ListDeviceSerializer


@extend_schema(tags=["Devices"])
class DevicesViewSet(ReadOnlyModelViewSet):
    f"""Iaso Devices API

    This API is restricted to authenticated users having the "{CORE_FORMS_PERMISSION}" or "{CORE_SUBMISSIONS_PERMISSION}" permissions.

    GET /api/devices/
    GET /api/devices/<id>
    """

    permission_classes = [HasDevicePermission]
    queryset = Device.objects.all()
    http_method_names = ["get", "head", "options"]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    filterset_class = DeviceFilter
    pagination_class = DevicePagination
    lookup_field = "installation_id"

    def get_serializer_class(self) -> type[ModelSerializer]:
        if self.action == "list":
            return ListDeviceSerializer
        return DetailsDeviceSerializer

    def get_queryset(self) -> DeviceQuerySet:
        return (
            Device.objects.filter_for_user(user=self.request.user)
            .with_current_owner()
            .with_last_synced()
            .with_first_synced()
            .with_instance_count()
        )
