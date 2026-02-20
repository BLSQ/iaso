from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext as _
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from hat.audit.audit_mixin import AuditMixin
from hat.audit.models import Modification
from iaso.api.common import (
    DeletionFilterBackend,
    ModelViewSet,
    ReadOnlyOrHasPermission,
)
from iaso.api.permission_checks import AuthenticationEnforcedPermission
from iaso.models.microplanning import Assignment, Planning
from iaso.models.org_unit import OrgUnit
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION

from .filters import (
    PlanningSearchFilterBackend,
    PublishingStatusFilterBackend,
)
from .serializers import (
    AssignmentSerializer,
    AuditAssignmentSerializer,
    AuditPlanningSerializer,
    BulkAssignmentSerializer,
    BulkDeleteAssignmentSerializer,
    PlanningOrgUnitListSerializer,
    PlanningOrgUnitSerializer,
    PlanningReadSerializer,
    PlanningSamplingResult,
    PlanningSamplingResultListSerializer,
    PlanningSamplingResultReadSerializer,
    PlanningSamplingResultWriteSerializer,
    PlanningWriteSerializer,
)


class PlanningOrgunitsViewSet(AuditMixin, ViewSet):
    """List orgunits for a planning."""

    http_method_names = ["get", "head", "options"]
    permission_classes = [IsAuthenticated, ReadOnlyOrHasPermission(CORE_PLANNING_WRITE_PERMISSION)]

    @action(detail=False, methods=["get"])
    def children(self, request, *args, **kwargs):
        planning = self._get_planning(request)

        user = request.user
        base_queryset = (
            OrgUnit.objects.with_geo_json().filter_for_user(user).filter(validation_status=OrgUnit.VALIDATION_VALID)
        )
        sampling = planning.selected_sampling_result
        root_org_unit = planning.org_unit

        if sampling and sampling.group_id:
            queryset = base_queryset.filter(pk__in=sampling.group.org_units.values_list("pk", flat=True))
        elif root_org_unit and planning.target_org_unit_type:
            queryset = base_queryset.descendants(root_org_unit).filter(org_unit_type=planning.target_org_unit_type)
        else:
            raise ValidationError({"planning": [_("Planning is missing sampling group or target org unit scope")]})

        children_queryset = queryset.order_by("id")
        serializer_children = PlanningOrgUnitSerializer(children_queryset, many=True)

        return Response(serializer_children.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def root(self, request, *args, **kwargs):
        planning = self._get_planning(request)
        root_queryset = OrgUnit.objects.with_geo_json().filter(pk=planning.org_unit_id).first()
        root_serializer = PlanningOrgUnitSerializer(root_queryset)
        return Response(root_serializer.data, status=status.HTTP_200_OK)

    def _get_planning(self, request):
        query_serializer = PlanningOrgUnitListSerializer(data=request.query_params, context={"request": request})
        query_serializer.is_valid(raise_exception=True)
        return Planning.objects.select_related(
            "org_unit", "target_org_unit_type", "selected_sampling_result__group"
        ).get(pk=query_serializer.validated_data["planning"].id)


class PlanningViewSet(AuditMixin, ModelViewSet):
    remove_results_key_if_paginated = True
    permission_classes = [AuthenticationEnforcedPermission, ReadOnlyOrHasPermission(CORE_PLANNING_WRITE_PERMISSION)]  # type: ignore
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
            .prefetch_related("forms")
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


class PlanningSamplingResultViewSet(AuditMixin, ModelViewSet):
    """List/create sampling results scoped by planning."""

    remove_results_key_if_paginated = True
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
        """More a bulk create or update, since existing assignments would be modified"""
        serializer = BulkAssignmentSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        # Handle the save logic in the view (following codebase patterns)
        team = serializer.validated_data.get("team")
        user = serializer.validated_data.get("user")
        planning = serializer.validated_data["planning"]
        requester = request.user

        org_units = serializer.validated_data["org_units"]
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

    @action(methods=["POST"], detail=False)
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
