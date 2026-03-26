from django.shortcuts import get_object_or_404
from djangorestframework_camel_case.parser import CamelCaseJSONParser
from djangorestframework_camel_case.render import CamelCaseBrowsableAPIRenderer, CamelCaseJSONRenderer
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from iaso.api.validation_workflows_nodes.permissions import HasValidationWorkflowPermission
from iaso.api.validation_workflows_nodes.serializers.complete import ValidationNodeCompleteSerializer
from iaso.api.validation_workflows_nodes.serializers.complete_bypass import ValidationNodeCompleteBypassSerializer
from iaso.api.validation_workflows_nodes.serializers.undo import ValidationNodeUndoSerializer
from iaso.models import Instance, ValidationNode


@extend_schema(tags=["Validation nodes"])
class ValidationNodeViewSet(GenericViewSet):
    parser_classes = [CamelCaseJSONParser]
    renderer_classes = [CamelCaseJSONRenderer, CamelCaseBrowsableAPIRenderer]
    permission_classes = [IsAuthenticated, HasValidationWorkflowPermission]
    http_method_names = ["get", "post"]
    pagination_class = None

    def get_queryset(self):
        if self.action == "complete_bypass":
            return (
                Instance.objects.select_related("project__account", "form", "form__validation_workflow")
                .filter_for_user(self.request.user)
                .filter(form__deleted_at__isnull=True)
                .prefetch_related("validationnode_set")
            )

        qs = ValidationNode.objects.select_related("instance").filter(
            instance__in=Instance.objects.select_related("project__account", "form")
            .filter_for_user(self.request.user)
            .filter(form__deleted_at__isnull=True)
        )
        if self.action == "complete":
            return qs.select_related("node").prefetch_related("node__roles_required", "node__next_node_templates")
        if self.action == "undo":
            return qs.select_related("updated_by", "created_by", "node", "node__workflow").prefetch_related(
                "instance__validationnode_set", "node__next_node_templates"
            )
        return qs

    def get_object(self):
        if self.action == "complete_bypass":
            queryset = self.filter_queryset(self.get_queryset())
            filter_kwargs = {"pk": self.kwargs["instance_id"]}
            obj = get_object_or_404(queryset, **filter_kwargs)
            # May raise a permission denied
            self.check_object_permissions(self.request, obj)
            return obj

        return super().get_object()

    def get_serializer_class(self):
        if self.action == "complete_bypass":
            return ValidationNodeCompleteBypassSerializer
        if self.action == "undo":
            return ValidationNodeUndoSerializer
        if self.action == "complete":
            return ValidationNodeCompleteSerializer
        raise NotImplementedError(f"Serializer not implemented for action {self.action}")

    @extend_schema(responses={204: None})
    @action(detail=True, methods=["post"])
    def undo(self, request, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance=instance, data=request.data or {})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(responses={204: None})
    @action(detail=True, methods=["post"])
    def complete(self, request, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(data=request.data, instance=instance)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(responses={204: None})
    @action(detail=False, methods=["post"], url_path="complete-bypass")
    def complete_bypass(self, request, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(data=request.data, instance=instance)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
