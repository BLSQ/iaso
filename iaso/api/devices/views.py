from functools import cached_property
from typing import Any

from django.http import Http404
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import filters

from iaso.models import DeviceLog, DevicePosition, Project
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_SUBMISSIONS_PERMISSION

from ...models import Device
from ..common import ModelViewSet, safe_api_import
from ..permission_checks import AuthenticationEnforcedPermission
from ..serializers import AppIdSerializer
from .filters import DeviceFilter
from .pagination import DevicePagination
from .permissions import GetAndListRequiresAuth, HasDevicePermission, ProjectAuthenticationEnforcedPermission
from .serializers import DeviceLogSerializer, DevicePositionSerializer, DeviceSerializer


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


@extend_schema(tags=["Device logs"])
class DeviceLogsViewSet(ModelViewSet):
    """Iaso Device Logs API

    This API is restricted to authenticated users when the project (identified by the `app_id`) parameter
    requires authentication.

    Note: If the `device` parameter passed to this endpoint doesn't exist, it will be created.

    POST /api/mobile/devices/sync/
    """

    permission_classes = [ProjectAuthenticationEnforcedPermission]
    serializer_class = DeviceLogSerializer
    queryset = DeviceLog.objects.none()
    http_method_names = ["post"]

    @cached_property
    def project(self):
        # raise_exception=False for Swagger
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=False)
        if app_id is None:
            return None
        try:
            return Project.objects.get(app_id=app_id)
        except Project.DoesNotExist:
            raise Http404(f"Project with app_id '{app_id}' does not exist")

    def get_serializer_context(self) -> dict[str, Any]:
        context = super().get_serializer_context()
        context["project"] = self.project
        return context

    def get_permissions(self):
        return [ProjectAuthenticationEnforcedPermission(self.project)]


@extend_schema(tags=["Device positions"])
class DevicesPositionViewSet(ModelViewSet):
    """Iaso Devices position API

    This API is open to anonymous users on write (if the project allows it).

    POST /api/devicespositions/
    POST /api/devicesposition/ [Deprecated] will be removed in the future
    """

    permission_classes = [AuthenticationEnforcedPermission, GetAndListRequiresAuth]

    http_method_names = ["post"]
    queryset = DevicePosition.objects.all()
    serializer_class = DevicePositionSerializer

    @safe_api_import("devicesposition", fallback_status=201)
    def create(self, api_import, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def get_serializer(self, *args, **kwargs):
        if isinstance(kwargs.get("data", {}), list):
            kwargs["many"] = True

        return super().get_serializer(*args, **kwargs)
