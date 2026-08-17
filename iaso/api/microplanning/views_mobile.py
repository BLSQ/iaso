from django.db.models import Prefetch
from drf_spectacular.utils import extend_schema
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet

from iaso.models.microplanning import Assignment, Planning

from ...models.missions import MissionEntityType, MissionOrgUnitType, MissionType, MissionWithForms
from ..common.mixin import CustomPaginationListModelMixin
from .pagination import MobilePagination
from .serializers import MobilePlanningSerializer, MobilePlanningV2Serializer


@extend_schema(tags=["Micro plannings", "Mobile", "Plannings"])
class MobilePlanningViewSet(CustomPaginationListModelMixin, GenericViewSet):
    """Planning for mobile, contrary to the more general API.
    it only returns the Planning where the user has assigned OrgUnit
    and his assignments
    """

    results_key = "plannings"
    permission_classes = [IsAuthenticated]
    serializer_class = MobilePlanningSerializer

    def get_queryset(self):
        user = self.request.user
        # Only return  planning which 1. contain assignment for user 2. are published 3. undeleted
        # distinct is necessary otherwise if a planning contain multiple assignment for the same user it got duplicated

        return (
            Planning.objects.filter(assignment__user=user, assignment__deleted_at__isnull=True)
            .exclude(published_at__isnull=True)
            .exclude(started_at__isnull=True)
            .exclude(ended_at__isnull=True)
            .filter(deleted_at__isnull=True)
            .prefetch_related(
                Prefetch(
                    lookup="assignment_set",
                    queryset=Assignment.objects.filter(deleted_at=None)
                    .filter(user=user)
                    .select_related("org_unit", "org_unit__org_unit_type")
                    .prefetch_related("org_unit__org_unit_type__form_set"),
                ),
                # We have to filter on FORM_FILLING only because this was the only type of missions before
                Prefetch(
                    lookup="missions",
                    queryset=MissionWithForms.objects.filter(mission_type=MissionType.FORM_FILLING).prefetch_related(
                        "mission_forms"
                    ),
                ),
            )
            .distinct()
        )


@extend_schema(tags=["Micro plannings", "Mobile", "Plannings"])
class MobilePlanningV2ViewSet(CustomPaginationListModelMixin, GenericViewSet):
    """Planning for mobile, contrary to the more general API.
    it only returns the Planning where the user has assigned OrgUnit
    and his assignments
    """

    results_key = "plannings"
    permission_classes = [IsAuthenticated]
    serializer_class = MobilePlanningV2Serializer
    filter_backends = [OrderingFilter]
    ordering = ["-updated_at"]
    pagination_class = MobilePagination

    def get_queryset(self):
        user = self.request.user
        # Only return  planning which 1. contain assignment for user 2. are published 3. undeleted
        # distinct is necessary otherwise if a planning contain multiple assignment for the same user it got duplicated

        return (
            Planning.objects.filter(assignment__user=user, assignment__deleted_at__isnull=True)
            .exclude(published_at__isnull=True)
            .exclude(started_at__isnull=True)
            .exclude(ended_at__isnull=True)
            .filter(deleted_at__isnull=True)
            .prefetch_related(
                Prefetch(
                    lookup="assignment_set",
                    queryset=Assignment.objects.filter(deleted_at=None)
                    .filter(user=user)
                    .select_related("org_unit", "org_unit__org_unit_type")
                    .prefetch_related("org_unit__org_unit_type__form_set", "org_unit__org_unit_type__sub_unit_types"),
                ),
                Prefetch(
                    "missions",
                    queryset=MissionWithForms.objects.all()
                    .prefetch_related("forms")
                    .select_polymorphic_related(MissionOrgUnitType, "org_unit_type")
                    .select_polymorphic_related(MissionEntityType, "entity_type"),
                ),
            )
            .distinct()
        )
