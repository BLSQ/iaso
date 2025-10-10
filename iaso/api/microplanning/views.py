from django.utils import timezone
from django.utils.translation import gettext as _
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from hat.audit.audit_mixin import AuditMixin
from hat.audit.models import Modification
from iaso.api.common import (
    DeletionFilterBackend,
    ModelViewSet,
    ReadOnlyOrHasPermission,
)
from iaso.models.microplanning import Assignment, Planning, Team
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION, CORE_TEAMS_PERMISSION

from .filters import (
    PlanningSearchFilterBackend,
    PublishingStatusFilterBackend,
    TeamAncestorFilterBackend,
    TeamManagersFilterBackend,
    TeamProjectsFilterBackend,
    TeamSearchFilterBackend,
    TeamTypesFilterBackend,
)
from .serializers import (
    AssignmentSerializer,
    AuditAssignmentSerializer,
    AuditPlanningSerializer,
    AuditTeamSerializer,
    BulkAssignmentSerializer,
    BulkDeleteAssignmentSerializer,
    PlanningSerializer,
    TeamSerializer,
)


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


class PlanningViewSet(AuditMixin, ModelViewSet):
    remove_results_key_if_paginated = True
    permission_classes = [ReadOnlyOrHasPermission(CORE_PLANNING_WRITE_PERMISSION)]  # type: ignore
    serializer_class = PlanningSerializer
    queryset = Planning.objects.all()
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
        PublishingStatusFilterBackend,
        PlanningSearchFilterBackend,
        DeletionFilterBackend,
    ]
    ordering_fields = ["id", "name", "started_at", "ended_at", "project__name", "org_unit__name"]
    filterset_fields = {
        "name": ["icontains"],
        "started_at": ["gte", "lte"],
        "ended_at": ["gte", "lte"],
    }
    audit_serializer = AuditPlanningSerializer  # type: ignore

    def get_queryset(self):
        user = self.request.user
        return (
            self.queryset.filter_for_user(user).select_related("project", "org_unit", "team").prefetch_related("forms")
        )


class AssignmentViewSet(AuditMixin, ModelViewSet):
    """Use the same permission as planning. Multi tenancy is done via the planning. An assignment don't make much
    sense outside of it's planning."""

    remove_results_key_if_paginated = True
    permission_classes = [IsAuthenticated, ReadOnlyOrHasPermission(CORE_PLANNING_WRITE_PERMISSION)]
    serializer_class = AssignmentSerializer
    queryset = Assignment.objects.all()
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
        PublishingStatusFilterBackend,
        DeletionFilterBackend,
    ]
    ordering_fields = ["id", "team__name", "user__username"]
    filterset_fields = {
        "planning": ["exact"],
        "team": ["exact"],
    }
    audit_serializer = AuditAssignmentSerializer

    def get_queryset(self):
        user = self.request.user
        return self.queryset.filter_for_user(user).select_related("user", "team", "org_unit", "org_unit__org_unit_type")

    @action(methods=["POST"], detail=False)
    def bulk_create_assignments(self, request):
        serializer = BulkAssignmentSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        # Handle the save logic in the view (following codebase patterns)
        team = serializer.validated_data.get("team")
        user = serializer.validated_data.get("user")
        planning = serializer.validated_data["planning"]
        requester = request.user
        assignments_list = []

        for org_unit in serializer.validated_data["org_units"]:
            # Only consider non-deleted assignments for get_or_create
            assignment, created = Assignment.objects.filter(deleted_at__isnull=True).get_or_create(
                planning=planning, org_unit=org_unit, defaults={"created_by": requester}
            )
            old_value = []
            if not created:
                old_value = [AuditAssignmentSerializer(instance=assignment).data]

            assignment.deleted_at = None
            assignment.team = team
            assignment.user = user
            assignments_list.append(assignment)
            assignment.save()

            new_value = [AuditAssignmentSerializer(instance=assignment).data]
            Modification.objects.create(
                user=requester,
                past_value=old_value,
                new_value=new_value,
                content_object=assignment,
                source="API " + request.method + request.path,
            )

        return_serializer = AssignmentSerializer(assignments_list, many=True, context={"request": request})
        return Response(return_serializer.data)

    @action(methods=["POST"], detail=False)
    def bulk_delete_assignments(self, request):
        """Bulk soft delete all assignments for a specific planning.

        Marks all assignments linked to the specified planning as deleted using the deleted_at field.
        """
        serializer = BulkDeleteAssignmentSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        # Handle the save logic in the view (following codebase patterns)
        planning = serializer.validated_data["planning"]
        requester = request.user

        # Get all assignments for this planning that are not already deleted
        assignments = Assignment.objects.filter(planning=planning, deleted_at__isnull=True).filter_for_user(requester)

        if not assignments.exists():
            return Response(
                {
                    "message": _("No assignments to delete"),
                    "deleted_count": 0,
                    "planning_id": planning.id,
                }
            )

        # Store assignment IDs before update for audit trail
        assignment_ids = list(assignments.values_list("id", flat=True))
        deleted_count = assignments.update(deleted_at=timezone.now())

        # Create audit entries for each deleted assignment
        for assignment_id in assignment_ids:
            assignment = Assignment.objects.get(id=assignment_id)
            old_value = [AuditAssignmentSerializer(instance=assignment).data]
            new_value = [AuditAssignmentSerializer(instance=assignment).data]
            Modification.objects.create(
                user=requester,
                past_value=old_value,
                new_value=new_value,
                content_object=assignment,
                source="API " + request.method + request.path,
            )

        return Response(
            {
                "message": _("Successfully deleted %(count)s assignments") % {"count": deleted_count},
                "deleted_count": deleted_count,
                "planning_id": planning.id,
            }
        )
