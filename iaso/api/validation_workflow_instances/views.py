from django.contrib.auth.models import Group
from django.db.models import Prefetch
from drf_spectacular.utils import extend_schema
from rest_framework.mixins import RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet

from iaso.api.validation_workflow_instances.permissions import HasValidationWorkflowPermission
from iaso.api.validation_workflow_instances.serializers import ValidationWorkflowInstanceRetrieveSerializer
from iaso.models import Instance, ValidationNode


@extend_schema(tags=["Validation nodes"])
class ValidationWorkflowInstanceViewSet(RetrieveModelMixin, GenericViewSet):
    methods = ["get"]
    serializer_class = ValidationWorkflowInstanceRetrieveSerializer
    permission_classes = [IsAuthenticated, HasValidationWorkflowPermission]

    def get_queryset(self):
        return (
            Instance.objects.select_related("form", "form__validation_workflow", "project__account")
            .filter_for_user(user=self.request.user)
            .filter(form__deleted_at__isnull=True)
            .prefetch_related(
                Prefetch(
                    "validationnode_set",
                    queryset=ValidationNode.objects.select_related("node", "created_by", "updated_by").prefetch_related(
                        "node__roles_required",
                        Prefetch("node__roles_required__group", queryset=Group.objects.only("id", "name")),
                    ),
                )
            )
        )
