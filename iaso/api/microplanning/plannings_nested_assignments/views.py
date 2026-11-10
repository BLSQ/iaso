from __future__ import annotations

from collections.abc import Sequence
from typing import TYPE_CHECKING, Any

from django.contrib.postgres.expressions import ArraySubquery
from django.db.models import Count, F, IntegerField, OuterRef, Prefetch, Q, Subquery, Value
from django.db.models.functions import Coalesce
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import filters
from rest_framework.decorators import action
from rest_framework.pagination import BasePagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from iaso.api.common import HasPermission
from iaso.api.common.views import NestedParentLookupMixin
from iaso.api.microplanning.plannings.utils import PlanningOrgUnitTreeQuerySetBuilder
from iaso.api.microplanning.plannings_nested_assignments.filters import OrgUnitFilterSet, TeamFilterSet
from iaso.api.microplanning.plannings_nested_assignments.pagination import PlanningNestedAssignmentPagination
from iaso.api.microplanning.plannings_nested_assignments.serializers.org_units import AssignmentOrgUnitSerializer
from iaso.api.microplanning.plannings_nested_assignments.serializers.teams import AssignmentTeamSerializer
from iaso.models import Assignment, OrgUnit, Planning, PlanningConfig, Team
from iaso.models.microplanning.assignments import AssignmentQuerySet
from iaso.models.microplanning.plannings import PlanningQuerySet
from iaso.models.team import TeamQuerySet
from iaso.permissions.core_permissions import CORE_PLANNING_READ_PERMISSION


if TYPE_CHECKING:
    from django_filters.filterset import BaseFilterSet
    from rest_framework.generics import BaseFilterProtocol


@extend_schema(tags=["Assignments"])
class PlanningNestedAssignmentViews(NestedParentLookupMixin, GenericViewSet):
    permission_classes = [IsAuthenticated, HasPermission(CORE_PLANNING_READ_PERMISSION)]
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]
    ordering = ["id"]

    @property
    def pagination_class(self) -> type[BasePagination] | None:
        if self.action in ["org_units", "teams"]:
            return PlanningNestedAssignmentPagination
        return None

    @property
    def ordering_fields(self) -> Sequence[str] | None:
        if self.action == "teams":
            return ["id", "assigned", "total"]
        return None

    def get_serializer_class(self):
        if self.action == "org_units":
            return AssignmentOrgUnitSerializer
        if self.action == "teams":
            return AssignmentTeamSerializer
        raise NotImplementedError(f"Serializer not implemented for action {self.action}")

    @property
    def filter_backends(self) -> Sequence[type[filters.BaseFilterBackend] | type[BaseFilterProtocol]]:
        if self.action == "org_units":
            return [filters.OrderingFilter, DjangoFilterBackend]
        if self.action == "teams":
            return [filters.OrderingFilter, DjangoFilterBackend]
        return []

    @property
    def filterset_class(self) -> type[BaseFilterSet] | None:
        if self.action == "org_units":
            return OrgUnitFilterSet
        if self.action == "teams":
            return TeamFilterSet
        return None

    def get_parent_queryset(self) -> PlanningQuerySet:
        user = self.request.user
        if not user:
            return Planning.objects.none()

        qs = Planning.objects.filter_for_user(user)
        if self.action == "teams":
            return (
                qs.prefetch_related(
                    Prefetch(
                        "configs",
                        queryset=PlanningConfig.objects.prefetch_related(
                            "org_unit_types",
                            "org_unit_groups",
                        ),
                    )
                )
                .select_related("org_unit")
                .only("id", "org_unit", "org_unit__id", "org_unit__path")
            )
        return qs

    def get_queryset(self) -> AssignmentQuerySet | TeamQuerySet:
        parent = self.get_parent_instance()

        user = self.request.user
        if not user:
            return Assignment.objects.none()

        if self.action == "org_units":
            return parent.assignment_set.only("org_unit_id", "planning_id", "id", "user_id", "team_id")

        if self.action == "teams":
            configs = parent.configs.all()
            root = parent.org_unit
            root_level = len(str(root.path).split("."))

            org_units_queryset = OrgUnit.objects.filter_for_user(user)
            processed_levels = {root_level + config.level - 1 for config in configs}

            total_query = (
                PlanningOrgUnitTreeQuerySetBuilder()
                .build_queryset(
                    queryset=org_units_queryset,
                    root=root,
                    processed_levels=processed_levels,
                    configs=configs,
                )
                .filter(depth=OuterRef("team_depth") + root_level)
                .order_by()
                .values("depth")
                .annotate(count=Count("pk"))
                .values("count")[:1]
            )

            return (
                Team.objects.filter_for_user(user)
                .annotate(
                    assigned=Count(
                        "assignment",
                        filter=Q(assignment__planning=parent),
                    ),
                    area_org_unit_ids=ArraySubquery(
                        Assignment.objects.filter(
                            team=OuterRef("pk"),
                            planning=parent,
                        ).values("org_unit")
                    ),
                    team_depth=F("path__depth"),
                )
                .annotate(
                    total=Coalesce(
                        Subquery(total_query, output_field=IntegerField()), Value(0), output_field=IntegerField()
                    )
                )
                .only("id", "type")
            )

        return Assignment.objects.none()

    @extend_schema(
        responses={200: AssignmentOrgUnitSerializer(many=True)},
    )
    @action(detail=False, methods=["GET"], url_path="org-units")
    def org_units(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        responses={200: AssignmentTeamSerializer(many=True)},
    )
    @action(detail=False, methods=["GET"])
    def teams(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
