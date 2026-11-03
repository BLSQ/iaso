from __future__ import annotations

from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from iaso.api.common import ReadOnlyOrHasPermission
from iaso.api.microplanning.common.filters import PlanningOrgUnitChildrenFilter, validate_planning_has_org_unit_scope
from iaso.api.microplanning.common.mixin import PlanningOrgUnitChildrenQuerysetMixin
from iaso.api.microplanning.org_units.filters import PlanningOrgUnitChildrenFilterBackend
from iaso.api.microplanning.org_units.pagination import PlanningOrgUnitChildrenPagination
from iaso.api.microplanning.org_units.serializers.children import PlanningOrgUnitSerializer
from iaso.api.microplanning.org_units.serializers.level_tree import (
    PlanningLevelGeometryQuerySerializer,
    PlanningLevelGeometrySerializer,
    PlanningLevelTreeNodeSerializer,
)
from iaso.api.microplanning.org_units.serializers.org_unit_table import PlanningOrgUnitTableSerializer
from iaso.api.microplanning.org_units.utils.level_tree import build_level_geometry, build_level_tree
from iaso.models import OrgUnit, Planning
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION


@extend_schema(tags=["Micro plannings", "Plannings", "Planning org units"])  # todo : remove "plannings"
class PlanningOrgUnitsViewSet(PlanningOrgUnitChildrenQuerysetMixin, GenericViewSet):
    """Org units scoped to a planning (nested under ``/plannings/plannings/{pk}/orgunits/``)."""

    queryset = OrgUnit.objects.none()
    serializer_class = PlanningOrgUnitTableSerializer
    http_method_names = ["get", "head", "options"]
    permission_classes = [IsAuthenticated, ReadOnlyOrHasPermission(CORE_PLANNING_WRITE_PERMISSION)]
    search_fields = ["name"]
    ordering_fields = ["id", "name", "org_unit_type__name"]
    ordering = ["id"]
    pagination_class = PlanningOrgUnitChildrenPagination
    filter_backends = [PlanningOrgUnitChildrenFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class = PlanningOrgUnitChildrenFilter
    _planning_for_orgunits = None

    def get_serializer_class(self):
        if self.action in ["children", "root"]:
            return PlanningOrgUnitSerializer
        if self.action in ("children_paginated",):
            return PlanningOrgUnitTableSerializer
        return self.serializer_class

    def get_planning_or_404(self) -> Planning:
        cached: Planning | None = getattr(self, "_planning_for_orgunits", None)
        if cached is not None:
            return cached
        pk = self.kwargs.get("parent_lookup_pk")
        user = self.request.user
        self._planning_for_orgunits = get_object_or_404(
            Planning.objects.filter_for_user(user)
            .select_related("org_unit", "selected_sampling_result__group")
            .prefetch_related("target_org_unit_types"),
            pk=pk,
        )
        return self._planning_for_orgunits

    def get_queryset(self):
        planning = self.get_planning_or_404()
        action = self.action
        user = self.request.user

        if action == "root":
            return OrgUnit.objects.with_geo_json().filter(pk=planning.org_unit_id)

        # The level tree is scoped by the planning levels, not by target types or sampling.
        if action in ("level_tree", "level_geometry"):
            return self._valid_org_units_base_queryset(user)

        validate_planning_has_org_unit_scope(planning)
        queryset = self.get_planning_children_base_queryset(planning, user)

        if action == "children":
            queryset = queryset.with_geo_json()
        elif action == "children_paginated":
            queryset = self.prefetch_planning_assignments(queryset, planning)

        return queryset

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        if getattr(self, "action", None) == "children_paginated":
            ctx["planning"] = self.get_planning_or_404()
        return ctx

    @action(detail=False, methods=["get"])
    def children(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="children-paginated")
    def children_paginated(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def root(self, request, *args, **kwargs):
        instance = self.get_queryset().first()
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        responses=PlanningLevelTreeNodeSerializer(many=True),
        description=(
            "Org units of every planning level, level 0 being the target geography. "
            "A level holds the org units of its types (and groups) located below an org unit of the level above; "
            "`parent_id` is that closest ancestor."
        ),
    )
    @action(detail=False, methods=["get"], url_path="level-tree", pagination_class=None, filter_backends=[])
    def level_tree(self, request, *args, **kwargs):
        nodes = build_level_tree(self.get_planning_or_404(), self._valid_org_units_base_queryset(request.user))
        return Response(PlanningLevelTreeNodeSerializer(nodes, many=True).data)

    @extend_schema(
        parameters=[PlanningLevelGeometryQuerySerializer],
        responses=PlanningLevelGeometrySerializer,
        description="GeoJSON of a level of the level tree: the simplified shape, or the location without shape.",
    )
    @action(
        detail=False,
        methods=["get"],
        url_path="level-tree/geometry",
        pagination_class=None,
        filter_backends=[],
    )
    def level_geometry(self, request, *args, **kwargs):
        query = PlanningLevelGeometryQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        geometry = build_level_geometry(
            self.get_planning_or_404(),
            self._valid_org_units_base_queryset(request.user),
            query.validated_data["level"],
        )
        return Response(geometry)
