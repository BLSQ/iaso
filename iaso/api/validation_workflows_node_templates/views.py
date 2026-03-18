from django.db import transaction
from djangorestframework_camel_case.parser import CamelCaseJSONParser
from djangorestframework_camel_case.render import CamelCaseBrowsableAPIRenderer, CamelCaseJSONRenderer
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
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
from iaso.models import ValidationNodeTemplate


@extend_schema(tags=["Validation workflow node templates"])
class ValidationNodeTemplatesView(NestedViewSetMixin, ModelViewSet):
    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    permission_classes = [IsAuthenticated, HasValidationNodeTemplatePermission]
    model = ValidationNodeTemplate
    parser_classes = [CamelCaseJSONParser]
    renderer_classes = [CamelCaseJSONRenderer, CamelCaseBrowsableAPIRenderer]
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
        if self.action == "update":
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
        if self.action == "retrieve":
            return (
                qs.select_related("workflow", "workflow__account")
                .prefetch_related("roles_required", "roles_required__group")
                .filter(workflow__account=account)
            )
        return qs.select_related("workflow", "workflow__account").filter(workflow__account=account)

    @action(detail=False, methods=["POST"], url_path="bulk")
    def bulk_create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, many=True, allow_empty=False, min_length=1)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=["PUT"], url_path="bulk")
    def bulk_update(self):
        pass

    @transaction.atomic
    def perform_destroy(self, instance):
        instance.workflow.delete_node_template(instance)

    @extend_schema(description="Move a node to a new position in the workflow")
    @action(detail=True, methods=["PUT"])
    def move(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(data=request.data, instance=instance)
        serializer.is_valid(raise_exception=True)

        instance.workflow.move_node_template(instance, **serializer.validated_data)

        return Response(status=status.HTTP_204_NO_CONTENT)
