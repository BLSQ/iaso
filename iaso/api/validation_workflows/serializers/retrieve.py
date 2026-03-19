from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.validation_workflows.serializers.common import UserDisplayNameField
from iaso.models import Form, UserRole, ValidationNodeTemplate, ValidationWorkflow


class NestedRolesRequiredSerializer(ModelSerializer):
    name = serializers.CharField(read_only=True, source="group.name")

    class Meta:
        model = UserRole
        fields = ["name", "id"]


class NestedValidationNodeTemplateSerializer(ModelSerializer):
    roles_required = NestedRolesRequiredSerializer(read_only=True, many=True)

    class Meta:
        model = ValidationNodeTemplate
        fields = ["slug", "name", "description", "color", "roles_required", "can_skip_previous_nodes"]


class NestedFormSerializer(ModelSerializer):
    label = serializers.CharField(read_only=True, source="name")

    class Meta:
        model = Form
        fields = ["id", "label"]


class ValidationWorkflowRetrieveSerializer(ModelSerializer):
    updated_by = UserDisplayNameField()
    created_by = UserDisplayNameField()

    forms = NestedFormSerializer(many=True, read_only=True, source="form_set")
    node_templates = NestedValidationNodeTemplateSerializer(many=True, read_only=True)

    class Meta:
        model = ValidationWorkflow
        fields = [
            "slug",
            "name",
            "description",
            "forms",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "node_templates",
        ]
