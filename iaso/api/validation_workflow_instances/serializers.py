from django.db.models import Prefetch, Q
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.validation_workflows.serializers.common import UserDisplayNameField
from iaso.models import Instance, UserRole, ValidationNode, ValidationNodeTemplate
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus
from iaso.utils.serializer.color import ColorFieldSerializer


class NestedUserRoleSerializer(ModelSerializer):
    name = serializers.CharField(read_only=True, source="group.name")

    class Meta:
        model = UserRole
        fields = ["id", "name"]


class NestedHistorySerializer(ModelSerializer):
    color = ColorFieldSerializer(source="node.color", read_only=True)
    level = serializers.CharField(read_only=True, source="node.name")
    node_template_slug = serializers.CharField(read_only=True, source="node.slug")
    created_by = UserDisplayNameField()
    updated_by = UserDisplayNameField()

    class Meta:
        model = ValidationNode
        fields = [
            "level",
            "color",
            "created_at",
            "updated_at",
            "status",
            "comment",
            "updated_by",
            "created_by",
            "id",
            "node_template_slug",
        ]


class NextTasksSerializer(ModelSerializer):
    user_roles = NestedUserRoleSerializer(read_only=True, many=True, source="node.roles_required")
    name = serializers.CharField(read_only=True, source="node.name")
    node_template_slug = serializers.CharField(read_only=True, source="node.slug")

    class Meta:
        model = ValidationNode
        fields = ["id", "name", "user_roles", "node_template_slug"]


class NextByPassSerializer(ModelSerializer):
    user_roles = NestedUserRoleSerializer(read_only=True, many=True, source="roles_required")

    class Meta:
        model = ValidationNodeTemplate
        fields = ["slug", "name", "user_roles"]


class ValidationWorkflowInstanceRetrieveSerializer(ModelSerializer):
    validation_status = serializers.CharField(read_only=True, source="general_validation_status")
    rejection_comment = serializers.SerializerMethodField(read_only=True)
    history = serializers.SerializerMethodField(read_only=True)
    next_tasks = NextTasksSerializer(read_only=True, many=True, source="get_next_pending_nodes")
    next_bypass = serializers.SerializerMethodField(read_only=True)
    workflow = serializers.CharField(read_only=True, source="form.validation_workflow.slug")

    class Meta:
        model = Instance
        fields = ["validation_status", "rejection_comment", "history", "next_tasks", "next_bypass", "workflow"]

    @extend_schema_field(NestedHistorySerializer(many=True))
    def get_history(self, obj):
        return NestedHistorySerializer(
            obj.get_all_validation_nodes().select_related("created_by", "updated_by", "node"),
            many=True,
        ).data

    @extend_schema_field({"type": "string", "nullable": True})
    def get_rejection_comment(self, obj):
        if obj.general_validation_status == ValidationWorkflowArtefactStatus.REJECTED:
            return obj.validationnode_set.filter(status=ValidationNodeStatus.REJECTED).first().comment
        return None

    @extend_schema_field(NextByPassSerializer(many=True))
    def get_next_bypass(self, obj):
        qs = ValidationNodeTemplate.objects.none()
        if obj.general_validation_status == ValidationWorkflowArtefactStatus.PENDING:
            qs = (
                ValidationNodeTemplate.objects.prefetch_related(
                    "validationnode_set", Prefetch("roles_required", UserRole.objects.select_related("group"))
                )
                .filter(can_skip_previous_nodes=True, workflow=obj.form.validation_workflow)
                .filter(Q(validationnode__isnull=True) | Q(validationnode__status=ValidationNodeStatus.UNKNOWN))
            )

        return NextByPassSerializer(qs, many=True).data
