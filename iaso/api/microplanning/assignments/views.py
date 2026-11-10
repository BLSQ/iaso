from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from hat.audit.audit_mixin import AuditMixin
from hat.audit.models import Modification
from iaso.api.common import DeletionFilterBackend, ModelViewSet, ReadOnlyOrHasPermission
from iaso.api.microplanning.assignments.serializers.audit import AuditAssignmentSerializer
from iaso.api.microplanning.assignments.serializers.bulk import BulkAssignmentSerializer
from iaso.api.microplanning.assignments.serializers.bulk_delete import (
    BulkDeleteAssignmentResponseSerializer,
    BulkDeleteAssignmentSerializer,
)
from iaso.api.microplanning.assignments.serializers.misc import AssignmentSerializer
from iaso.api.microplanning.common.filters import PublishingStatusFilterBackend
from iaso.api.microplanning.common.mixin import PlanningOrgUnitChildrenQuerysetMixin
from iaso.models import Assignment, Planning
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION


@extend_schema(tags=["Micro plannings", "Assignments"])
class AssignmentViewSet(PlanningOrgUnitChildrenQuerysetMixin, AuditMixin, ModelViewSet):
    """Use the same permission as planning. Multi tenancy is done via the planning. An assignment don't make much
    sense outside of it's planning."""

    include_results_key_if_not_paginated = False
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

    @extend_schema(
        request=BulkAssignmentSerializer,
        responses=AssignmentSerializer(many=True),
        parameters=[],
        filters=False,
        description=(
            "Bulk create or update assignments for org units selected from the planning children scope. "
            "Optional `org_unit_parent_id`, `org_unit_type_ids`, and `search` narrow the scope "
            "(same rules as children-paginated). Selection is applied with `select_all`, "
            "`selected_ids`, and `unselected_ids`. Exactly one of `team` or `user` must be set. "
            "Existing assignments for the same planning and org unit are updated in place."
        ),
    )
    @action(methods=["POST"], detail=False, filter_backends=[], pagination_class=None)
    def bulk_create_assignments(self, request):
        """More a bulk create or update, since existing assignments would be modified"""
        serializer = BulkAssignmentSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        # Handle the save logic in the view (following codebase patterns)
        team = serializer.validated_data.get("team")
        user = serializer.validated_data.get("user")
        planning = serializer.validated_data["planning"]
        requester = request.user

        planning = (
            Planning.objects.filter_for_user(requester)
            .select_related("org_unit", "selected_sampling_result__group")
            .prefetch_related("target_org_unit_types")
            .get(pk=planning.pk)
        )
        org_units = list(self.get_bulk_assign_org_units_queryset(planning, requester, serializer.validated_data))

        assignments_to_update = Assignment.objects.select_related("user", "team", "org_unit").filter(
            planning=planning, org_unit__in=org_units
        )
        assignment_values = list(assignments_to_update.values("id", "org_unit_id"))
        assignment_ids_to_update = [assignment["id"] for assignment in assignment_values]
        org_units_to_exclude = {assignment["org_unit_id"] for assignment in assignment_values}
        audit_for_update = []
        for assignment in assignments_to_update:
            # serialize old_value
            old_value = [AuditAssignmentSerializer(instance=assignment).data]
            assignment.team = team
            assignment.user = user
            new_value = [AuditAssignmentSerializer(instance=assignment).data]
            audit = Modification(
                user=requester,
                past_value=old_value,
                new_value=new_value,
                content_object=assignment,
                source="API " + request.method + request.path,
            )
            audit_for_update.append(audit)
        now = timezone.now().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        with transaction.atomic():
            Assignment.objects.bulk_update(assignments_to_update, ["user", "team"])
            for modification in audit_for_update:
                modification.new_value = [{**modification.new_value[0], "updated_at": now}]
            Modification.objects.bulk_create(audit_for_update)

        org_units_for_creation = [org_unit for org_unit in org_units if org_unit.pk not in org_units_to_exclude]
        created_assignments = []
        audit_for_create = []
        for org_unit in org_units_for_creation:
            new_assignment = Assignment(
                planning=planning, user=user, created_by=requester, org_unit=org_unit, team=team
            )
            created_assignments.append(new_assignment)

        with transaction.atomic():
            new_assignments = Assignment.objects.bulk_create(created_assignments)
            for new_assignment in new_assignments:
                new_value = [AuditAssignmentSerializer(instance=new_assignment).data]
                audit = Modification(
                    user=requester,
                    past_value=[],
                    new_value=new_value,
                    content_object=new_assignment,
                    source="API " + request.method + request.path,
                )
                audit_for_create.append(audit)
            Modification.objects.bulk_create(audit_for_create)
        new_assignments_ids = [assignment.id for assignment in new_assignments]
        all_ids = new_assignments_ids + assignment_ids_to_update
        assignments_list = Assignment.objects.select_related(
            "user", "team", "org_unit", "org_unit__org_unit_type"
        ).filter(id__in=all_ids)

        return_serializer = AssignmentSerializer(assignments_list, many=True, context={"request": request})
        return Response(return_serializer.data)

    @extend_schema(
        request=BulkDeleteAssignmentSerializer,
        responses=BulkDeleteAssignmentResponseSerializer,
        parameters=[],
        filters=False,
        description=("Soft-delete assignments for a planning, optionally filtered by `user` and/or `team`."),
    )
    @action(methods=["POST"], detail=False, filter_backends=[], pagination_class=None)
    def bulk_delete_assignments(self, request):
        """Bulk soft delete all assignments for a specific planning.

        Marks all assignments linked to the specified planning as deleted using the deleted_at field.
        """
        serializer = BulkDeleteAssignmentSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        # Handle the save logic in the view (following codebase patterns)
        planning = serializer.validated_data["planning"]
        user = serializer.validated_data.get("user", None)
        team = serializer.validated_data.get("team", None)
        requester = request.user

        # Get all assignments for this planning that are not already deleted
        assignments = (
            Assignment.objects.filter(planning=planning)
            .select_related("user", "team", "org_unit")
            .filter_for_user(requester)
        )

        if user:
            assignments = assignments.filter(user=user)
        if team:
            assignments = assignments.filter(team=team)

        if not assignments.exists():
            return Response(
                {
                    "message": _("No assignments to delete"),
                    "deleted_count": 0,
                    "planning_id": planning.id,
                    "user": user.id if user else None,
                }
            )

        old_serialized = {a.id: AuditAssignmentSerializer(a).data for a in assignments}

        # Store assignment IDs before update for audit trail
        assignment_ids = list(assignments.values_list("id", flat=True))
        with transaction.atomic():
            deleted_count = assignments.update(deleted_at=timezone.now())
            updated_assignments = Assignment.objects.in_bulk(assignment_ids)
            audit_list = []

            # Create audit entries for each deleted assignment
            for assignment_id, assignment in updated_assignments.items():
                old_value = [old_serialized[assignment_id]]
                new_value = [AuditAssignmentSerializer(instance=assignment).data]
                modification = Modification(
                    user=requester,
                    past_value=old_value,
                    new_value=new_value,
                    content_object=assignment,
                    source="API " + request.method + request.path,
                )
                audit_list.append(modification)
            Modification.objects.bulk_create(audit_list)

        return Response(
            {
                "message": _("Successfully deleted %(count)s assignments") % {"count": deleted_count},
                "deleted_count": deleted_count,
                "planning_id": planning.id,
                "user": user.id if user else None,
            }
        )
