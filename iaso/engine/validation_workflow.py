from typing import Optional

from django.db import transaction

from iaso.models import Instance, ValidationStatus
from iaso.models.validation_workflow.validation_status import Status


class ValidationWorkflowEngine:
    @staticmethod
    def start(workflow_template, user, entity: Instance):
        if entity and not workflow_template.is_entity_allowed(entity):
            raise ValueError("Invalid entity type")

        if entity.has_workflow(workflow_template):
            raise ValueError("Entity is already attached to a related workflow")

        starting_node = workflow_template.get_starting_node()

        if starting_node is None:
            raise ValueError("Workflow has no starting node")

        return ValidationWorkflowEngine._activate_node(starting_node, entity, user)

    @staticmethod
    def _activate_node(node, instance, user):
        ValidationStatus.objects.create(node=node, instance=instance, created_by=user)

    @staticmethod
    def complete_node(validation_status: ValidationStatus, user, approved=False, comment: Optional[str] = ""):
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
