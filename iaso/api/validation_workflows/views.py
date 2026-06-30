from django.db.models import Count, OuterRef, Prefetch, Q, Subquery
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.response import Response

from iaso.api.common import ModelViewSet
from iaso.api.common.permissions import HasModulePermission
from iaso.api.validation_workflows.filters import ValidationWorkflowListFilter
from iaso.api.validation_workflows.pagination import ValidationWorkflowPagination
from iaso.api.validation_workflows.permissions import HasValidationWorkflowPermission
from iaso.api.validation_workflows.serializers.create import ValidationWorkflowCreateSerializer
from iaso.api.validation_workflows.serializers.dropdown import ValidationWorkflowDropdownSerializer
from iaso.api.validation_workflows.serializers.list import ValidationWorkflowListSerializer
from iaso.api.validation_workflows.serializers.retrieve import ValidationWorkflowRetrieveSerializer
from iaso.api.validation_workflows.serializers.status import StatusSerializer
from iaso.api.validation_workflows.serializers.update import ValidationWorkflowUpdateSerializer
from iaso.models import ValidationWorkflow, ValidationWorkflowVersion
from iaso.modules import MODULE_VALIDATION_WORKFLOW
from iaso.services.validation_workflows import ValidationWorkflowService


@extend_schema(tags=["Validation workflows"])
class ValidationWorkflowViewSet(ModelViewSet):
    permission_classes = [
        permissions.IsAuthenticated,
        HasValidationWorkflowPermission,
        HasModulePermission(MODULE_VALIDATION_WORKFLOW),
    ]
    filter_backends = [OrderingFilter, DjangoFilterBackend]
    pagination_class = ValidationWorkflowPagination
    http_method_names = ["get", "post", "put", "patch", "delete"]
    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    filterset_class = ValidationWorkflowListFilter
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer]

    def get_serializer_class(self):
        if self.action == "list":
            return ValidationWorkflowListSerializer
        if self.action == "dropdown":
            return ValidationWorkflowDropdownSerializer
        if self.action == "create":
            return ValidationWorkflowCreateSerializer
        if self.action == "retrieve":
            return ValidationWorkflowRetrieveSerializer
        if self.action in ["update", "partial_update"]:
            return ValidationWorkflowUpdateSerializer
        if self.action in ["node_statuses", "artefact_statuses"]:
            return StatusSerializer
        raise NotImplementedError(f"Serializer not implemented for action {self.action}")

    def get_queryset(self):
        account = self.request.user.iaso_profile.account
        qs = ValidationWorkflow.objects.filter(account=account).select_related("account")
        if self.action == "list":
            qs = (
                qs.prefetch_related("form_set")
                .prefetch_related(
                    Prefetch(
                        "versions",
                        queryset=ValidationWorkflowVersion.objects.order_by_version(),
                        to_attr="prefetched_versions",
                    )
                )
                .annotate(
                    form_count=Count(
                        "form_set__instances",
                        filter=Q(form_set__validation_workflow__account=account, form_set__deleted_at__isnull=True),
                        distinct=True,
                    ),
                    current_version=Subquery(
                        ValidationWorkflowVersion.objects.filter(
                            main_workflow=OuterRef("pk"),
                            deleted_at__isnull=True,
                            main_workflow__deleted_at__isnull=True,
                        )
                        .order_by_version()
                        .values("version")[:1]
                    ),
                )
            )
        if self.action == "retrieve":
            qs = qs.prefetch_related(
                Prefetch(
                    "versions",
                    queryset=ValidationWorkflowVersion.objects.order_by_version(),
                    to_attr="prefetched_versions",
                ),
                "form_set",
            )
        return qs

    @extend_schema(responses=ValidationWorkflowDropdownSerializer(many=True))
    @action(detail=False, methods=["get"])
    def dropdown(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = ValidationWorkflowService.create_validation_workflow(**serializer.validated_data)
        headers = self.get_success_headers(serializer.validated_data)
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    # @action(detail=False, methods=["get"], url_path="node-statuses", pagination_class=None)
    # def node_statuses(self, request, *_args, **_kwargs):
    #     serializer = self.get_serializer(ValidationNodeStatus, many=True)
    #     return Response(serializer.data)
    #
    # @action(detail=False, methods=["get"], url_path="artefact-statuses", pagination_class=None)
    # def artefact_statuses(self, request, *_args, **_kwargs):
    #     serializer = self.get_serializer(ValidationWorkflowArtefactStatus, many=True)
    #     return Response(serializer.data)
