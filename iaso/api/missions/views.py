from django.db.models import Case, Count, F, IntegerField, Value, When
from drf_spectacular.utils import extend_schema
from rest_framework import status
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
from iaso.models import Mission
from iaso.models.microplanning import MissionType

from .permissions import MissionPermission
from .serializers.filters import MissionFilter
from .serializers.mission_types import MissionTypeDropdownSerializer


@extend_schema(tags=["Missions"])
class MissionViewSet(AuditMixin, ModelViewSet):
    remove_results_key_if_paginated = True
    permission_classes = [AuthenticationEnforcedPermission, MissionPermission]
    ordering_fields = ["id", "name", "mission_type", "created_at"]
    audit_serializer = AuditMissionSerializer  # type: ignore
    pagination_class = MissionPagination
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
        raise NotImplementedError(f"Serializer for {self.action} not implemented")

    def get_queryset(self):
        user = self.request.user
        return (
            Mission.objects.filter_for_user(user)
            .annotate(
                mission_form_count=Count("missionform__forms", distinct=True),
                org_unit_form_count=Count("missionorgunittype__forms", distinct=True),
                entity_form_count=Count("missionentitytype__forms", distinct=True),
            )
            .annotate(
                forms_count=Case(
                    When(
                        mission_type=MissionType.FORM_FILLING,
                        then=F("mission_form_count"),
                    ),
                    When(
                        mission_type=MissionType.ORG_UNIT_AND_FORM,
                        then=F("org_unit_form_count"),
                    ),
                    When(
                        mission_type=MissionType.ENTITY_AND_FORM,
                        then=F("entity_form_count"),
                    ),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
        )

    @extend_schema(responses={200: MissionTypeDropdownSerializer(MissionType, many=True)})
    @action(detail=False, pagination_class=None, url_path="mission-types-dropdown", filter_backends=[])
    def mission_types_dropdown(self, request, *args, **kwargs):
        serializer = self.get_serializer(MissionType, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
