from django.conf import settings
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework.mixins import ListModelMixin
from rest_framework.viewsets import GenericViewSet

from iaso.modules import MODULES
from iaso.permissions.core_permissions import CORE_MODULES_PERMISSION

from ..common import HasPermission
from .filters import ModuleFilter, ModuleOrderingFilter
from .serializers.dropdown import ModuleDropdownSerializer
from .serializers.list import ModuleListSerializer


# we need to provide the search param because the filter isn't exactly the right one
# we could implement a custom filter backend + openApiExtension .. but that's a lot of work
@extend_schema(
    tags=["Modules"],
    parameters=[
        OpenApiParameter(
            name="search",
            type=str,
            location=OpenApiParameter.QUERY,
            description="Search module name",
        ),
        OpenApiParameter(
            name="exclude",
            type=str,
            location=OpenApiParameter.QUERY,
            description="Exclude codename",
        ),
    ],
)
class ModulesViewSet(ListModelMixin, GenericViewSet):
    f"""Modules API

    This API is restricted to authenticated users having the "{CORE_MODULES_PERMISSION}" permission for reading only

    GET /api/modules/
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(CORE_MODULES_PERMISSION)]  # type: ignore
    http_method_names = ["get"]
    filter_backends = [DjangoFilterBackend, ModuleOrderingFilter]
    filterset_class = ModuleFilter
    ordering = ["name"]
    ordering_fields = ["name", "codename"]
    pagination_class = None

    def get_serializer_class(self):
        if self.action == "list":
            return ModuleListSerializer
        if self.action == "dropdown":
            return ModuleDropdownSerializer
        raise NotImplementedError(f"Serializer not implemented for {self.action}")

    def get_queryset(self):
        # todo : this filtering out could technically be done in the MODULES itself, but it has such a huge impact we'll start here :)
        return [
            module
            for module in MODULES
            if not module.related_plugin or module.related_plugin in (settings.PLUGINS or [])
        ]

    @extend_schema(operation_id="api_modules_dropdown_list")
    @action(detail=False, methods=["get"])
    def dropdown(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
