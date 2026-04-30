import datetime

from django.contrib.auth.models import Group
from django.db.models import (
    BooleanField,
    Case,
    Exists,
    Max,
    OuterRef,
    Prefetch,
    Q,
    Subquery,
    Value,
    When,
)
from django.db.models.functions import Coalesce
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework.filters import OrderingFilter
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.viewsets import GenericViewSet

from iaso.api.common.mixin import CustomPaginationListModelMixin
from iaso.api.validation_workflow_instances.filters import ValidationWorkflowInstancesListFilters
from iaso.api.validation_workflow_instances.pagination import ValidationWorkflowInstancePagination
from iaso.api.validation_workflow_instances.permissions import HasValidationWorkflowInstancePermission
from iaso.api.validation_workflow_instances.serializers.list import ValidationWorkflowInstanceListSerializer
from iaso.api.validation_workflow_instances.serializers.retrieve import ValidationWorkflowInstanceRetrieveSerializer
from iaso.models import Instance, ValidationNode, ValidationNodeTemplate
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus


@extend_schema(tags=["Validation nodes"])
class ValidationWorkflowInstanceViewSet(RetrieveModelMixin, CustomPaginationListModelMixin, GenericViewSet):
    methods = ["get"]
    serializer_class = ValidationWorkflowInstanceRetrieveSerializer
    permission_classes = [IsAuthenticated, HasValidationWorkflowInstancePermission]
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]
    filterset_class = ValidationWorkflowInstancesListFilters
    pagination_class = ValidationWorkflowInstancePagination
    ordering = ["-annotate_last_updated"]

    @property
    def filter_backends(self):
        if self.action == "list":
            return [OrderingFilter, DjangoFilterBackend]
        return [DjangoFilterBackend]

    def get_serializer_class(self):
        if self.action == "list":
            return ValidationWorkflowInstanceListSerializer
        return ValidationWorkflowInstanceRetrieveSerializer

    def get_queryset(self):
        qs = Instance.objects.filter_for_user(user=self.request.user).filter(form__deleted_at__isnull=True)

        if self.action == "retrieve":
            return qs.select_related("form", "form__validation_workflow", "project__account").prefetch_related(
                Prefetch(
                    "validationnode_set",
                    queryset=ValidationNode.objects.select_related("node", "created_by", "updated_by").prefetch_related(
                        "node__roles_required",
                        Prefetch("node__roles_required__group", queryset=Group.objects.only("id", "name")),
                    ),
                )
            )
        if self.action == "list":
            qs = qs.exclude(general_validation_status__isnull=True)

            user_roles = self.request.user.iaso_profile.user_roles.all()

            # all validation node templates where user could have an impact
            if self.request.user.is_superuser:
                validation_node_templates = ValidationNodeTemplate.objects.filter(
                    workflow__account=self.request.user.iaso_profile.account
                )
            else:
                validation_node_templates = ValidationNodeTemplate.objects.filter(
                    workflow__account=self.request.user.iaso_profile.account
                ).filter(Q(roles_required__in=user_roles) | Q(roles_required__isnull=True))

            # instances where the user was involved
            user_has_been_involved_query = Exists(
                ValidationNode.objects.filter(instance=OuterRef("pk")).filter(
                    Q(created_by=self.request.user) | Q(updated_by=self.request.user)
                )
            )

            # get latest new version to handle resubmit cases
            latest_new_version_create_at_query = Subquery(
                ValidationNode.objects.filter(instance=OuterRef("pk"), status=ValidationNodeStatus.NEW_VERSION)
                .order_by("-created_at")
                .values("created_at")[:1]
            )

            # get all validation nodes waiting for user action aka nodes in unknown status and created after last new version
            fallback_date = timezone.make_aware(datetime.datetime(1970, 1, 1))

            validation_nodes_waiting_for_user_action_query = Exists(
                ValidationNode.objects.filter(
                    instance=OuterRef("pk"),
                    node__in=validation_node_templates,
                    status=ValidationNodeStatus.UNKNOWN,
                ).filter(
                    Q(
                        created_at__gte=Coalesce(
                            OuterRef("annotate_latest_new_version_created_at"), Value(fallback_date)
                        )
                    )
                )
            )

            # get all next bypass where user could take action in that workflow for that instance
            bypass_waiting_query = Exists(
                validation_node_templates.filter(
                    workflow__account=self.request.user.iaso_profile.account,
                    can_skip_previous_nodes=True,
                    workflow__form_set=OuterRef("form_id"),
                ).exclude(
                    validationnode__instance=OuterRef(
                        "pk"
                    )  # todo : this will have to change once resubmits # means validationnode is null but just for that instance
                )
            )

            qs = qs.annotate(
                annotate_user_has_been_involved=user_has_been_involved_query,
                annotate_latest_new_version_created_at=latest_new_version_create_at_query,
                annotate_requires_user_action=Case(
                    When(
                        general_validation_status=ValidationWorkflowArtefactStatus.PENDING,
                        then=validation_nodes_waiting_for_user_action_query | bypass_waiting_query,
                    ),
                    default=Value(False),
                    output_field=BooleanField(),
                ),
                annotate_last_updated=Max("validationnode__updated_at"),
            )

            qs = qs.filter(Q(annotate_user_has_been_involved=True) | Q(annotate_requires_user_action=True)).distinct()

        return qs
