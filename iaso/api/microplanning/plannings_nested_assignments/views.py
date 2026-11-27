from __future__ import annotations

from collections.abc import Sequence
from typing import TYPE_CHECKING, Any

from django.contrib.postgres.expressions import ArraySubquery
from django.db import transaction
from django.db.models import (
    Case,
    Count,
    F,
    Func,
    IntegerField,
    OuterRef,
    Prefetch,
    QuerySet,
    Subquery,
    Value,
    When,
)
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import filters
from rest_framework.decorators import action
from rest_framework.pagination import BasePagination
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from hat.audit.models import Modification
from iaso.api.common.views import NestedParentLookupMixin
from iaso.api.microplanning.assignments.serializers.audit import AuditAssignmentSerializer
from iaso.api.microplanning.plannings_nested_assignments.filters import OrgUnitFilterSet, TeamFilterSet
from iaso.api.microplanning.plannings_nested_assignments.pagination import PlanningNestedAssignmentPagination
from iaso.api.microplanning.plannings_nested_assignments.permissions import HasPlanningPermission
from iaso.api.microplanning.plannings_nested_assignments.serializers.bulk import (
    BULK_BATCH_SIZE,
    AssignmentChange,
    AssignOrgUnitsSerializer,
    UnassignOrgUnitsSerializer,
)
from iaso.api.microplanning.plannings_nested_assignments.serializers.org_units import AssignmentOrgUnitSerializer
from iaso.api.microplanning.plannings_nested_assignments.serializers.teams import AssignmentTeamSerializer
from iaso.api.microplanning.plannings_nested_assignments.utils import compute_ou_totals_by_team_depth
from iaso.models import Assignment, Planning, PlanningConfig, Team
from iaso.models.microplanning.assignments import AssignmentQuerySet
from iaso.models.microplanning.plannings import PlanningQuerySet
from iaso.models.team import TeamQuerySet


if TYPE_CHECKING:
    from django_filters.filterset import BaseFilterSet
    from rest_framework.generics import BaseFilterProtocol


@extend_schema(tags=["Assignments"])
class PlanningNestedAssignmentViews(NestedParentLookupMixin, GenericViewSet):
    permission_classes = [HasPlanningPermission]
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
            return ["id", "assigned", "total", "team_depth"]
        return None

    def get_serializer_context(self) -> dict[str, Any]:
        return {**super().get_serializer_context(), "planning": self.get_parent_instance()}

    def get_parent_instance(self) -> Planning:
        if not hasattr(self, "_planning"):
            self._planning = super().get_parent_instance()
        return self._planning

    def get_serializer_class(self):
        if self.action == "org_units":
            return AssignmentOrgUnitSerializer
        if self.action == "teams":
            return AssignmentTeamSerializer
        if self.action == "assign":
            return AssignOrgUnitsSerializer
        if self.action == "unassign":
            return UnassignOrgUnitsSerializer
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
                .select_related("org_unit", "team")
                .only(
                    "id", "org_unit", "org_unit__id", "org_unit__path", "team", "team__id", "team__path", "team__parent"
                )
            )
        if self.action in ["assign", "unassign"]:
            return qs.select_related("org_unit")
        return qs

    @staticmethod
    def by_depth(mapping: dict):
        # few distinct depths → a small CASE is clearer than jsonb
        return Case(
            *[When(team_depth=d, then=Value(v)) for d, v in mapping.items()],
            default=Value(0),
            output_field=IntegerField(),
        )

    def get_queryset(self) -> AssignmentQuerySet | TeamQuerySet | QuerySet[Assignment]:
        parent = self.get_parent_instance()

        user = self.request.user
        if not user:
            return Assignment.objects.none()

        if self.action == "org_units":
            return parent.assignment_set.filter(deleted_at__isnull=True).only(
                "org_unit_id", "planning_id", "id", "user_id", "team_id"
            )

        if self.action in ["assign", "unassign"]:
            return parent.assignment_set.filter(deleted_at__isnull=True)

        if self.action == "teams":
            parent = self._planning
            team_qs = (
                Team.objects.hierarchy(self._planning.team)
                .filter_for_user(self.request.user)
                .exclude(pk=self._planning.team.pk)
            )

            total_by_depth, total_for_level_by_depth = compute_ou_totals_by_team_depth(
                parent, self.request.user, team_qs
            )

            # assignments per team depth: one aggregate query
            count_by_depth = dict(
                Assignment.objects.filter(planning=parent, team__in=team_qs)
                .order_by()
                .values(d=F("team__path__depth"))
                .annotate(c=Count("pk"))
                .values_list("d", "c")
            )
            max_depth = max(count_by_depth, default=0)
            deeper_than = {d: sum(c for dd, c in count_by_depth.items() if dd > d) for d in range(1, max_depth + 1)}

            own_count = (
                Assignment.objects.filter(team=OuterRef("pk"), planning=parent)
                .order_by()
                .annotate(c=Func(F("pk"), function="COUNT"))
                .values("c")
            )

            return team_qs.annotate(
                team_depth=F("path__depth"),
                assigned_for_level=Subquery(own_count.filter(deleted_at__isnull=True), output_field=IntegerField()),
                assigned=Subquery(own_count, output_field=IntegerField()) + self.by_depth(deeper_than),
                total_for_level=self.by_depth(total_for_level_by_depth),
                total=self.by_depth(total_by_depth),
                area_org_unit_ids=ArraySubquery(
                    Assignment.objects.filter(team=OuterRef("pk"), planning=parent).order_by().values("org_unit")
                ),
            ).only("id", "type", "path")

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

    @extend_schema(
        request=AssignOrgUnitsSerializer,
        responses={200: AssignOrgUnitsSerializer},
        description=(
            "Assigns org units to a direct member of the team owning their parent. "
            "Reassigned org units lose the assignments made below them."
        ),
    )
    @action(detail=False, methods=["POST"])
    def assign(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        return self._change_assignments(request)

    @extend_schema(
        request=UnassignOrgUnitsSerializer,
        responses={200: UnassignOrgUnitsSerializer},
        description="Removes the assignments of org units and the assignments made below them.",
    )
    @action(detail=False, methods=["POST"])
    def unassign(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        return self._change_assignments(request)

    def _change_assignments(self, request: Request) -> Response:
        serializer = self.get_serializer(self.get_queryset(), data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            serializer.save()
            self._audit(request, serializer.changes)
        return Response(serializer.data)

    @staticmethod
    def _audit(request: Request, changes: list[AssignmentChange]) -> None:
        Modification.objects.bulk_create(
            (
                Modification(
                    user=request.user,
                    past_value=change.past_value,
                    new_value=[AuditAssignmentSerializer(change.assignment).data],
                    content_object=change.assignment,
                    source=f"API {request.method} {request.path}",
                )
                for change in changes
            ),
            batch_size=BULK_BATCH_SIZE,
        )
