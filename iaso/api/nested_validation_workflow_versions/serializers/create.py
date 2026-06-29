from rest_framework import serializers

from iaso.api.common import HiddenSlugRelatedField, ModelSerializer
from iaso.api.nested_validation_workflow_versions.serializers.common import ValidationWorkflowContextDefault
from iaso.models import ValidationWorkflow, ValidationWorkflowVersion
from iaso.services.validation_workflows import UPGRADE_STRATEGY_CHOICES


class NestedValidationWorkflowCreateSerializer(ModelSerializer):
    upgrade = serializers.ChoiceField(
        choices=UPGRADE_STRATEGY_CHOICES, write_only=True, required=False, allow_null=True
    )
    clone_node_templates = serializers.BooleanField(write_only=True, required=False)
    user = serializers.HiddenField(default=serializers.CurrentUserDefault(), write_only=True)
    validation_workflow = HiddenSlugRelatedField(
        slug_field="slug",
        write_only=True,
        queryset=ValidationWorkflow.objects.none(),
        required=False,
        default=ValidationWorkflowContextDefault(),
    )

    class Meta:
        model = ValidationWorkflowVersion
        fields = ["version", "upgrade", "clone_node_templates", "user", "validation_workflow"]
        extra_kwargs = {
            "version": {"write_only": True, "required": False},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        iaso_profile = getattr(user, "iaso_profile", None)
        account = getattr(iaso_profile, "account", None)

        if account:
            self.fields["validation_workflow"].queryset = ValidationWorkflow.objects.filter(
                deleted_at__isnull=True, account=account
            )
