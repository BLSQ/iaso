from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters

from hat.audit.audit_mixin import AuditMixin
from iaso.api.common import (
    DeletionFilterBackend,
    ModelViewSet,
    ReadOnlyOrHasPermission,
)
from iaso.models.team import Team
from iaso.permissions.core_permissions import CORE_TEAMS_PERMISSION

from .filters import (
    TeamAncestorFilterBackend,
    TeamManagersFilterBackend,
    TeamProjectsFilterBackend,
    TeamSearchFilterBackend,
    TeamTypesFilterBackend,
)
from .serializers import AuditTeamSerializer, TeamSerializer


class TeamViewSet(AuditMixin, ModelViewSet):
    """Api for teams

    Read access for all auth users.
    Write access necessitate iaso_teams permissions.
    The tree assignation are handled by settings the child subteams (parent is readonly)
    """

    remove_results_key_if_paginated = True
    filter_backends = [
        TeamAncestorFilterBackend,
        filters.OrderingFilter,
        DjangoFilterBackend,
        TeamSearchFilterBackend,
        DeletionFilterBackend,
        TeamManagersFilterBackend,
        TeamTypesFilterBackend,
        TeamProjectsFilterBackend,
    ]
    permission_classes = [ReadOnlyOrHasPermission(CORE_TEAMS_PERMISSION)]  # type: ignore
    serializer_class = TeamSerializer
    queryset = Team.objects.all()
    ordering_fields = ["id", "project__name", "name", "created_at", "updated_at", "type"]
    filterset_fields = {
        "id": ["in"],
        "name": ["icontains"],
        "project": ["exact"],
    }

    audit_serializer = AuditTeamSerializer  # type: ignore

    def get_queryset(self):
        user = self.request.user
        return self.queryset.filter_for_user(user).select_related("project").prefetch_related("users", "sub_teams")

