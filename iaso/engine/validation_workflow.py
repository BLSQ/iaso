from typing import Optional

from django.core.exceptions import PermissionDenied
from django.db import transaction

from iaso.models import Instance, ValidationStatus
from iaso.models.validation_workflow.validation_status import Status


class ValidationWorkflowEngine:
    @staticmethod
    @transaction.atomic
    def start(workflow_template, user, entity: Instance, parent_entity: Optional[Instance] = None):
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
    def _activate_node(node, instance, user):
        ValidationStatus.objects.create(node=node, instance=instance, created_by=user)

    @staticmethod
    def complete_node(validation_status: ValidationStatus, user, approved=False, comment: Optional[str] = ""):
        ValidationWorkflowEngine._check_permissions_for_node(validation_status, user)

        if validation_status.status != Status.UNKNOWN:
            raise ValueError("Already completed")

        validation_status.updated_by = user
        validation_status.comment = comment
        validation_status.status = Status.ACCEPTED if approved else Status.REJECTED

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
    def _can_undo_node(validation_status: ValidationStatus):
        if validation_status.status == Status.UNKNOWN:
            raise ValueError("Cannot undo node that hasn't been completed yet")

        if validation_status.final:
            raise ValueError("Cannot undo final node")

        # if there are any nodes further on that have already been approved/rejected, not allowed, it's too late

    @staticmethod
    @transaction.atomic
    def undo_node(validation_status: ValidationStatus, user):
        # todo
        ValidationWorkflowEngine._can_undo_node(validation_status)

        if validation_status.status != Status.ACCEPTED:
            raise ValueError("Cannot undo node that isn't accepted")

        validation_status.updated_by = None
        validation_status.status = Status.UNKNOWN
        validation_status.comment = ""
        validation_status.save()

        # delete next related validation status
        validation_status.get_next_validation_statuses().delete()
