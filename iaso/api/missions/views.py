from django.db.models import Prefetch
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import PolymorphicProxySerializer, extend_schema
from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.response import Response

from hat.audit.audit_mixin import AuditMixin
from iaso.api.common import ModelViewSet
from iaso.api.missions.pagination import MissionPagination
from iaso.api.missions.serializers.audit import AuditMissionSerializer
from iaso.api.missions.serializers.create import MissionPolymorphicCreateSerializer
from iaso.api.missions.serializers.list import MissionPolymorphicListSerializer
from iaso.api.missions.serializers.retrieve import MissionPolymorphicRetrieveSerializer
from iaso.api.missions.serializers.update import MissionPolymorphicUpdateSerializer
from iaso.api.permission_checks import AuthenticationEnforcedPermission
from iaso.models import MissionEntityType, MissionOrgUnitType, MissionWithForms
from iaso.models.missions import (
    MissionFormThroughForm,
    MissionType,
)

from .filters import MissionFilter
from .permissions import MissionPermission
from .serializers.dropdown import MissionDropdownSerializer
from .serializers.mission_types import MissionTypeDropdownSerializer


@extend_schema(tags=["Missions"])
class MissionViewSet(AuditMixin, ModelViewSet):
    remove_results_key_if_paginated = True
    permission_classes = [AuthenticationEnforcedPermission, MissionPermission]
    ordering_fields = ["id", "name", "mission_type", "created_at"]
    ordering = ["id"]
    audit_serializer = AuditMissionSerializer  # type: ignore
    pagination_class = MissionPagination
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    filterset_class = MissionFilter
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]

    def get_serializer_class(self):
        if self.action == "create":
            return MissionPolymorphicCreateSerializer
        if self.action == "list":
            return MissionPolymorphicListSerializer
        if self.action == "retrieve":
            return MissionPolymorphicRetrieveSerializer
        if self.action in ["update", "partial_update"]:
            return MissionPolymorphicUpdateSerializer
        if self.action == "mission_types_dropdown":
            return MissionTypeDropdownSerializer
        if self.action == "dropdown":
            return MissionDropdownSerializer
        raise NotImplementedError(f"Serializer for {self.action} not implemented")

    def get_queryset(self):
        user = self.request.user
        queryset = MissionWithForms.objects.filter_for_user(user)
        if self.action == "list":
            return (
                queryset.select_polymorphic_related(MissionOrgUnitType, "org_unit_type")
                .select_polymorphic_related(MissionEntityType, "entity_type")
                .annotate_with_form_count()
            )

        if self.action == "retrieve":
            return (
                queryset.prefetch_related(
                    Prefetch(
                        "missionformthroughform_set", queryset=MissionFormThroughForm.objects.select_related("form")
                    ),
                )
                .select_polymorphic_related(MissionOrgUnitType, "org_unit_type")
                .select_polymorphic_related(MissionEntityType, "entity_type")
            )
        if self.action == "dropdown":
            return queryset.non_polymorphic().only("id", "name")

        return queryset

    @extend_schema(responses={200: MissionTypeDropdownSerializer(MissionType, many=True)})
    @action(detail=False, pagination_class=None, url_path="mission-types-dropdown", filter_backends=[])
    def mission_types_dropdown(self, request, *args, **kwargs):
        serializer = self.get_serializer(MissionType, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=PolymorphicProxySerializer(
            component_name="MissionPolymorphicUpdateRequest",
            serializers=list(MissionPolymorphicUpdateSerializer.model_serializer_mapping.values()),
            resource_type_field_name=None,
        ),
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(responses={200: MissionDropdownSerializer(many=True)})
    @action(detail=False, pagination_class=None)
    def dropdown(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
