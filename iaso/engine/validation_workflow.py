from typing import Optional

from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Q

from iaso.models import ValidationNode, ValidationStatus, ValidationWorkflow
from iaso.models.common import ValidationWorkflowEntity
from iaso.models.validation_workflow.validation_status import Status


class ValidationWorkflowEngine:
    @staticmethod
    @transaction.atomic
    def start(
        workflow_template,
        user,
        entity: ValidationWorkflowEntity,
        parent_entity: Optional[ValidationWorkflowEntity] = None,
    ):
        if entity and not workflow_template.is_entity_allowed(entity):
            raise ValueError("Invalid entity type")

        if entity.has_workflow(workflow_template):
            raise ValueError("Entity is already attached to a related workflow")

        if parent_entity:
            if not workflow_template.is_entity_allowed(parent_entity):
                raise ValueError("Invalid parent entity type")

            if not parent_entity.has_workflow(workflow_template):
                raise ValueError("Invalid parent entity: no related workflow")

            if parent_entity.get_validation_status(workflow_template) != "REJECTED":
                raise ValueError("Invalid parent entity: workflow is in incorrect status")

            entity.parent_instance_for_validation = parent_entity
            entity.save()

        starting_node = workflow_template.get_starting_node()

        if starting_node is None:
            raise ValueError("Workflow has no starting node")

        return ValidationWorkflowEngine._activate_node(starting_node, entity, user)

    @staticmethod
    def _activate_node(node: ValidationNode, instance: ValidationWorkflowEntity, user):
        ValidationStatus.objects.create(node=node, instance=instance, created_by=user)

    @staticmethod
    @transaction.atomic
    def complete_node_by_passing(
        node: ValidationNode,
        user,
        instance: ValidationWorkflowEntity,
        workflow: ValidationWorkflow,
        approved: Optional[bool] = False,
        comment: Optional[str] = "",
    ):
        # this will need to be adapted in case of more complex graph, there the assumption is made that it's linear
        if not node.can_skip_previous_nodes:
            raise ValueError("Skipping previous nodes is not possible")

        validation_status, created = ValidationStatus.objects.get_or_create(node=node, instance=instance)
        validation_status.updated_by = user

        if not created and validation_status.status != Status.UNKNOWN:
            raise ValueError("Already completed")

        if not created:
            validation_status.status = Status.ACCEPTED if approved else Status.REJECTED
            validation_status.comment = comment
            validation_status.approved = approved
            validation_status.save()
            return

        while instance.get_next_pending_states(workflow).first().node != node:
            ValidationWorkflowEngine.complete_node(
                instance.get_next_pending_states(workflow).first(), user, skipped=True
            )

        ValidationWorkflowEngine.complete_node(validation_status, user, comment=comment, approved=True)

    @staticmethod
    def complete_node(
        validation_status: ValidationStatus,
        user,
        approved=False,
        comment: Optional[str] = "",
        skipped: Optional[bool] = False,
    ):
        if not skipped:
            ValidationWorkflowEngine._check_permissions_for_node(validation_status, user)

        if validation_status.status != Status.UNKNOWN:
            raise ValueError("Already completed")

        validation_status.updated_by = user
        validation_status.comment = comment

        if skipped:
            validation_status.status = Status.SKIPPED
        elif approved:
            validation_status.status = Status.ACCEPTED
        else:
            validation_status.status = Status.REJECTED

        if approved and validation_status.node.is_final_node():
            validation_status.final = True

        validation_status.save()

        if approved:
            for node in validation_status.node.next_nodes.all():
                ValidationWorkflowEngine._activate_node(node, validation_status.instance, user)

    @staticmethod
    def _check_permissions_for_node(validation_status: ValidationStatus, user):
        """
        We check if the user has the permission to complete this node.
        """
        required_roles = validation_status.node.roles_required.all()

        if not required_roles.exists():
            return  # No perm required , anybody can do it

        if user is None or getattr(user, "is_anonymous", True):  # not sure it'll happen IRL
            raise PermissionDenied("User required")

        if not hasattr(user, "iaso_profile"):  # not sure it'll happen IRL
            raise PermissionDenied("User required")

        if not user.iaso_profile:  # not sure it'll happen IRL
            raise PermissionDenied("User required")

        user_role_ids = user.iaso_profile.user_roles.values_list("pk", flat=True)

        required_roles_id = required_roles.values_list("pk", flat=True)

        if not set(required_roles_id).issubset(set(user_role_ids)):
            raise PermissionDenied("You do not have permission to complete this task")

    @staticmethod
    def _can_undo_node(validation_status: ValidationStatus, user):
        if validation_status.status == Status.UNKNOWN:
            raise ValueError("Cannot undo node that hasn't been completed yet")

        if validation_status.final:
            raise ValueError("Cannot undo final node")

        if validation_status.status == Status.REJECTED:
            raise ValueError("Cannot undo rejected node")

        if validation_status.updated_by != user:
            raise PermissionDenied(f"Only user {validation_status.updated_by.username} can undo this action")

        # if there are any nodes further on that have already been approved/rejected, not allowed, it's too late
        if validation_status.get_next_states().filter(Q(status=Status.ACCEPTED) | Q(status=Status.REJECTED)).exists():
            raise ValueError("Cannot undo node as next nodes have been completed")

    @staticmethod
    @transaction.atomic
    def undo_node(
        validation_status: ValidationStatus, user, instance: ValidationWorkflowEntity, workflow: ValidationWorkflow
    ):
        ValidationWorkflowEngine._can_undo_node(validation_status, user)

        if validation_status.status != Status.ACCEPTED:
            raise ValueError("Cannot undo node that isn't accepted")

        instance.get_next_pending_states(workflow).delete()

        validation_status.updated_by = None
        validation_status.status = Status.UNKNOWN
        validation_status.comment = ""
        validation_status.save()
