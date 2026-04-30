from django.contrib.auth.models import Group
from django.db.models import BooleanField, Case, Exists, Max, OuterRef, Prefetch, Q, Value, When
from drf_spectacular.utils import extend_schema
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.viewsets import GenericViewSet

from iaso.api.common.mixin import CustomPaginationListModelMixin
from iaso.api.validation_workflow_instances.filters import ValidationWorkflowInstancesListFilters
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
            user_roles = self.request.user.iaso_profile.user_roles.all()

            if self.request.user.is_superuser:
                validation_node_templates = ValidationNodeTemplate.objects.filter(
                    workflow__account=self.request.user.iaso_profile.account
                )
            else:
                # all validation node templates where user could have an impact
                validation_node_templates = ValidationNodeTemplate.objects.filter(
                    workflow__account=self.request.user.iaso_profile.account
                ).filter(Q(roles_required__in=user_roles) | Q(roles_required__isnull=True))

            # getting latest new version to handle resubmission cases
            latest_new_version = (
                ValidationNode.objects.filter(instance=OuterRef("pk"), status=ValidationNodeStatus.NEW_VERSION)
                .order_by("-created_at")
                .values("created_at")[:1]
            )

            # instances where the user was involved
            qs = Instance.objects.annotate(
                annotate_user_has_been_involved=Exists(
                    ValidationNode.objects.filter(instance=OuterRef("pk")).filter(
                        Q(created_by=self.request.user) | Q(updated_by=self.request.user)
                    )
                ),
                # todo : handle bypass and resubmits
                annotate_requires_user_action=Case(
                    When(
                        general_validation_status=ValidationWorkflowArtefactStatus.PENDING,
                        then=Exists(
                            ValidationNode.objects.filter(
                                instance=OuterRef("pk"),
                                node__in=validation_node_templates,
                                status=ValidationNodeStatus.UNKNOWN,
                            )
                        ),
                    ),
                    default=Value(False),
                    output_field=BooleanField(),
                ),
                annotate_last_updated=Max("validationnode__updated_at"),
            )

            qs = qs.filter(Q(annotate_user_has_been_involved=True) | Q(annotate_requires_user_action=True)).distinct()

        return qs
