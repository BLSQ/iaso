from __future__ import annotations

import typing

from collections.abc import Sequence
from typing import TYPE_CHECKING, Any

from django.contrib.auth import get_user_model
from django.db.models import Count, Min, Prefetch, Q
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import filters, serializers, status
from rest_framework.decorators import action
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer

from iaso.models.microplanning.planning_configs import PlanningConfigQuerySet
from iaso.models.microplanning.plannings import PlanningQuerySet

from ..common.filters import PublishingStatusFilterBackend
from .serializers.audit import AuditPlanningSerializer
from .serializers.misc import PlanningReadSerializer, PlanningWriteSerializer
from .serializers.org_unit_tree import OrgUnitBuildTreeSerializer, OrgUnitTreeSerializer
from .serializers.planning_config.bulk import NestedPlanningConfigBulkSerializer
from .serializers.planning_config.list import NestedPlanningConfigListSerializer


if TYPE_CHECKING:
    from django_filters.filterset import BaseFilterSet
    from rest_framework.generics import BaseFilterProtocol

from rest_framework.pagination import BasePagination
from rest_framework.request import Request
from rest_framework.response import Response

from hat.audit.audit_mixin import AuditMixin
from iaso.api.common import (
    DeletionFilterBackend,
    HasPermission,
    ModelViewSet,
    Paginator,
)
from iaso.api.permission_checks import AuthenticationEnforcedPermission
from iaso.models import (
    Group,
    MissionEntityType,
    MissionOrgUnitType,
    PlanningConfig,
)
from iaso.models.microplanning import Planning
from iaso.models.missions import MissionQuerySet, MissionWithForms
from iaso.models.org_unit import OrgUnit, OrgUnitQuerySet, OrgUnitType
from iaso.permissions.core_permissions import CORE_PLANNING_READ_PERMISSION, CORE_PLANNING_WRITE_PERMISSION

from .filters import (
    PlanningDropdownFilterSet,
    PlanningOrgUnitTreeFilterSet,
    PlanningSearchFilterBackend,
)
from .pagination import PlanningConfigPagination, PlanningMissionPagination
from .serializers.dropdown import PlanningDropdownSerializer
from .serializers.missions.base import PlanningMissionPolymorphicListSerializer


User = get_user_model()


@extend_schema(tags=["Micro plannings", "Plannings"])
class PlanningViewSet(AuditMixin, ModelViewSet):
    permission_classes = [AuthenticationEnforcedPermission, HasPermission(CORE_PLANNING_WRITE_PERMISSION)]
    queryset = Planning.objects.all()
    ordering_fields = ["id", "name", "started_at", "ended_at", "project__name", "org_unit__name"]
    filterset_fields = {
        "name": ["icontains"],
        "started_at": ["gte", "lte"],
        "ended_at": ["gte", "lte"],
    }
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]
    audit_serializer = AuditPlanningSerializer

    @property
    def filterset_class(self) -> type[BaseFilterSet] | None:
        if self.action == "dropdown":
            return PlanningDropdownFilterSet
        if self.action == "org_unit_tree":
            return PlanningOrgUnitTreeFilterSet
        return None

    @property
    def pagination_class(self) -> type[BasePagination] | None:
        if self.action == "missions":
            return PlanningMissionPagination
        if self.action == "configs":
            return PlanningConfigPagination
        if self.action == "dropdown":
            return None
        if self.action == "org_unit_tree":
            return None
        return Paginator

    @property
    def include_results_key_if_not_paginated(self) -> bool:
        if self.action in ["missions", "configs"]:
            return True
        return False

    @property
    def filter_backends(self) -> Sequence[type[filters.BaseFilterBackend] | type[BaseFilterProtocol]]:
        if self.action == "dropdown":
            return [filters.OrderingFilter, DjangoFilterBackend]
        if self.action == "missions":
            return []
        if self.action == "configs":
            return []
        if self.action == "org_unit_tree":
            # only used to document level/max_depth in the schema, the action applies the filterset itself
            return [DjangoFilterBackend]
        return [
            filters.OrderingFilter,
            DjangoFilterBackend,
            PublishingStatusFilterBackend,
            PlanningSearchFilterBackend,
            DeletionFilterBackend,
        ]

    def get_serializer_class(self) -> type[serializers.BaseSerializer]:
        if self.action in ["create", "update", "partial_update"]:
            return PlanningWriteSerializer
        if self.action == "dropdown":
            return PlanningDropdownSerializer
        if self.action == "missions":
            return PlanningMissionPolymorphicListSerializer
        if self.action == "configs":
            return NestedPlanningConfigListSerializer
        if self.action == "bulk_configs":
            return NestedPlanningConfigBulkSerializer
        return PlanningReadSerializer

    def get_serializer_context(self) -> dict[str, Any]:
        ctx = super().get_serializer_context()
        if self.action == "bulk_configs":
            ctx.update({"planning_id": self.kwargs.get("pk")})
        return ctx

    def get_queryset(self) -> PlanningQuerySet | PlanningConfigQuerySet | MissionQuerySet:
        user = typing.cast(User, self.request.user)
        qs = self.queryset.filter_for_user(user)

        if self.action not in ["list", "dropdown", "destroy", "retrieve", "configs", "missions"]:
            qs = qs.exclude(deprecated=True)

        if self.action == "dropdown":
            return qs.only("id", "name", "deprecated")

        if self.action == "configs":
            qs = qs.prefetch_related(
                Prefetch(
                    "configs",
                    queryset=PlanningConfig.objects.prefetch_related(
                        Prefetch("org_unit_types", queryset=OrgUnitType.objects.only("id", "name").all()),
                        Prefetch("org_unit_groups", queryset=Group.objects.only("id", "name").all()),
                    ).order_by("level"),
                )
            )
            planning = get_object_or_404(
                qs,
                pk=self.kwargs["pk"],
            )
            return planning.configs.all()

        if self.action == "bulk_configs":
            qs = qs.prefetch_related("configs")
            planning = get_object_or_404(
                qs,
                pk=self.kwargs["pk"],
            )
            return planning.configs.all()

        if self.action == "missions":
            qs = qs.prefetch_related(
                Prefetch(
                    "missions",
                    queryset=MissionWithForms.objects.all()
                    .select_polymorphic_related(MissionOrgUnitType, "org_unit_type")
                    .select_polymorphic_related(MissionEntityType, "entity_type"),
                )
            )
            planning = get_object_or_404(
                qs,
                pk=self.kwargs["pk"],
            )
            return planning.missions.all()

        if self.action == "org_unit_tree":
            qs = (
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

        return (
            qs.select_related("project", "org_unit", "team", "selected_sampling_result")
            .prefetch_related(
                "target_org_unit_types",
                Prefetch(
                    "missions",
                    queryset=MissionWithForms.objects.all()
                    .prefetch_related("forms")
                    .select_polymorphic_related(MissionOrgUnitType, "org_unit_type")
                    .select_polymorphic_related(MissionEntityType, "entity_type"),
                ),
            )
            .annotate(assignments_count=Count("assignment", filter=Q(assignment__deleted_at__isnull=True)))
        )

    def _read_response(self, instance, status_code=status.HTTP_200_OK):
        read_serializer = PlanningReadSerializer(instance, context=self.get_serializer_context())
        return Response(read_serializer.data, status=status_code)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return self._read_response(serializer.instance, status_code=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return self._read_response(instance)

    @extend_schema(responses={200: PlanningDropdownSerializer(many=True)})
    @action(
        detail=False,
        methods=["get"],
        permission_classes=[AuthenticationEnforcedPermission, HasPermission(CORE_PLANNING_READ_PERMISSION)],
    )
    def dropdown(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(responses={200: PlanningMissionPolymorphicListSerializer(many=True)})
    @action(
        detail=True,
        methods=["get"],
        permission_classes=[AuthenticationEnforcedPermission, HasPermission(CORE_PLANNING_READ_PERMISSION)],
    )
    def missions(self, request: Request, pk=None, *args: Any, **kwargs: Any) -> Response:
        return super().list(request, *args, **kwargs)

    @extend_schema(responses={200: NestedPlanningConfigListSerializer(many=True)})
    @action(
        detail=True,
        methods=["get"],
        permission_classes=[AuthenticationEnforcedPermission, HasPermission(CORE_PLANNING_READ_PERMISSION)],
    )
    def configs(self, request: Request, pk=None, *args: Any, **kwargs: Any) -> Response:
        return super().list(request, *args, **kwargs)

    @extend_schema(
        responses=NestedPlanningConfigBulkSerializer(many=True), request=NestedPlanningConfigBulkSerializer(many=True)
    )
    @action(detail=True, methods=["put"], url_path="configs/bulk", url_name="planning-configs-bulk")
    def bulk_configs(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = self.get_serializer(data=request.data, many=True, instance=self.get_queryset())
        serializer.is_valid(raise_exception=True)
        super(ModelViewSet, self).perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK, headers=headers)

    @staticmethod
    def _build_org_unit_tree(org_units: OrgUnitQuerySet) -> list[dict]:
        # associate each node with its data
        if not org_units:
            return []

        min_depth = org_units.aggregate(min_depth=Min("path__depth"))["min_depth"]

        nodes = {org_unit.pk: {**OrgUnitBuildTreeSerializer(org_unit).data, "children": []} for org_unit in org_units}

        roots = []

        for org_unit in org_units:
            node = nodes[org_unit.pk]
            parent = nodes.get(org_unit.parent_id)

            if parent is not None:
                parent["children"].append(node)
            elif node["depth"] == min_depth:
                roots.append(node)

        return roots

    @extend_schema(
        responses={200: OrgUnitTreeSerializer(many=True)},
    )
    @action(
        detail=True,
        methods=["get"],
        permission_classes=[AuthenticationEnforcedPermission, HasPermission(CORE_PLANNING_READ_PERMISSION)],
        url_path="org-unit-tree",
    )
    def org_unit_tree(self, request, pk=None, *args: Any, **kwargs: Any) -> Response:
        # not self.get_object(): it would run filter_queryset() and instantiate the filterset without the planning
        planning = get_object_or_404(self.get_queryset(), pk=pk)

        filterset = PlanningOrgUnitTreeFilterSet(
            data=request.query_params,
            queryset=OrgUnit.objects.filter_for_user(request.user),
            request=request,
            planning=planning,
        )
        if not filterset.is_valid():
            raise serializers.ValidationError(filterset.errors)

        data = self._build_org_unit_tree(filterset.qs)
        return Response(data)
