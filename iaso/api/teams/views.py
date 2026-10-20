from __future__ import annotations

import typing

from typing import Any, Sequence

import django_filters

from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_spectacular.utils import extend_schema
from rest_framework import filters, permissions, serializers
from rest_framework.decorators import action


if typing.TYPE_CHECKING:
    from rest_framework.generics import BaseFilterProtocol

from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer

from dynamic_fields.filter_backends import DynamicFieldsFilterBackendBackwardCompatible
from hat.audit.audit_mixin import AuditMixin
from iaso.api.common import (
    DeletionFilterBackend,
    ModelViewSet,
    ReadOnlyOrHasPermission,
    is_field_referenced,
)
from iaso.models.team import Team, TeamQuerySet
from iaso.permissions.core_permissions import CORE_TEAMS_PERMISSION

from .filters import (
    TeamAncestorFilterBackend,
    TeamManagersFilterBackend,
    TeamProjectsFilterBackend,
    TeamSearchFilterBackend,
    TeamTreeFilter,
    TeamTypesFilterBackend,
)
from .serializers.audit import AuditTeamSerializer
from .serializers.dropdown import TeamDropdownSerializer
from .serializers.misc import TeamSerializer
from .serializers.tree import TeamBuildTreeSerializer, TeamTreeSerializer


@extend_schema(tags=["Teams"])
class TeamViewSet(AuditMixin, ModelViewSet):
    """Api for teams

    Read access for authenticated users.
    Write access necessitate iaso_teams permissions.
    The tree assignation are handled by settings the child subteams (parent is readonly)
    """

    include_results_key_if_not_paginated = False
    permission_classes = [permissions.IsAuthenticated & ReadOnlyOrHasPermission(CORE_TEAMS_PERMISSION)]  # type: ignore
    serializer_class = TeamSerializer
    queryset = Team.objects.all()
    ordering_fields = ["id", "project__name", "name", "created_at", "updated_at", "type"]
    filterset_fields = {
        "id": ["in"],
        "name": ["icontains"],
        "project": ["exact"],
    }

    audit_serializer = AuditTeamSerializer  # type: ignore

    @property
    def filterset_class(self) -> type[django_filters.FilterSet] | None:
        if self.action == "tree":
            return TeamTreeFilter
        return None

    @property
    def filter_backends(self) -> Sequence[type[filters.BaseFilterBackend] | type[BaseFilterProtocol]]:
        if self.action == "dropdown":
            return [
                TeamAncestorFilterBackend,
                filters.OrderingFilter,
                DjangoFilterBackend,
                TeamSearchFilterBackend,
                DeletionFilterBackend,
                TeamManagersFilterBackend,
                TeamTypesFilterBackend,
                TeamProjectsFilterBackend,
            ]
        if self.action == "tree":
            return [DjangoFilterBackend]

        return [
            TeamAncestorFilterBackend,
            filters.OrderingFilter,
            DjangoFilterBackend,
            TeamSearchFilterBackend,
            DeletionFilterBackend,
            TeamManagersFilterBackend,
            TeamTypesFilterBackend,
            TeamProjectsFilterBackend,
            DynamicFieldsFilterBackendBackwardCompatible,
        ]

    def get_serializer_class(self) -> type[BaseSerializer]:
        if self.action == "dropdown":
            return TeamDropdownSerializer
        if self.action == "tree":
            return TeamTreeSerializer
        return TeamSerializer

    def get_queryset(self) -> TeamQuerySet:
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()

        queryset = self.queryset.filter_for_user(user)

        if self.action == "dropdown":
            return queryset.select_related("project")

        if self.action == "tree":
            filterset = TeamTreeFilter(
                data=self.request.query_params,
                queryset=queryset,
                request=self.request,
            )
            if not filterset.is_valid():
                raise serializers.ValidationError(filterset.errors)

            return (
                queryset.get_tree(
                    root=filterset.form.cleaned_data.get("root"),
                    max_depth=filterset.form.cleaned_data.get("max_depth"),
                )
                .annotate_with_depth()
                .select_related("parent")
                .only("path", "id", "parent", "name", "type")
            )

        queryset = queryset.select_related("project").prefetch_related("users", "users__iaso_profile", "sub_teams")

        requested_fields = self.request.query_params.get("fields", None)
        order = self.request.query_params.get("order", "")

        needs_members_count = is_field_referenced("members_count", requested_fields, order)

        if needs_members_count:
            queryset = queryset.annotate(
                annotated_users_count=Count("users", distinct=True),
                annotated_sub_teams_count=Count("sub_teams", distinct=True),
            )

        return queryset

    @extend_schema(responses={200: TeamDropdownSerializer(many=True)})
    @action(detail=False, methods=["GET"], pagination_class=None)
    def dropdown(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Lightweight endpoint for team dropdowns with minimal data"""
        queryset = self.filter_queryset(self.get_queryset())
        # DeletionFilterBackend only auto-filters on list action, so explicitly filter here
        if request.query_params.get("deletion_status") is None:
            queryset = queryset.filter(deleted_at__isnull=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @staticmethod
    def _build_team_tree(teams: list[Team] | TeamQuerySet) -> list[dict]:
        # associate each node with its data
        nodes = {team.pk: {**TeamBuildTreeSerializer(team).data, "children": []} for team in teams}

        roots = []

        for team in teams:
            node = nodes[team.pk]
            parent = nodes.get(team.parent_id)

            if parent is None or team.parent_id not in nodes:
                roots.append(node)
            else:
                parent["children"].append(node)
        return roots

    @extend_schema(responses={200: TeamTreeSerializer(many=True)})
    @action(detail=False, methods=["GET"], pagination_class=None)
    def tree(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        queryset = self.get_queryset()
        data = self._build_team_tree(queryset)
        return Response(data)
