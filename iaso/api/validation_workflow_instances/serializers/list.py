from typing import Optional

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer, UserSerializer
from iaso.api.instances.serializers.misc import OrgUnitNestedSerializer as InstanceOrgUnitNestedSerializer
from iaso.models import Form, Instance, OrgUnit, Project, ValidationWorkflow
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus
from iaso.utils.pii import get_allowed_fields


SUBMISSION_STATUSES = [ValidationNodeStatus.SUBMISSION, ValidationNodeStatus.NEW_VERSION]
COMPLETED_STATUSES = [ValidationNodeStatus.ACCEPTED, ValidationNodeStatus.REJECTED]


def compute_step_positions(node_templates) -> dict[int, int]:
    """
    Position (1-based) of each step of a linear workflow, following the chain from its starting step.
    Workflows are linear (one starting step, one next step each): the numbering stops at anything else
    (several starting steps, a branch or a cycle) rather than showing misleading positions.
    """
    # `next_node_template_ids` is aggregated by the list view, so the chain is read without a query per step
    next_ids = {node_template.pk: list(node_template.next_node_template_ids) for node_template in node_templates}

    steps_with_previous = {pk for next_pks in next_ids.values() for pk in next_pks}
    starting_steps = [pk for pk in next_ids if pk not in steps_with_previous]
    if len(starting_steps) != 1:
        return {}

    positions = {}
    current = starting_steps[0]
    while current is not None and current not in positions:  # `not in positions` stops a cycle
        positions[current] = len(positions) + 1
        next_pks = next_ids.get(current, [])
        current = next_pks[0] if len(next_pks) == 1 else None  # stops at the last step or a branch
    return positions


class ProjectNestedSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "color"]
        read_only_fields = fields


class FormNestedSerializer(ModelSerializer):
    class Meta:
        model = Form
        fields = ["id", "name"]
        read_only_fields = fields


class WorkflowNestedSerializer(ModelSerializer):
    class Meta:
        model = ValidationWorkflow
        fields = ["id", "name"]
        read_only_fields = fields


class OrgUnitNestedSerializer(ModelSerializer):
    parent = InstanceOrgUnitNestedSerializer(read_only=True, allow_null=True)

    class Meta:
        model = OrgUnit
        fields = ["id", "name", "parent"]
        read_only_fields = fields


class CurrentStepSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True, help_text="Id of the pending validation node")
    node_template_id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    position = serializers.IntegerField(read_only=True, allow_null=True)
    pending_since = serializers.DateTimeField(read_only=True)
    user_can_act = serializers.BooleanField(read_only=True)


class LastUserActionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=COMPLETED_STATUSES, read_only=True)
    name = serializers.CharField(read_only=True)
    position = serializers.IntegerField(read_only=True, allow_null=True)
    date = serializers.DateTimeField(read_only=True)


class ValidationWorkflowInstanceListSerializer(ModelSerializer):
    """
    Needs the queryset of ValidationWorkflowInstanceViewSet (list action): its annotations (annotate_*, pending_since,
    last_updated) and prefetches (validation nodes with annotate_user_can_act, steps with next_node_template_ids).
    """

    project = ProjectNestedSerializer(read_only=True)
    org_unit = OrgUnitNestedSerializer(read_only=True, allow_null=True)
    user_has_been_involved = serializers.BooleanField(read_only=True, source="annotate_user_has_been_involved")
    requires_user_action = serializers.BooleanField(read_only=True, source="annotate_requires_user_action")
    handled_by_me = serializers.BooleanField(read_only=True, source="annotate_handled_by_me")
    last_updated = serializers.DateTimeField(read_only=True)
    pending_since = serializers.DateTimeField(read_only=True, allow_null=True)
    form = FormNestedSerializer(read_only=True)
    workflow = WorkflowNestedSerializer(read_only=True, source="form.validation_workflow")
    general_validation_status = serializers.CharField(
        read_only=True, allow_blank=True, source="get_general_validation_status_display"
    )
    validation_status = serializers.ChoiceField(
        read_only=True, source="general_validation_status", choices=ValidationWorkflowArtefactStatus.choices
    )
    display_name = serializers.SerializerMethodField()
    submitted_by = serializers.SerializerMethodField()
    submitted_at = serializers.SerializerMethodField()
    is_resubmission = serializers.SerializerMethodField()
    current_steps = serializers.SerializerMethodField()
    step_count = serializers.SerializerMethodField()
    last_user_action = serializers.SerializerMethodField()

    class Meta:
        model = Instance
        fields = [
            "id",
            "display_name",
            "form",
            "workflow",
            "org_unit",
            "project",
            "general_validation_status",
            "validation_status",
            "user_has_been_involved",
            "requires_user_action",
            "handled_by_me",
            "last_updated",
            "pending_since",
            "submitted_by",
            "submitted_at",
            "is_resubmission",
            "current_steps",
            "step_count",
            "last_user_action",
        ]

    # helpers

    def _get_validation_nodes(self, obj: Instance) -> list:
        """Validation nodes of the current workflow of the instance, newest first."""
        # prefetched and annotated by the list view (like the annotate_* fields, this serializer needs its queryset)
        nodes = obj.prefetched_validation_nodes
        workflow_id = obj.form.validation_workflow_id if obj.form else None
        return [node for node in nodes if node.node.workflow_id == workflow_id]

    def _get_step_positions(self, obj: Instance) -> dict[int, int]:
        workflow = obj.form.validation_workflow if obj.form else None
        if workflow is None:
            return {}
        cache = self.context.setdefault("step_positions_by_workflow", {})
        if workflow.pk not in cache:
            # prefetched by the list view, with the ids of their next steps
            cache[workflow.pk] = compute_step_positions(workflow.prefetched_node_templates)
        return cache[workflow.pk]

    def _get_latest_submission_node(self, obj: Instance):
        return next((node for node in self._get_validation_nodes(obj) if node.status in SUBMISSION_STATUSES), None)

    @staticmethod
    def _user_can_act(validation_node) -> bool:
        # annotated by the list view, with the same rule as the queues (the user must have all the roles of the step)
        return validation_node.annotate_user_can_act

    # fields

    @extend_schema_field({"type": "string", "nullable": True})
    def get_display_name(self, obj: Instance) -> Optional[str]:
        """Values of the label keys of the form, without the personal data the user is not allowed to see."""
        form = obj.form
        if form is None or not form.label_keys or not isinstance(obj.json, dict):
            return None
        allowed_fields = get_allowed_fields(form, self.context["request"].user)
        values = [
            str(obj.json[key])
            for key in form.label_keys
            if obj.json.get(key) not in (None, "") and (allowed_fields is None or key.lower() in allowed_fields)
        ]
        return " ".join(values) or None

    @extend_schema_field(UserSerializer(allow_null=True))
    def get_submitted_by(self, obj: Instance):
        submission_node = self._get_latest_submission_node(obj)
        user = submission_node.created_by if submission_node and submission_node.created_by else obj.created_by
        return UserSerializer(user).data if user else None

    @extend_schema_field(serializers.DateTimeField(allow_null=True))
    def get_submitted_at(self, obj: Instance):
        submission_node = self._get_latest_submission_node(obj)
        submitted_at = submission_node.created_at if submission_node else (obj.source_created_at or obj.created_at)
        return serializers.DateTimeField().to_representation(submitted_at) if submitted_at else None

    @extend_schema_field(serializers.BooleanField)
    def get_is_resubmission(self, obj: Instance) -> bool:
        submission_node = self._get_latest_submission_node(obj)
        return bool(submission_node and submission_node.status == ValidationNodeStatus.NEW_VERSION)

    @extend_schema_field(CurrentStepSerializer(many=True))
    def get_current_steps(self, obj: Instance):
        if obj.general_validation_status != ValidationWorkflowArtefactStatus.PENDING:
            return []
        positions = self._get_step_positions(obj)
        pending_nodes = sorted(
            (node for node in self._get_validation_nodes(obj) if node.status == ValidationNodeStatus.UNKNOWN),
            key=lambda node: node.created_at,
        )
        steps = [
            {
                "id": node.pk,
                "node_template_id": node.node_id,
                "name": node.node.name,
                "position": positions.get(node.node_id),
                "pending_since": node.created_at,
                "user_can_act": self._user_can_act(node),
            }
            for node in pending_nodes
        ]
        return CurrentStepSerializer(steps, many=True).data

    @extend_schema_field(serializers.IntegerField(allow_null=True))
    def get_step_count(self, obj: Instance) -> Optional[int]:
        positions = self._get_step_positions(obj)
        return max(positions.values()) if positions else None

    @extend_schema_field(LastUserActionSerializer(allow_null=True))
    def get_last_user_action(self, obj: Instance):
        user = self.context["request"].user
        completed_nodes = [
            node
            for node in self._get_validation_nodes(obj)
            if node.updated_by_id == user.pk and node.status in COMPLETED_STATUSES
        ]
        if not completed_nodes:
            return None
        last_node = max(completed_nodes, key=lambda node: node.updated_at)
        return LastUserActionSerializer(
            {
                "status": last_node.status,
                "name": last_node.node.name,
                "position": self._get_step_positions(obj).get(last_node.node_id),
                "date": last_node.updated_at,
            }
        ).data
