from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.validation_workflows.serializers.common import UserDisplayNameField
from iaso.models import Form, UserRole, ValidationNodeTemplate, ValidationWorkflow


class NestedRolesRequiredSerializer(ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = UserRole
        fields = ["name", "id"]

    def get_name(self, obj):
        return obj.group.name.removeprefix(f"{obj.account_id}_")


class NestedValidationNodeTemplateSerializer(ModelSerializer):
    roles_required = NestedRolesRequiredSerializer(read_only=True, many=True, allow_null=True)

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

    forms = NestedFormSerializer(many=True, read_only=True, source="form_set", allow_null=True)
    node_templates = serializers.SerializerMethodField(read_only=True, allow_null=True)

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

    @extend_schema_field(NestedValidationNodeTemplateSerializer(many=True, allow_null=True))
    def get_node_templates(self, obj):
        nodes = list(getattr(obj, "_prefetched_objects_cache", {}).get("node_templates", obj.node_templates.all()))

        next_map = {}
        prev_map = {}

        for node in nodes:
            next_map[node.id] = list(
                getattr(node, "_prefetched_objects_cache", {}).get(
                    "next_node_templates", node.next_node_templates.all()
                )
            )
            prev_map[node.id] = list(
                getattr(node, "_prefetched_objects_cache", {}).get(
                    "previous_node_templates", node.previous_node_templates.all()
                )
            )

        start = next((n for n in nodes if not prev_map[n.id]), None)

        if not start:
            return []

        next_map = {node.id: list(node.next_node_templates.all()) for node in nodes}

        ordered = []
        current = start

        while current:
            ordered.append(current)
            next_nodes = next_map[current.id]

            if not next_nodes:
                break

            current = next_nodes[0]

        return [NestedValidationNodeTemplateSerializer(instance=data).data for data in ordered]
