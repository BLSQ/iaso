from django.db.models import QuerySet
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin, UpdateModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.serializers import BaseSerializer, Serializer
from rest_framework.viewsets import GenericViewSet

from iaso.api.common import HasPermission
from iaso.api.common.mixin import ProtectDestroyMixin
from iaso.api.planning_configs.serializers.bulk_create import PlanningConfigBulkCreateSerializer
from iaso.api.planning_configs.serializers.create import PlanningConfigCreateSerializer
from iaso.api.planning_configs.serializers.update import PlanningConfigUpdateSerializer
from iaso.models import PlanningConfig
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION


@extend_schema(tags=["Planning configs"])
class PlanningConfigViewSet(ProtectDestroyMixin, UpdateModelMixin, CreateModelMixin, GenericViewSet):
    permission_classes = (IsAuthenticated, HasPermission(CORE_PLANNING_WRITE_PERMISSION))
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]

    def get_queryset(self) -> QuerySet[PlanningConfig]:
        return PlanningConfig.objects.filter_for_user(self.request.user)

    def get_serializer_class(self) -> type[BaseSerializer]:
        if self.action == "create":
            return PlanningConfigCreateSerializer
        if self.action in ["update", "partial_update"]:
            return PlanningConfigUpdateSerializer
        if self.action == "delete":
            return Serializer
        if self.action == "bulk_create":
            return PlanningConfigBulkCreateSerializer
        raise NotImplementedError(f"Serializer for {self.action} not implemented")

    @action(detail=False, methods=["post"])
    def bulk_create(self):
        pass
