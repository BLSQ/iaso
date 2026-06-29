from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.common.serializer import UserRoleNameSerializer
from iaso.models import Form, ValidationNodeTemplate, ValidationWorkflowVersion


class NestedValidationNodeTemplateSerializer(ModelSerializer):
    roles_required = UserRoleNameSerializer(read_only=True, many=True, allow_null=True)

    class Meta:
        model = ValidationNodeTemplate
        fields = ["slug", "name", "description", "roles_required", "can_skip_previous_nodes"]


class NestedFormSerializer(ModelSerializer):
    label = serializers.CharField(read_only=True, source="name")

    class Meta:
        model = Form
        fields = ["id", "label"]


class ValidationWorkflowVersionRetrieveSerializer(ModelSerializer):
    forms = NestedFormSerializer(many=True, read_only=True, source="main_workflow.form_set", allow_null=True)
    node_templates = serializers.SerializerMethodField("get_node_templates")

    class Meta:
        model = ValidationWorkflowVersion
        fields = ["id", "version", "created_at", "updated_at", "forms", "node_templates"]

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
