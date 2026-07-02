from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import filters
from rest_framework.decorators import action
from rest_framework.response import Response

from hat.audit.audit_mixin import AuditMixin
from iaso.api.common import DeletionFilterBackend, ModelViewSet, ReadOnlyOrHasPermission
from iaso.api.missions.pagination import MissionPagination
from iaso.api.missions.serializers.audit import AuditMissionSerializer
from iaso.api.missions.serializers.create import MissionPolymorphicCreateSerializer
from iaso.api.missions.serializers.list import MissionPolymorphicListSerializer
from iaso.api.missions.serializers.retrieve import MissionPolymorphicRetrieveSerializer
from iaso.api.missions.serializers.update import MissionPolymorphicUpdateSerializer
from iaso.api.permission_checks import AuthenticationEnforcedPermission
from iaso.models import Mission
from iaso.models.microplanning import MissionType
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION

from .serializers.mission_types import MissionTypeSerializer


class MissionViewSet(AuditMixin, ModelViewSet):
    remove_results_key_if_paginated = True
    permission_classes = [AuthenticationEnforcedPermission, ReadOnlyOrHasPermission(CORE_PLANNING_WRITE_PERMISSION)]  # type: ignore
    queryset = Mission.objects.all()
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
        DeletionFilterBackend,
    ]
    ordering_fields = ["id", "name", "mission_type", "created_at"]
    filterset_fields = {
        "mission_type": ["exact"],
        "name": ["icontains"],
    }
    audit_serializer = AuditMissionSerializer  # type: ignore
    pagination_class = MissionPagination

    def get_serializer_class(self):
        if self.action == "create":
            return MissionPolymorphicCreateSerializer
        if self.action == "list":
            return MissionPolymorphicListSerializer
        if self.action == "retrieve":
            return MissionPolymorphicRetrieveSerializer
        if self.action in ["update", "partial_update"]:
            return MissionPolymorphicUpdateSerializer
        if self.action == "mission_types":
            return MissionTypeSerializer
        raise NotImplementedError(f"Serializer for {self.action} not implemented")

    def get_queryset(self):
        user = self.request.user
        return self.queryset.filter_for_user(user)

    @extend_schema(responses={200: MissionTypeSerializer(MissionType, many=True)})
    @action(detail=False, pagination_class=None, url_path="mission-types")
    def mission_types(self, request, *args, **kwargs):
        serializer = self.get_serializer(MissionType, many=True)
        return Response(serializer.data)

    @action(detail=False, pagination_class=None, url_path="mission-types-dropdown")
    def mission_types_dropdown(self, request, *args, **kwargs):
        serializer = self.get_serializer(MissionType, many=True)
        return Response(serializer.data)

    # def _read_response(self, instance, status_code=status.HTTP_200_OK):
    #     read_serializer = MissionReadSerializer(instance, context=self.get_serializer_context())
    #     return Response(read_serializer.data, status=status_code)
    #
    # def create(self, request, *args, **kwargs):
    #     serializer = self.get_serializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)
    #     self.perform_create(serializer)
    #     return self._read_response(serializer.instance, status_code=status.HTTP_201_CREATED)
    #
    # def partial_update(self, request, *args, **kwargs):
    #     instance = self.get_object()
    #     serializer = self.get_serializer(instance, data=request.data, partial=True)
    #     serializer.is_valid(raise_exception=True)
    #     self.perform_update(serializer)
    #     return self._read_response(instance)
