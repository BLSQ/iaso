from django.db.models import Exists, FilteredRelation, OuterRef, Prefetch, Q
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.validation_workflows.serializers.common import UserDisplayNameField
from iaso.models import Instance, UserRole, ValidationNode, ValidationNodeTemplate
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus
from iaso.utils.serializer.color import ColorFieldSerializer


class NestedUserRoleSerializer(ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = UserRole
        fields = ["name", "id"]

    def get_name(self, obj):
        return obj.group.name.removeprefix(f"{obj.account_id}_")


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
            obj.all_validation_nodes
            if getattr(obj, "all_validation_nodes", None)
            else obj.get_all_validation_nodes().select_related("created_by", "updated_by", "node"),
            many=True,
        ).data

    @extend_schema_field({"type": "string", "nullable": True})
    def get_rejection_comment(self, obj):
        if obj.general_validation_status == ValidationWorkflowArtefactStatus.REJECTED:
            if getattr(obj, "all_validation_nodes", None):
                rejected_validation_node = next(
                    (n for n in obj.all_validation_nodes if n.status == ValidationNodeStatus.REJECTED), None
                )
                return getattr(rejected_validation_node, "comment", "")
            return obj.validationnode_set.filter(status=ValidationNodeStatus.REJECTED).first().comment
        return None

    @extend_schema_field(NextByPassSerializer(many=True))
    def get_next_bypass(self, obj):
        qs = ValidationNodeTemplate.objects.none()

        if getattr(obj, "all_validation_nodes", None):
            most_recent_new_version = next(
                (n for n in obj.all_validation_nodes if n.status == ValidationNodeStatus.NEW_VERSION), None
            )
        else:
            most_recent_new_version = (
                obj.get_all_validation_nodes().filter(status=ValidationNodeStatus.NEW_VERSION).first()
            )

        if obj.general_validation_status == ValidationWorkflowArtefactStatus.PENDING:
            if most_recent_new_version:
                # in case of resubmission, we need to filter out previous nodes
                qs = (
                    ValidationNodeTemplate.objects.annotate(
                        active_nodes=FilteredRelation(
                            "validationnode",
                            condition=Q(
                                validationnode__created_at__gte=most_recent_new_version.created_at,
                                validationnode__instance=obj,
                            ),
                        )
                    )
                    .prefetch_related(
                        "validationnode_set", Prefetch("roles_required", UserRole.objects.select_related("group"))
                    )
                    .filter(can_skip_previous_nodes=True, workflow=obj.form.validation_workflow)
                    .filter(Q(active_nodes__isnull=True) | Q(active_nodes__status=ValidationNodeStatus.UNKNOWN))
                )
            else:
                qs = (
                    ValidationNodeTemplate.objects.prefetch_related(
                        "validationnode_set", Prefetch("roles_required", UserRole.objects.select_related("group"))
                    )
                    .filter(
                        can_skip_previous_nodes=True,
                        workflow=obj.form.validation_workflow,
                    )
                    .filter(
                        Q(
                            ~Exists(
                                ValidationNode.objects.filter(
                                    instance=obj,
                                    node=OuterRef("pk"),
                                )
                            )
                        )
                        | Q(
                            Exists(
                                ValidationNode.objects.filter(
                                    instance=obj,
                                    node=OuterRef("pk"),
                                    status=ValidationNodeStatus.UNKNOWN,
                                )
                            )
                        )
                    )
                )

        return NextByPassSerializer(qs, many=True).data
