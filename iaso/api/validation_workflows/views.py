from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response

from iaso.api.common import ModelViewSet
from iaso.api.validation_workflows.filters import ValidationWorkflowListFilter
from iaso.api.validation_workflows.pagination import ValidationWorkflowPagination
from iaso.api.validation_workflows.permissions import HasAccountFeatureFlag, HasValidationWorkflowPermission
from iaso.api.validation_workflows.serializers.create import ValidationWorkflowCreateSerializer
from iaso.api.validation_workflows.serializers.dropdown import ValidationWorkflowDropdownSerializer
from iaso.api.validation_workflows.serializers.list import ValidationWorkflowListSerializer
from iaso.api.validation_workflows.serializers.retrieve import ValidationWorkflowRetrieveSerializer
from iaso.api.validation_workflows.serializers.update import ValidationWorkflowUpdateSerializer
from iaso.models import ValidationWorkflow


@extend_schema(tags=["Validation workflows"])
class ValidationWorkflowViewSet(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, HasValidationWorkflowPermission, HasAccountFeatureFlag]
    filter_backends = [OrderingFilter, DjangoFilterBackend]
    pagination_class = ValidationWorkflowPagination
    http_method_names = ["get", "post", "put", "patch", "delete"]
    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    filterset_class = ValidationWorkflowListFilter

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
        raise NotImplementedError(f"Serializer not implemented for action {self.action}")

    def get_queryset(self):
        account = self.request.user.iaso_profile.account
        qs = ValidationWorkflow.objects.filter(account=account).select_related("account")
        if self.action == "list":
            qs = (
                qs.prefetch_related("form_set")
                .select_related("created_by", "updated_by")
                .annotate(
                    form_count=Count(
                        "form_set__instances",
                        filter=Q(form_set__validation_workflow__account=account, form_set__deleted_at__isnull=True),
                        distinct=True,
                    )
                )
            )
        if self.action == "retrieve":
            qs = qs.prefetch_related(
                "node_templates",
                "node_templates__next_node_templates",
                "node_templates__previous_node_templates",
                "form_set",
                "node_templates__roles_required",
                "node_templates__roles_required__group",
            ).select_related("created_by", "updated_by")
        return qs

    @action(detail=False, methods=["get"])
    def dropdown(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
