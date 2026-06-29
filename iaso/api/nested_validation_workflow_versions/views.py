from django.core.exceptions import NON_FIELD_ERRORS
from django.db.models import Prefetch
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.mixins import CreateModelMixin, RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from iaso.api.common.mixin import CustomPaginationListModelMixin, ProtectDestroyMixin
from iaso.api.common.permissions import HasModulePermission
from iaso.api.nested_validation_workflow_versions.permissions import HasNestedValidationWorkflowVersionPermission
from iaso.api.nested_validation_workflow_versions.serializers.create import NestedValidationWorkflowCreateSerializer
from iaso.api.nested_validation_workflow_versions.serializers.list import NestedValidationWorkflowVersionListSerializer
from iaso.api.nested_validation_workflow_versions.serializers.retrieve import (
    ValidationWorkflowVersionRetrieveSerializer,
)
from iaso.api.nested_validation_workflow_versions.serializers.update import NestedValidationWorkflowUpdateSerializer
from iaso.models import ValidationNodeTemplate, ValidationWorkflow, ValidationWorkflowVersion
from iaso.modules import MODULE_VALIDATION_WORKFLOW
from iaso.services.validation_workflows import ValidationWorkflowService, ValidationWorkflowServiceException


@extend_schema(tags=["Validation workflow versions"])
class NestedValidationWorkflowVersionsViewSet(
    CustomPaginationListModelMixin, ProtectDestroyMixin, RetrieveModelMixin, CreateModelMixin, GenericViewSet
):
    permission_classes = [
        IsAuthenticated,
        HasNestedValidationWorkflowVersionPermission,
        HasModulePermission(MODULE_VALIDATION_WORKFLOW),
    ]
    lookup_url_kwarg = "version"
    lookup_field = "version"
    lookup_value_regex = r"[^/]+"

    def get_queryset(self):
        user = getattr(self.request, "user", None)
        iaso_profile = getattr(user, "iaso_profile", None)
        account = getattr(iaso_profile, "account", None)
        if not account:
            return ValidationWorkflowVersion.objects.none()

        validation_workflow = get_object_or_404(
            ValidationWorkflow.objects.filter(account=account), slug=self.kwargs["parent_lookup_workflow__slug"]
        )
        qs = ValidationWorkflowVersion.objects.filter(main_workflow=validation_workflow)

        if self.action == "list":
            qs = qs.select_related("created_by", "updated_by")

        if self.action in ["retrieve", "latest"]:
            qs = qs.prefetch_related("main_workflow__form_set").prefetch_related(
                Prefetch(
                    "node_templates",
                    ValidationNodeTemplate.objects.prefetch_related(
                        "next_node_templates", "previous_node_templates", "roles_required", "roles_required__group"
                    ),
                ),
            )

        return qs

    def get_object(self):
        if self.action == "latest":
            return self.filter_queryset(self.get_queryset()).latest_by_version()
        return super().get_object()

    def get_serializer_class(self):
        if self.action == "list":
            return NestedValidationWorkflowVersionListSerializer

        if self.action in ["retrieve", "latest"]:
            return ValidationWorkflowVersionRetrieveSerializer

        if self.action == "create":
            return NestedValidationWorkflowCreateSerializer

        if self.action in ["update", "partial_update"]:
            return NestedValidationWorkflowUpdateSerializer

        raise NotImplementedError(f"Serializer is not implemented for this action: {self.action}")

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        if self.action == "create":
            ctx.update(
                {
                    "workflow_slug": self.kwargs["parent_lookup_workflow__slug"],
                }
            )
        return ctx

    @action(detail=False, methods=["get"], pagination_class=None)
    def latest(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

    def perform_destroy(self, instance):
        ValidationWorkflowService.delete_version(version=instance)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            instance = ValidationWorkflowService.create_new_version(**serializer.validated_data)
        except ValidationWorkflowServiceException as exc:
            raise DRFValidationError({exc.field or NON_FIELD_ERRORS: exc.message})

        headers = self.get_success_headers(serializer.data)
        serializer = self.get_serializer(instance)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        try:
            instance = ValidationWorkflowService.update_version(
                instance=instance, user=self.request.user, **serializer.validated_data
            )
        except ValidationWorkflowServiceException as exc:
            raise DRFValidationError({exc.field or NON_FIELD_ERRORS: exc.message})

        if getattr(instance, "_prefetched_objects_cache", None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)
