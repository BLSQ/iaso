from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.common.serializer import UserRoleNameSerializer
from iaso.api.validation_workflows.serializers.common import UserDisplayNameField, get_ordered_node_templates
from iaso.models import ValidationNodeTemplate, ValidationWorkflow


class ValidationWorkflowListStepSerializer(ModelSerializer):
    roles_required = UserRoleNameSerializer(read_only=True, many=True)

    class Meta:
        model = ValidationNodeTemplate
        fields = ["slug", "name", "roles_required"]


class ValidationWorkflowListSerializer(ModelSerializer):
    updated_by = UserDisplayNameField(allow_null=True, allow_blank=True, required=False)
    created_by = UserDisplayNameField(allow_null=True, allow_blank=True, required=False)
    form_count = serializers.IntegerField(read_only=True)
    linked_forms_count = serializers.IntegerField(read_only=True, help_text="Number of forms using this workflow")
    steps = serializers.SerializerMethodField()

    class Meta:
        model = ValidationWorkflow
        fields = [
            "slug",
            "name",
            "form_count",
            "linked_forms_count",
            "steps",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {"slug": {"required": True}}

    @extend_schema_field(ValidationWorkflowListStepSerializer(many=True))
    def get_steps(self, obj):
        return ValidationWorkflowListStepSerializer(get_ordered_node_templates(obj), many=True).data
