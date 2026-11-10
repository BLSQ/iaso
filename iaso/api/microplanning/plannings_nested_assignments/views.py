from __future__ import annotations

from collections.abc import Sequence
from typing import TYPE_CHECKING, Any

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
from iaso.api.microplanning.plannings_nested_assignments.filters import OrgUnitFilterSet
from iaso.api.microplanning.plannings_nested_assignments.pagination import PlanningNestedAssignmentPagination
from iaso.api.microplanning.plannings_nested_assignments.serializers.org_units import AssignmentOrgUnitSerializer
from iaso.models import Assignment, Planning
from iaso.models.microplanning.assignments import AssignmentQuerySet
from iaso.models.microplanning.plannings import PlanningQuerySet
from iaso.permissions.core_permissions import CORE_PLANNING_READ_PERMISSION


if TYPE_CHECKING:
    from django_filters.filterset import BaseFilterSet
    from rest_framework.generics import BaseFilterProtocol


class PlanningNestedAssignmentViews(NestedParentLookupMixin, GenericViewSet):
    queryset = Assignment.objects.none()
    permission_classes = [IsAuthenticated, HasPermission(CORE_PLANNING_READ_PERMISSION)]
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]
    ordering = ["id"]

    @property
    def pagination_class(self) -> type[BasePagination] | None:
        if self.action == "org_units":
            return PlanningNestedAssignmentPagination
        return None

    def get_serializer_class(self):
        if self.action == "org_units":
            return AssignmentOrgUnitSerializer
        raise NotImplementedError(f"Serializer not implemented for action {self.action}")

    @property
    def filter_backends(self) -> Sequence[type[filters.BaseFilterBackend] | type[BaseFilterProtocol]]:
        if self.action == "org_units":
            return [filters.OrderingFilter, DjangoFilterBackend]
        return []

    @property
    def filterset_class(self) -> type[BaseFilterSet] | None:
        if self.action == "org_units":
            return OrgUnitFilterSet
        return None

    def get_parent_queryset(self) -> PlanningQuerySet:
        user = self.request.user
        if not user:
            return Planning.objects.none()

        return Planning.objects.filter_for_user(user)

    def get_queryset(self) -> AssignmentQuerySet:
        parent = self.get_parent_instance()

        user = self.request.user
        if not user:
            return Assignment.objects.none()

        if self.action == "org_units":
            return parent.assignment_set.only("org_unit_id", "planning_id", "id", "user_id", "team_id")

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
