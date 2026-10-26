from __future__ import annotations

import typing

from typing import Any, Sequence

import django_filters

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Prefetch
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import filters, permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.settings import api_settings

from .serializers.create import TeamCreateSerializer
from .serializers.list import TeamListSerializer
from .serializers.retrieve import TeamRetrieveSerializer
from .serializers.update import TeamUpdateSerializer


if typing.TYPE_CHECKING:
    from rest_framework.generics import BaseFilterProtocol

from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer

from dynamic_fields.filter_backends import DynamicFieldsFilterBackendBackwardCompatible
from hat.audit.audit_mixin import AuditMixin
from iaso.api.common import (
    ModelViewSet,
    ReadOnlyOrHasPermission,
    is_field_referenced,
)
from iaso.models.team import Team, TeamQuerySet
from iaso.permissions.core_permissions import CORE_TEAMS_PERMISSION

from .filters import (
    TeamDropdownFilter,
    TeamListFilter,
    TeamTreeFilter,
)
from .serializers.audit import AuditTeamSerializer
from .serializers.dropdown import TeamDropdownSerializer
from .serializers.tree import TeamBuildTreeSerializer, TeamTreeSerializer


@extend_schema(tags=["Teams"])
class TeamViewSet(AuditMixin, ModelViewSet):
    """Api for teams

    Read access for authenticated users.
    Write access necessitate iaso_teams permissions.
    The tree assignation are handled by settings the child subteams (parent is readonly)
    """

    permission_classes = [permissions.IsAuthenticated & ReadOnlyOrHasPermission(CORE_TEAMS_PERMISSION)]  # type: ignore
    queryset = Team.objects.all()
    ordering_fields = ["id", "project__name", "name", "created_at", "updated_at", "type"]
    ordering = ["name"]

    filterset_fields = {
        "id": ["in"],
        "name": ["icontains"],
        "project": ["exact"],
    }
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]
    audit_serializer = AuditTeamSerializer

    @property
    def filterset_class(self) -> type[django_filters.FilterSet] | None:
        if self.action == "tree":
            return TeamTreeFilter
        if self.action == "list":
            return TeamListFilter
        if self.action == "dropdown":
            return TeamDropdownFilter
        return None

    @property
    def filter_backends(self) -> Sequence[type[filters.BaseFilterBackend] | type[BaseFilterProtocol]]:
        if self.action == "dropdown":
            return [filters.OrderingFilter, DjangoFilterBackend]
        if self.action == "tree":
            return [DjangoFilterBackend]

        if self.action == "list":
            return [filters.OrderingFilter, DjangoFilterBackend, DynamicFieldsFilterBackendBackwardCompatible]

        return []

    def get_serializer_class(self) -> type[BaseSerializer]:
        if self.action == "dropdown":
            return TeamDropdownSerializer
        if self.action == "tree":
            return TeamTreeSerializer
        if self.action == "list":
            return TeamListSerializer
        if self.action == "retrieve":
            return TeamRetrieveSerializer
        if self.action == "create":
            return TeamCreateSerializer
        if self.action in ("update", "partial_update"):
            return TeamUpdateSerializer
        if self.action == "destroy":
            return serializers.Serializer
        raise NotImplementedError(f"Serializer not implemented for action: {self.action}.")

    def get_queryset(self) -> TeamQuerySet:
        user = self.request.user

        if not user.is_authenticated:
            return self.queryset.none()

        queryset = self.queryset.filter_for_user(user)

        if self.action in ["destroy", "update", "partial_update"]:
            # necessary because of the audit mixin that serialize it all before/after the mutation
            return queryset.select_related("project", "manager", "parent").prefetch_related(
                Prefetch("users", queryset=get_user_model().objects.only("id")),
                Prefetch("sub_teams", queryset=Team.objects.only("id", "parent")),
            )

        if self.action == "dropdown":
            return queryset.only("id", "name", "color")

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
                .prefetch_related(
                    Prefetch(
                        "users",
                        queryset=get_user_model()
                        .objects.only(
                            "id",
                            "username",
                            "first_name",
                            "last_name",
                            "iaso_profile",
                            "iaso_profile__id",
                            "iaso_profile__color",
                        )
                        .select_related("iaso_profile")
                        .order_by("id"),
                    )
                )
                .only("path", "id", "parent", "name", "type", "color")
                .order_by("id")
            )

        if self.action == "list":
            queryset = queryset.select_related("project").prefetch_related(
                Prefetch("users", get_user_model().objects.only("id", "username").order_by("id")),
                Prefetch(
                    "sub_teams",
                    Team.objects_include_deleted.filter_for_user(user)
                    .only("id", "name", "deleted_at", "color", "parent")
                    .order_by("id"),
                ),
            )

            order = self.request.query_params.get(api_settings.ORDERING_PARAM, "")

            requested_fields = self.request.query_params.get(settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME, None)

            needs_members_count = is_field_referenced("members_count", requested_fields, order)

            if needs_members_count:
                queryset = queryset.annotate(
                    annotated_users_count=Count("users", distinct=True),
                    annotated_sub_teams_count=Count("sub_teams", distinct=True),
                )
            return queryset

        if self.action == "retrieve":
            queryset = queryset.select_related(
                "project", "manager", "parent", "manager__iaso_profile"
            ).prefetch_related(
                Prefetch(
                    "users",
                    get_user_model()
                    .objects.select_related("iaso_profile")
                    .only("id", "username", "first_name", "last_name", "iaso_profile"),
                ),
                Prefetch(
                    "sub_teams",
                    Team.objects_include_deleted.filter_for_user(user)
                    .only("id", "name", "deleted_at", "color", "parent")
                    .order_by("id"),
                ),
            )
            return queryset

        return queryset

    @extend_schema(responses={200: TeamDropdownSerializer(many=True)})
    @action(detail=False, methods=["GET"], pagination_class=None)
    def dropdown(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Lightweight endpoint for team dropdowns with minimal data"""
        queryset = self.filter_queryset(self.get_queryset())
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

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # soft deletable
        instance.updated_by = request.user
        instance.save(update_fields=["updated_by"])

        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
