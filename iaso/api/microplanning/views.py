from django.db import transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import gettext as _
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_spectacular.utils import extend_schema
from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from hat.audit.audit_mixin import AuditMixin
from hat.audit.models import Modification
from iaso.api.common import (
    DeletionFilterBackend,
    HasPermission,
    ModelViewSet,
    ReadOnlyOrHasPermission,
)
from iaso.api.permission_checks import AuthenticationEnforcedPermission
from iaso.models.microplanning import Assignment, Planning
from iaso.models.missions import MissionWithForms
from iaso.models.org_unit import OrgUnit
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION

from .filters import (
    PlanningOrgUnitChildrenFilter,
    PlanningOrgUnitChildrenFilterBackend,
    PlanningSearchFilterBackend,
    PublishingStatusFilterBackend,
    validate_planning_has_org_unit_scope,
)
from .mixins import PlanningOrgUnitChildrenQuerysetMixin
from .pagination import PlanningOrgUnitChildrenPagination
from .serializers import (
    AssignmentSerializer,
    AuditAssignmentSerializer,
    AuditMissionSerializer,
    AuditPlanningSerializer,
    BulkAssignmentSerializer,
    BulkDeleteAssignmentResponseSerializer,
    BulkDeleteAssignmentSerializer,
    MissionReadSerializer,
    MissionWriteSerializer,
    PlanningOrgUnitSerializer,
    PlanningOrgUnitTableSerializer,
    PlanningReadSerializer,
    PlanningSamplingResult,
    PlanningSamplingResultListSerializer,
    PlanningSamplingResultReadSerializer,
    PlanningSamplingResultWriteSerializer,
    PlanningWriteSerializer,
)


@extend_schema(tags=["Micro plannings", "Org units", "Plannings"])
class PlanningOrgunitsViewSet(PlanningOrgUnitChildrenQuerysetMixin, GenericViewSet):
    """Org units scoped to a planning (nested under ``/microplanning/plannings/{pk}/orgunits/``)."""

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

    def get_serializer_class(self):
        if self.action == "children":
            return PlanningOrgUnitSerializer
        if self.action in ("children_paginated",):
            return PlanningOrgUnitTableSerializer
        if self.action == "root":
            return PlanningOrgUnitSerializer
        return self.serializer_class

    def get_planning_or_404(self) -> Planning:
        cached = getattr(self, "_planning_for_orgunits", None)
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


@extend_schema(tags=["Micro plannings", "Plannings"])
class PlanningViewSet(AuditMixin, ModelViewSet):
    include_results_key_if_not_paginated = False
    permission_classes = [AuthenticationEnforcedPermission, HasPermission(CORE_PLANNING_WRITE_PERMISSION)]  # type: ignore
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

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return PlanningWriteSerializer
        return PlanningReadSerializer

    def get_queryset(self):
        user = self.request.user
        return (
            self.queryset.filter_for_user(user)
            .select_related("project", "org_unit", "team", "selected_sampling_result")
            .prefetch_related(
                "target_org_unit_types",
                "missions",
                "missions__mission_forms__form",
                "missions__org_unit_type",
                "missions__entity_type",
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


@extend_schema(tags=["Micro plannings", "Planning samplings", "Plannings"])
class PlanningSamplingResultViewSet(AuditMixin, ModelViewSet):
    """List/create sampling results scoped by planning."""

    include_results_key_if_not_paginated = False
    http_method_names = ["get", "post", "head", "options"]
    permission_classes = [IsAuthenticated, ReadOnlyOrHasPermission(CORE_PLANNING_WRITE_PERMISSION)]
    serializer_class = PlanningSamplingResultReadSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = [
        "id",
        "created_at",
        "pipeline_id",
        "pipeline_version",
        "pipeline_name",
        "task_id",
        "group_id",
        "planning_id",
    ]

    def get_serializer_class(self):
        if self.action == "create":
            return PlanningSamplingResultWriteSerializer
        return PlanningSamplingResultReadSerializer

    def get_queryset(self):
        user = self.request.user
        return (
            PlanningSamplingResult.objects.filter(planning__project__account=user.iaso_profile.account)
            .select_related("planning", "created_by", "group", "task")
            .prefetch_related("group__org_units")
        )

    def list(self, request, *args, **kwargs):
        query_serializer = PlanningSamplingResultListSerializer(data=request.query_params, context={"request": request})
        query_serializer.is_valid(raise_exception=True)
        planning = query_serializer.validated_data["planning_id"]

        queryset = self.filter_queryset(self.get_queryset().filter(planning=planning))

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        read_serializer = PlanningSamplingResultReadSerializer(serializer.instance, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)


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
            planning=planning, org_unit__in=org_units, deleted_at__isnull=True
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
            Assignment.objects.filter(planning=planning, deleted_at__isnull=True)
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


class MissionViewSet(AuditMixin, ModelViewSet):
    remove_results_key_if_paginated = True
    permission_classes = [AuthenticationEnforcedPermission, ReadOnlyOrHasPermission(CORE_PLANNING_WRITE_PERMISSION)]  # type: ignore
    queryset = MissionWithForms.objects.all()
    filter_backends = [
        filters.OrderingFilter,
        DjangoFilterBackend,
        DeletionFilterBackend,
    ]
    ordering_fields = ["id", "name", "mission_type", "created_at"]
    filterset_fields = {
        "mission_type": ["exact"],
        "name": ["icontains"],
    }
    audit_serializer = AuditMissionSerializer  # type: ignore

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return MissionWriteSerializer
        return MissionReadSerializer

    def get_queryset(self):
        user = self.request.user
        return (
            self.queryset.filter_for_user(user)
            .select_related("org_unit_type", "entity_type")
            .prefetch_related("mission_forms__form")
        )

    def _read_response(self, instance, status_code=status.HTTP_200_OK):
        read_serializer = MissionReadSerializer(instance, context=self.get_serializer_context())
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
