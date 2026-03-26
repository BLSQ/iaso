from typing import Optional

from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Q

from iaso.engine.exceptions import ValidationWorkflowEngineException
from iaso.models import ValidationNode, ValidationNodeTemplate, ValidationWorkflow
from iaso.models.common import ValidationWorkflowArtefact, ValidationWorkflowArtefactStatus
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus


class ValidationWorkflowEngine:
    @staticmethod
    @transaction.atomic
    def start(
        workflow_template,
        user,
        artifact: ValidationWorkflowArtefact,
        parent_artifact: Optional[ValidationWorkflowArtefact] = None,
    ):
        update_fields = ["general_validation_status"]
        if artifact and not workflow_template.is_artifact_allowed(artifact):
            raise ValidationWorkflowEngineException("Invalid artifact type")

        if artifact.has_workflow(workflow_template):
            raise ValidationWorkflowEngineException("Artifact is already attached to a related workflow")

        if parent_artifact:
            if not workflow_template.is_artifact_allowed(parent_artifact):
                raise ValidationWorkflowEngineException("Invalid parent artifact type")

            if not parent_artifact.has_workflow(workflow_template):
                raise ValidationWorkflowEngineException("Invalid parent artifact: no related workflow")

            if parent_artifact.general_validation_status != ValidationWorkflowArtefactStatus.REJECTED:
                raise ValidationWorkflowEngineException("Invalid parent artifact: workflow is in incorrect status")

            artifact.parent_artefact_for_validation = parent_artifact
            update_fields.append("parent_artefact_for_validation")

        artifact.general_validation_status = ValidationWorkflowArtefactStatus.PENDING
        artifact.save(update_fields=update_fields)

        starting_node = workflow_template.get_starting_node()

        if starting_node is None:
            raise ValidationWorkflowEngineException("Workflow has no starting node")

        return ValidationWorkflowEngine._activate_node(starting_node, artifact, user)

    @staticmethod
    def _activate_node(node: ValidationNodeTemplate, instance: ValidationWorkflowArtefact, user):
        ValidationNode.objects.create(node=node, instance=instance, created_by=user)

    @staticmethod
    @transaction.atomic
    def complete_node_by_passing(
        node: ValidationNodeTemplate,
        user,
        artifact: ValidationWorkflowArtefact,
        workflow: ValidationWorkflow,
        approved: Optional[bool] = False,
        comment: Optional[str] = "",
    ):
        # this function will need to be adapted in case of more complex graph, there the assumption is made that it's linear
        # it will also need to be optimized

        if not node.can_skip_previous_nodes:
            raise ValidationWorkflowEngineException("Skipping previous nodes is not possible")

        if artifact.general_validation_status == ValidationWorkflowArtefactStatus.REJECTED:
            raise ValidationWorkflowEngineException("Already rejected, cannot skip")

        validation_status, created = ValidationNode.objects.get_or_create(node=node, instance=artifact)
        validation_status.updated_by = user

        if not created and validation_status.status != ValidationNodeStatus.UNKNOWN:
            raise ValidationWorkflowEngineException("Already completed")

        if not created:
            # it means previous node (linear assumption) has already been approved
            ValidationWorkflowEngine.complete_node(
                validation_status, user, artifact=artifact, approved=approved, comment=comment
            )
            return

        forbidden_pk = {validation_status.pk}
        forbidden_pk.update(validation_status.get_next_nodes().values_list("pk", flat=True))

        next_pending = artifact.get_next_pending_nodes(workflow).exclude(pk__in=forbidden_pk)

        while next_pending.exists():
            ValidationWorkflowEngine.complete_node(
                next_pending.first(),
                user,
                artifact=artifact,
                skipped=True,
                skipped_from_parent=node,
                update_artifact=False,
            )
            next_pending = artifact.get_next_pending_nodes(workflow).exclude(pk__in=forbidden_pk)

        ValidationWorkflowEngine.complete_node(
            validation_status, user, artifact=artifact, comment=comment, approved=approved, update_artifact=False
        )

        artifact.save(update_fields=["general_validation_status"])

    @staticmethod
    @transaction.atomic
    def complete_node(
        validation_status: ValidationNode,
        user,
        artifact: ValidationWorkflowArtefact,
        approved: Optional[bool] = False,
        comment: Optional[str] = "",
        skipped: Optional[bool] = False,
        skipped_from_parent: Optional[ValidationNodeTemplate] = None,
        update_artifact: Optional[bool] = True,
    ):
        if not skipped:
            ValidationWorkflowEngine._check_permissions_for_node(validation_status, user)

        if validation_status.status != ValidationNodeStatus.UNKNOWN:
            raise ValidationWorkflowEngineException("Already completed")

        validation_status.updated_by = user
        validation_status.comment = comment

        if skipped:
            validation_status.status = ValidationNodeStatus.SKIPPED
        elif approved:
            validation_status.status = ValidationNodeStatus.ACCEPTED
        else:
            validation_status.status = ValidationNodeStatus.REJECTED

        if approved and validation_status.node.is_final_node():
            validation_status.final = True
            artifact.general_validation_status = ValidationWorkflowArtefactStatus.APPROVED
            if update_artifact:
                artifact.save(update_fields=["general_validation_status"])
        elif not approved and not skipped:
            artifact.general_validation_status = ValidationWorkflowArtefactStatus.REJECTED
            if update_artifact:
                artifact.save(update_fields=["general_validation_status"])

        validation_status.save()

        if approved:
            for node in validation_status.node.next_node_templates.all():
                ValidationWorkflowEngine._activate_node(node, validation_status.instance, user)
        elif skipped:
            for node in validation_status.node.next_node_templates.exclude(pk=skipped_from_parent.pk).all():
                ValidationWorkflowEngine._activate_node(node, validation_status.instance, user)

    @staticmethod
    def _check_permissions_for_node(validation_status: ValidationNode, user):
        """
        We check if the user has the permission to complete this node.
        """
        required_roles = validation_status.node.roles_required.all()

        if not required_roles:
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
    def _can_undo_node(validation_status: ValidationNode, user):
        if validation_status.status == ValidationNodeStatus.UNKNOWN:
            raise ValidationWorkflowEngineException("Cannot undo node that hasn't been completed yet")

        if validation_status.final:
            raise ValidationWorkflowEngineException("Cannot undo final node")

        if validation_status.status == ValidationNodeStatus.REJECTED:
            raise ValidationWorkflowEngineException("Cannot undo rejected node")

        if validation_status.status != ValidationNodeStatus.ACCEPTED:
            raise ValidationWorkflowEngineException("Cannot undo node that isn't accepted")

        if validation_status.updated_by != user:
            raise PermissionDenied(f"Only user {validation_status.updated_by.username} can undo this action")

        # if there are any nodes further on that have already been approved/rejected, not allowed, it's too late
        if (
            validation_status.get_next_nodes()
            .filter(Q(status=ValidationNodeStatus.ACCEPTED) | Q(status=ValidationNodeStatus.REJECTED))
            .exists()
        ):
            raise ValidationWorkflowEngineException("Cannot undo node as next nodes have been completed")

    @staticmethod
    @transaction.atomic
    def undo_node(
        validation_status: ValidationNode, user, instance: ValidationWorkflowArtefact, workflow: ValidationWorkflow
    ):
        ValidationWorkflowEngine._can_undo_node(validation_status, user)

        instance.get_next_pending_nodes(workflow).delete()

        validation_status.updated_by = None
        validation_status.status = ValidationNodeStatus.UNKNOWN
        validation_status.comment = ""
        validation_status.save()

        # todo : optimize this
        if validation_status.node.can_skip_previous_nodes:
            # there, it might be that previous nodes have been skipped and hence must be reverted
            if instance.validationnode_set.filter(
                node__workflow=workflow, status=ValidationNodeStatus.SKIPPED
            ).exists():
                validation_status.status = ValidationNodeStatus.ACCEPTED
                validation_status.save()
                for skipped_validation_node in validation_status.node.get_all_previous_nodes_with_validation_status(
                    instance
                ).filter(validationnode__status=ValidationNodeStatus.SKIPPED):
                    for skipped_validation_status in skipped_validation_node.validationnode_set.all():
                        skipped_validation_status.delete()

                # it might happen after that there is no next pending state
                # e.g APPROVED => SKIPPED => APPROVED WITH PASS could become APPROVED
                if not instance.get_next_pending_nodes(workflow).exists():
                    next_validation = instance.validationnode_set.filter(
                        status=ValidationNodeStatus.ACCEPTED, node__workflow=workflow
                    ).last()
                    if next_validation:
                        for node in next_validation.node.next_node_templates.all():
                            ValidationWorkflowEngine._activate_node(node, validation_status.instance, user)

                validation_status.delete()
