from django.db import transaction
from django.db.models import Prefetch
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_extensions.mixins import NestedViewSetMixin

from iaso.api.common import ModelViewSet
from iaso.api.validation_workflows_node_templates.pagination import ValidationNodeTemplatePagination
from iaso.api.validation_workflows_node_templates.permissions import HasValidationNodeTemplatePermission
from iaso.api.validation_workflows_node_templates.serializers.bulk_create import (
    ValidationNodeTemplateBulkCreateSerializer,
)
from iaso.api.validation_workflows_node_templates.serializers.bulk_update import (
    ValidationNodeTemplateBulkUpdateSerializer,
)
from iaso.api.validation_workflows_node_templates.serializers.create import ValidationNodeTemplateCreateSerializer
from iaso.api.validation_workflows_node_templates.serializers.list import ValidationNodeTemplateListSerializer
from iaso.api.validation_workflows_node_templates.serializers.move import ValidationNodeTemplateMoveSerializer
from iaso.api.validation_workflows_node_templates.serializers.retrieve import ValidationNodeTemplateRetrieveSerializer
from iaso.api.validation_workflows_node_templates.serializers.update import ValidationNodeTemplateUpdateSerializer
from iaso.models import UserRole, ValidationNodeTemplate


@extend_schema(tags=["Validation workflow node templates"])
class ValidationNodeTemplatesView(NestedViewSetMixin, ModelViewSet):
    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    permission_classes = [IsAuthenticated, HasValidationNodeTemplatePermission]
    model = ValidationNodeTemplate
    filter_backends = [OrderingFilter]
    pagination_class = ValidationNodeTemplatePagination
    http_method_names = ["get", "post", "put", "delete", "patch"]
    queryset = ValidationNodeTemplate.objects.all()

    def get_serializer_class(self):
        if self.action == "list":
            return ValidationNodeTemplateListSerializer
        if self.action == "retrieve":
            return ValidationNodeTemplateRetrieveSerializer
        if self.action == "create":
            return ValidationNodeTemplateCreateSerializer
        if self.action in ["update", "partial_update"]:
            return ValidationNodeTemplateUpdateSerializer
        if self.action == "bulk_create":
            return ValidationNodeTemplateBulkCreateSerializer
        if self.action == "bulk_update":
            return ValidationNodeTemplateBulkUpdateSerializer
        if self.action == "move":
            return ValidationNodeTemplateMoveSerializer
        raise NotImplementedError(f"Serializer not implemented for action {self.action}")

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx.update({"workflow_slug": self.kwargs.get("parent_lookup_workflow__slug")})
        return ctx

    def get_queryset(self):
        account = self.request.user.iaso_profile.account
        qs = super().get_queryset()
        qs = qs.filter(workflow__account=account)
        if self.action in ["delete"]:
            return qs.prefetch_related("roles_required", "next_node_templates", "previous_node_templates")
        if self.action in ["retrieve", "list"]:
            return qs.select_related("workflow", "workflow__account").prefetch_related(
                Prefetch("roles_required", queryset=UserRole.objects.select_related("group"))
            )
        return qs.select_related("workflow", "workflow__account")

    # This endpoint returns a plain list (not paginated).
    # pagination_class=None ensures the OpenAPI schema reflects that.
    @extend_schema(
        request=ValidationNodeTemplateBulkCreateSerializer(many=True),
        responses=ValidationNodeTemplateBulkCreateSerializer(many=True),
    )
    @action(detail=False, methods=["POST"], url_path="bulk", url_name="bulk", pagination_class=None)
    def bulk_create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, many=True, allow_empty=False, min_length=1)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @extend_schema(
        description="Allow to update an existing list of nodes attached to a workflow (fields and order). Does not allow to delete nodes.",
        request=ValidationNodeTemplateBulkUpdateSerializer(many=True),
        responses=ValidationNodeTemplateBulkUpdateSerializer(many=True),
    )
    @bulk_create.mapping.put
    def bulk_update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, many=True, allow_empty=False, instance=self.get_queryset())
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK, headers=headers)

    @transaction.atomic
    def perform_destroy(self, instance):
        instance.workflow.delete_node_template(instance)

    @extend_schema(
        description="Move a node to a new position in the workflow",
        responses={"204": None},
        request=ValidationNodeTemplateMoveSerializer,
    )
    @action(detail=True, methods=["PUT"])
    def move(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(data=request.data, instance=instance)
        serializer.is_valid(raise_exception=True)

        instance.workflow.move_node_template(instance, **serializer.validated_data)

        return Response(status=status.HTTP_204_NO_CONTENT)
