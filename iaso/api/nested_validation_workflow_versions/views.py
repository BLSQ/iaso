from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated

from iaso.api.common import ModelViewSet
from iaso.api.nested_validation_workflow_versions.serializers.list import ValidationWorkflowVersionListSerializer
from iaso.models import ValidationWorkflow, ValidationWorkflowVersion


class NestedValidationWorkflowVersionsViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = "version"
    pk_url_kwarg = "version"

    def get_queryset(self):
        user = getattr(self.request, "user", None)
        iaso_profile = getattr(user, "iaso_profile", None)
        account = getattr(iaso_profile, "account", None)
        if not account:
            return ValidationWorkflowVersion.objects.none()

        validation_workflow = get_object_or_404(
            ValidationWorkflow.objects.filter(account=account), slug=self.kwargs["parent_lookup_workflow__slug"]
        )
        qs = ValidationWorkflowVersion.objects.filter(validation_workflow=validation_workflow)

        if self.action == "list":
            qs = qs.select_related("created_by", "updated_by")

        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return ValidationWorkflowVersionListSerializer

        # if self.action == "retrieve":
        #     pass
        #
        # if self.action == "create":
        #     pass
        #
        # if self.action == "update":
        #     pass

        raise NotImplementedError(f"Serializer is not implemented for this action: {self.action}")
