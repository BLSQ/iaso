from functools import cached_property
from typing import Any

from django.http import Http404
from drf_spectacular.utils import extend_schema
from rest_framework.mixins import CreateModelMixin
from rest_framework.viewsets import GenericViewSet

from iaso.api.devices.mobile.permissions import ProjectAuthenticationEnforcedPermission
from iaso.api.devices.mobile.serializers import DeviceLogCreateSerializer
from iaso.api.permission_checks import AuthenticationEnforcedPermission
from iaso.api.serializers import AppIdSerializer
from iaso.models import DeviceLog, Project


@extend_schema(tags=["Device logs"])
class DeviceLogsViewSet(GenericViewSet, CreateModelMixin):
    """Iaso Device Logs API

    This API is restricted to authenticated users when the project (identified by the `app_id`) parameter
    requires authentication.

    Note: If the `device` parameter passed to this endpoint doesn't exist, it will be created.

    POST /api/mobile/devices/sync/
    """

    permission_classes = [ProjectAuthenticationEnforcedPermission, AuthenticationEnforcedPermission]
    serializer_class = DeviceLogCreateSerializer
    queryset = DeviceLog.objects.none()
    http_method_names = ["post"]

    @cached_property
    def project(self):
        # raise_exception=False for Swagger
        app_id = AppIdSerializer(data=self.request.query_params).get_app_id(raise_exception=False)
        if app_id is None:
            return None
        try:
            # We need to use `.get` otherwise we can't know why the user cannot access it.
            # Is the project really not found or not returned because they don't have access?
            return Project.objects.select_related("account").get(app_id=app_id)
        except Project.DoesNotExist:
            raise Http404(f"Project with app_id '{app_id}' does not exist")

    def get_serializer_context(self) -> dict[str, Any]:
        context = super().get_serializer_context()
        context["project"] = self.project
        context["user"] = self.request.user
        return context

    def get_permissions(self):
        return [ProjectAuthenticationEnforcedPermission(self.project)]
