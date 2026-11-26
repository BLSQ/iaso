import datetime

from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import (
    BooleanField,
    Case,
    Count,
    DateTimeField,
    Exists,
    F,
    Min,
    OuterRef,
    Prefetch,
    Q,
    Subquery,
    Value,
    When,
    Window,
)
from django.db.models.functions import Coalesce, Lag
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from iaso.api.common.mixin import CustomPaginationListModelMixin
from iaso.api.common.permissions import HasModulePermission
from iaso.api.validation_workflow_instances.filters import QUEUE_FILTERS, ValidationWorkflowInstancesListFilters
from iaso.api.validation_workflow_instances.pagination import ValidationWorkflowInstancePagination
from iaso.api.validation_workflow_instances.permissions import (
    HasValidationWorkflowInstancePermission,
)
from iaso.api.validation_workflow_instances.serializers.counts import ValidationWorkflowInstanceCountsSerializer
from iaso.api.validation_workflow_instances.serializers.list import ValidationWorkflowInstanceListSerializer
from iaso.api.validation_workflow_instances.serializers.retrieve import ValidationWorkflowInstanceRetrieveSerializer
from iaso.models import Instance, OrgUnit, UserRole, ValidationNode, ValidationNodeTemplate
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus
from iaso.modules import MODULE_VALIDATION_WORKFLOW


@extend_schema(tags=["Validation nodes"])
class ValidationWorkflowInstanceViewSet(RetrieveModelMixin, CustomPaginationListModelMixin, GenericViewSet):
    methods = ["get"]
    serializer_class = ValidationWorkflowInstanceRetrieveSerializer
    permission_classes = [
        IsAuthenticated,
        HasModulePermission(MODULE_VALIDATION_WORKFLOW),
        HasValidationWorkflowInstancePermission,
    ]
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]
    filterset_class = ValidationWorkflowInstancesListFilters
    pagination_class = ValidationWorkflowInstancePagination
    ordering = ["-last_updated"]
    ordering_fields = ["id", "last_updated", "pending_since", "general_validation_status"]

    @property
    def filter_backends(self):
        if self.action == "list":
            return [OrderingFilter, DjangoFilterBackend]
        return [DjangoFilterBackend]

    def get_serializer_class(self):
        if self.action == "list":
            return ValidationWorkflowInstanceListSerializer
        if self.action == "counts":
            return ValidationWorkflowInstanceCountsSerializer
        return ValidationWorkflowInstanceRetrieveSerializer

    def get_queryset(self):
        qs = Instance.objects.filter_for_user(user=self.request.user).filter(
            form__deleted_at__isnull=True, form__validation_workflow__deleted_at__isnull=True
        )

        if self.action == "retrieve":
            return qs.select_related("form__validation_workflow").prefetch_related(
                Prefetch(
                    "validationnode_set",
                    queryset=ValidationNode.objects.select_related("instance", "created_by", "updated_by", "node")
                    .prefetch_related("node__roles_required")
                    .order_by("-created_at"),
                    to_attr="prefetched_validation_nodes",
                ),
                Prefetch(
                    "form__validation_workflow__node_templates",
                    queryset=ValidationNodeTemplate.objects.prefetch_related(
                        Prefetch(
                            "next_node_templates",
                            queryset=ValidationNodeTemplate.objects.order_by("id"),
                            to_attr="prefetched_next_nodes",
                        )
                    ).annotate(
                        has_previous=Exists(
                            ValidationNodeTemplate.previous_node_templates.through.objects.filter(
                                to_validationnodetemplate_id=OuterRef("pk")
                            )
                        )
                    ),
                ),
                Prefetch(
                    "validationnode_set",
                    queryset=(
                        ValidationNode.objects.filter(
                            Q(status=ValidationNodeStatus.SUBMISSION) | Q(status=ValidationNodeStatus.NEW_VERSION)
                        )
                        .select_related(
                            "instance",
                            "created_by",
                            "updated_by",
                            "node",
                        )
                        .annotate(
                            next_created_at=Window(
                                expression=Lag("created_at"),
                                order_by=F("created_at").desc(),
                            )
                        )
                        .order_by("-created_at")
                    ),
                    to_attr="prefetched_submission_nodes",
                ),
            )
        if self.action in ("list", "counts"):
            qs = self._annotate_for_queue(qs)
            if self.action == "list":
                qs = self._prefetch_for_list(self._annotate_last_updated(qs))

        return qs

    def _get_actionable_node_templates(self):
        """Steps the user is allowed to complete: like the engine, the user must have ALL the roles of the step."""
        user = self.request.user
        node_templates = ValidationNodeTemplate.objects.filter(workflow__account=user.iaso_profile.account)
        if user.is_superuser:
            return node_templates
        user_role_ids = user.iaso_profile.user_roles.values("pk")
        return node_templates.exclude(roles_required__in=UserRole.objects.exclude(pk__in=user_role_ids))

    def _annotate_for_queue(self, qs):
        user = self.request.user
        # soft deleted submissions are not to be validated anymore
        qs = qs.filter(deleted=False).exclude(general_validation_status__isnull=True)

        # all validation node templates where user could have an impact
        validation_node_templates = self._get_actionable_node_templates()

        # instances where the user was involved
        user_has_been_involved_query = Exists(
            ValidationNode.objects.filter(instance=OuterRef("pk")).filter(Q(created_by=user) | Q(updated_by=user))
        )

        # instances where the user approved or rejected a step
        handled_by_me_query = Exists(
            ValidationNode.objects.filter(
                instance=OuterRef("pk"),
                updated_by=user,
                status__in=[ValidationNodeStatus.ACCEPTED, ValidationNodeStatus.REJECTED],
            )
        )

        # get latest new version to handle resubmit cases
        latest_new_version_create_at_query = Subquery(
            ValidationNode.objects.filter(instance=OuterRef(OuterRef("pk")), status=ValidationNodeStatus.NEW_VERSION)
            .order_by("-created_at")
            .values("created_at")[:1]
        )

        # get all validation nodes waiting for user action aka nodes in unknown status and created after last new version
        fallback_date = datetime.datetime(1970, 1, 1, tzinfo=datetime.timezone.utc)

        cutoff = Coalesce(
            latest_new_version_create_at_query,
            Value(fallback_date),
        )

        validation_nodes_waiting_for_user_action_query = Exists(
            ValidationNode.objects.filter(
                instance=OuterRef("pk"),
                node__in=validation_node_templates,
                status=ValidationNodeStatus.UNKNOWN,
                created_at__gt=cutoff,
            )
        )

        cutoff = Coalesce(
            Subquery(
                ValidationNode.objects.filter(
                    instance=OuterRef(OuterRef(OuterRef("pk"))), status=ValidationNodeStatus.NEW_VERSION
                )
                .order_by("-created_at")
                .values("created_at")[:1]
            ),
            Value(fallback_date),
        )
        # get all next bypass where user could take action in that workflow for that instance
        bypass_waiting_query = Exists(
            validation_node_templates.filter(
                can_skip_previous_nodes=True,
                workflow__form_set=OuterRef("form_id"),
            ).filter(
                ~Exists(
                    ValidationNode.objects.exclude(created_at__lt=cutoff).filter(
                        instance=OuterRef(OuterRef("pk")), node=OuterRef("pk")
                    )
                )
            )
        )

        # since when the oldest pending step of the current workflow is waiting
        pending_since_query = Subquery(
            ValidationNode.objects.filter(
                instance=OuterRef("pk"),
                node__workflow=OuterRef("form__validation_workflow"),
                status=ValidationNodeStatus.UNKNOWN,
            )
            .order_by("created_at")
            .values("created_at")[:1]
        )

        qs = qs.annotate(
            annotate_user_has_been_involved=user_has_been_involved_query,
            annotate_handled_by_me=handled_by_me_query,
            annotate_requires_user_action=Case(
                When(
                    general_validation_status=ValidationWorkflowArtefactStatus.PENDING,
                    then=validation_nodes_waiting_for_user_action_query | bypass_waiting_query,
                ),
                default=Value(False),
                output_field=BooleanField(),
            ),
            pending_since=Case(
                When(general_validation_status=ValidationWorkflowArtefactStatus.PENDING, then=pending_since_query),
                default=Value(None),
                output_field=DateTimeField(),
            ),
        )

        # No join on a to-many relation here (subqueries only), so each submission comes once: no DISTINCT needed
        return qs.filter(Q(annotate_user_has_been_involved=True) | Q(annotate_requires_user_action=True))

    @staticmethod
    def _annotate_last_updated(qs):
        # A subquery rather than Max("validationnode__updated_at"): the join + GROUP BY of the aggregate would make
        # the database group and sort every row on all its columns (submission json included)
        last_updated_query = Subquery(
            ValidationNode.objects.filter(instance=OuterRef("pk")).order_by("-updated_at").values("updated_at")[:1]
        )
        # A single annotation: an F() alias of it would make the database run the subquery a second time per row
        return qs.annotate(last_updated=last_updated_query)

    def _prefetch_for_list(self, qs):
        deferred_fields = [
            f"org_unit__{field.name}"
            for field in OrgUnit._meta.concrete_fields
            if field.name not in ["id", "name", "parent"]
        ] + [
            f"org_unit__parent__{field.name}"
            for field in OrgUnit._meta.concrete_fields
            if field.name not in ["id", "name"]
        ]

        # whether the user can complete each step, computed in SQL with the same rule as the queues
        # (rather than loading the roles of the steps and the roles of the user in 2 more queries)
        user_can_act_query = Exists(self._get_actionable_node_templates().filter(pk=OuterRef("node_id")))

        return (
            qs.select_related("project", "form__validation_workflow", "org_unit__parent", "created_by")
            .defer(*deferred_fields)
            .prefetch_related(
                Prefetch(
                    "validationnode_set",
                    queryset=ValidationNode.objects.select_related("node", "created_by", "updated_by")
                    .annotate(annotate_user_can_act=user_can_act_query)
                    .order_by("-created_at"),
                    to_attr="prefetched_validation_nodes",
                ),
                Prefetch(
                    "form__validation_workflow__node_templates",
                    # the ids of the next steps are aggregated in the same query (rather than prefetched in another)
                    queryset=ValidationNodeTemplate.objects.only("id", "workflow_id").annotate(
                        next_node_template_ids=ArrayAgg(
                            "next_node_templates__id", filter=Q(next_node_templates__isnull=False), default=Value([])
                        )
                    ),
                    to_attr="prefetched_node_templates",
                ),
            )
        )

    def _filter_queryset_with_params(self, queryset, params):
        filterset = self.filterset_class(params, queryset=queryset, request=self.request)
        if not filterset.is_valid():
            raise ValidationError(filterset.errors)
        return filterset.qs

    @extend_schema(responses=ValidationWorkflowInstanceCountsSerializer)
    @action(detail=False, methods=["get"])
    def counts(self, request):
        """
        Number of submissions in each queue, for the current filters (the `queue` filter is ignored for the counts).
        `oldest_pending_since` is the oldest waiting time of the submissions matching all the filters, `queue` included.
        """
        queryset = self.get_queryset()

        params_without_queue = request.query_params.copy()
        params_without_queue.pop("queue", None)
        counts_qs = self._filter_queryset_with_params(queryset, params_without_queue)

        # each submission comes once in the queryset, so no COUNT(DISTINCT) needed
        aggregates = {"all": Count("pk")}
        for queue, queue_filter in QUEUE_FILTERS.items():
            aggregates[queue] = Count("pk", filter=queue_filter)
        counts = counts_qs.aggregate(**aggregates)

        queue_qs = self._filter_queryset_with_params(queryset, request.query_params)
        counts["oldest_pending_since"] = queue_qs.aggregate(oldest=Min("pending_since"))["oldest"]

        return Response(self.get_serializer(counts).data)
