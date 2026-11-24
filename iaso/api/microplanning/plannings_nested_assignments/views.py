from __future__ import annotations

import typing

from collections.abc import Sequence
from typing import TYPE_CHECKING, Any

from django.contrib.postgres.expressions import ArraySubquery
from django.db import transaction
from django.db.models import Count, F, IntegerField, OuterRef, Prefetch, Q, QuerySet, Subquery, Value
from django.db.models.aggregates import Max
from django.db.models.functions import Coalesce
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.pagination import BasePagination
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from hat.audit.audit_mixin import AuditMixin
from hat.audit.models import Modification
from iaso.api.common.views import NestedParentLookupMixin
from iaso.api.microplanning.plannings.utils import PlanningOrgUnitTreeQuerySetBuilder
from iaso.api.microplanning.plannings_nested_assignments.filters import OrgUnitFilterSet, TeamFilterSet
from iaso.api.microplanning.plannings_nested_assignments.pagination import PlanningNestedAssignmentPagination
from iaso.api.microplanning.plannings_nested_assignments.permissions import HasPlanningPermission
from iaso.api.microplanning.plannings_nested_assignments.serializers.audit import (
    AuditNestedPlanningAssignmentSerializer,
)
from iaso.api.microplanning.plannings_nested_assignments.serializers.bulk import (
    BULK_BATCH_SIZE,
    AssignmentChange,
    AssignOrgUnitsSerializer,
)
from iaso.api.microplanning.plannings_nested_assignments.serializers.org_units import AssignmentOrgUnitSerializer
from iaso.api.microplanning.plannings_nested_assignments.serializers.teams import AssignmentTeamSerializer
from iaso.api.microplanning.plannings_nested_assignments.serializers.unassign import (
    UnassignInputSerializer,
    UnassignResponseSerializer,
    UnassignSerializer,
)
from iaso.models import Assignment, OrgUnit, Planning, PlanningConfig, Team
from iaso.models.microplanning.assignments import AssignmentQuerySet
from iaso.models.microplanning.plannings import PlanningQuerySet
from iaso.models.team import TeamQuerySet


if TYPE_CHECKING:
    from django_filters.filterset import BaseFilterSet
    from rest_framework.generics import BaseFilterProtocol


@extend_schema(tags=["Assignments"])
class PlanningNestedAssignmentViews(NestedParentLookupMixin, AuditMixin, GenericViewSet):
    permission_classes = [HasPlanningPermission]
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]
    ordering = ["id"]

    @property
    def audit_serializer(self):
        if self.action in ["unassign", "assign"]:
            return AuditNestedPlanningAssignmentSerializer
        raise NotImplementedError(f"Audit serializer not implemented for this action: {self.action}")

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
            return UnassignSerializer
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

        if self.request.method != "GET":
            qs = qs.exclude(deprecated=True)

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
            return (
                qs.select_related("org_unit")
                .prefetch_related(
                    Prefetch(
                        "configs",
                        queryset=PlanningConfig.objects.prefetch_related(
                            "org_unit_types",
                            "org_unit_groups",
                        ),
                    ),
                    Prefetch("assignment_set", queryset=Assignment.objects.all()),
                )
                .only(
                    "id", "org_unit", "org_unit__id", "org_unit__path", "team", "team__id", "team__path", "team__parent"
                )
            )
        return qs

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
            return parent.assignment_set.all()  # cannot apply .only because of audit

        if self.action == "teams":
            configs = parent.configs.all()
            root = parent.org_unit
            root_level = len(str(root.path).split("."))

            org_units_queryset = OrgUnit.objects.filter_for_user(user)
            processed_levels = {root_level + config.level - 1 for config in configs}

            base_team_qs = Team.objects.hierarchy(parent.team).filter_for_user(user).exclude(pk=parent.team.pk)

            total_per_level_query = (
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
                .annotate(count=Count("pk", distinct=True))
                .values("count")[:1]
            )
            total_query = (
                PlanningOrgUnitTreeQuerySetBuilder()
                .build_queryset(
                    queryset=org_units_queryset,
                    root=root,
                    processed_levels=processed_levels,
                    configs=configs,
                )
                # we estimate that the user has correctly configured its teams to match ou levels
                .filter(
                    depth__gte=OuterRef("team_depth") + root_level,
                    depth__lte=base_team_qs.values("path__depth").aggregate(
                        max_depth=Max("path__depth", default=Value(0))
                    )["max_depth"]
                    + root_level,
                )
                .order_by()
                .values(total_group=Value(1))
                .annotate(total=Count("pk", distinct=True))
                .values("total")[:1]
            )

            return (
                base_team_qs.annotate(
                    team_id=F("pk"),  # just to use it in subquery and avoid mistakes with outerref("pk")
                    assigned_for_level=Count(
                        "assignment",
                        filter=Q(assignment__planning=parent, assignment__deleted_at__isnull=True),
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
                    assigned=Coalesce(
                        Subquery(
                            Assignment.objects.filter(planning=parent, team__in=base_team_qs)
                            .filter(Q(team__path__depth__gt=OuterRef("team_depth")) | Q(team__id=OuterRef("team_id")))
                            .values("planning")
                            .annotate(count=Count("pk", distinct=True))
                            .values("count")[:1]
                        ),
                        Value(0),
                        output_field=IntegerField(),
                    ),
                    total_for_level=Coalesce(
                        Subquery(total_per_level_query, output_field=IntegerField()),
                        Value(0),
                        output_field=IntegerField(),
                    ),
                    total=Coalesce(
                        Subquery(total_query, output_field=IntegerField()), Value(0), output_field=IntegerField()
                    ),
                )
                .only("id", "type", "path")
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
        request=UnassignInputSerializer,
        responses={200: UnassignResponseSerializer},
        description="Removes the assignments of org units and the assignments made below them.",
    )
    @action(detail=False, methods=["PUT"])
    def unassign(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        instances = typing.cast(AssignmentQuerySet, self.get_queryset())

        instances = UnassignInputSerializer(data=request.data, context=self.get_serializer_context()).filter_queryset(
            instances
        )

        with transaction.atomic():
            old_values = self.audit_serializer(instances, many=True).data
            serializer = self.get_serializer(instances, many=True, data=[{} for _ in instances])
            serializer.is_valid(raise_exception=True)
            serializer.save()

            new_values = self.audit_serializer(instances, many=True).data

            Modification.objects.bulk_create(
                [
                    Modification(
                        user=self.request.user,
                        past_value=old_value,
                        new_value=new_value,
                        content_object=instance,
                        source=f"API {self.request.method} {self.request.path}",
                    )
                    for old_value, new_value, instance in zip(old_values, new_values, instances)
                ],
                batch_size=BULK_BATCH_SIZE,
            )

        return Response(serializer.data, status=status.HTTP_200_OK)

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
