from typing import Optional

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import PermissionDenied
from django.db import transaction

from iaso.models import (
    ValidationNode,
    ValidationNodeInstance,
    ValidationTransition,
    ValidationTransitionInstance,
    ValidationWorkflow,
    ValidationWorkflowInstance,
)
from iaso.models.validation_workflow.run_instances import ValidationWorkflowInstanceStatus


class WorkflowEngine:
    @staticmethod
    @transaction.atomic
    def start(workflow: ValidationWorkflow, user, entity=None):
        """
        Start a workflow by creating a workflow instance and activating the START node.
        We also check the entity passed.
        """

        if entity and not workflow.is_entity_allowed(entity):
            raise ValueError("This workflow cannot be attached to this entity type")

        if entity:
            ct = ContentType.objects.get_for_model(entity)
            workflow_instance = ValidationWorkflowInstance.objects.create(
                created_by=user, workflow=workflow, content_type=ct, object_id=entity.pk
            )
        else:
            workflow_instance = ValidationWorkflowInstance.objects.create(workflow=workflow, created_by=user)

        start_node = workflow.get_start_node()

        return WorkflowEngine._activate_node(
            workflow_instance=workflow_instance,
            node=start_node,
        )

    @staticmethod
    def _activate_node(workflow_instance: ValidationWorkflowInstance, node: ValidationNode):
        """
        Create a NodeInstance and initialize its transitions. It should only happen when the incoming transition has been approved or if it's a start node.
        START nodes auto-complete immediately.
        """

        node_instance = ValidationNodeInstance.objects.create(
            workflow_instance=workflow_instance,
            node=node,
            status=ValidationNodeInstance.Status.ACTIVE,
        )

        # END node => complete and end workflow
        if node.node_type == ValidationNode.NodeType.END:
            node_instance.status = ValidationNodeInstance.Status.COMPLETED
            node_instance.save(update_fields=["status"])

            workflow_instance.status = ValidationWorkflowInstanceStatus.APPROVED
            workflow_instance.save(update_fields=["status"])
            return node_instance

        # Create TransitionInstances for all transition outgoing from this node
        with transaction.atomic():
            ValidationTransitionInstance.objects.bulk_create(
                (
                    ValidationTransitionInstance(
                        from_node_instance=node_instance,
                        transition=transition,
                        status=ValidationTransitionInstance.Status.PENDING,
                    )
                    for transition in node.outgoing.all()
                ),
                batch_size=1000,
            )

        # START node auto-completes
        if node.node_type == ValidationNode.NodeType.START:
            node_instance.status = ValidationNodeInstance.Status.COMPLETED
            node_instance.save(update_fields=["status"])
            WorkflowEngine._advance_node(node_instance)

        return node_instance

    @staticmethod
    @transaction.atomic
    def complete_transition(
        transition_instance: ValidationTransitionInstance, approved: bool, user, comment: Optional[str] = None
    ):
        """
        Complete a TransitionInstance.
        Business logic POV: the user decides to validate or not the step.
        """

        if transition_instance.status != ValidationTransitionInstance.Status.PENDING:
            raise ValueError("Transition already done")

        # we check if the user has permissions to approve/reject this step
        WorkflowEngine._check_transition_permission(
            user=user,
            transition=transition_instance.transition,
        )

        transition_instance.status = (
            ValidationTransitionInstance.Status.APPROVED if approved else ValidationTransitionInstance.Status.REJECTED
        )

        if not approved and comment:
            transition_instance.rejection_comment = comment
        if user:
            transition_instance.updated_by = user
        transition_instance.save()

        if not approved:
            # Handle the reject here, if rejection_target is set we fallback to that node, otherwise we stop completely
            if transition_instance.transition.rejection_target:
                node_instance = transition_instance.from_node_instance

                # Cancel remaining pending transitions (e.g parallel routes)
                # WorkflowEngine._cancel_other_pending(node_instance)

                node_instance.status = ValidationNodeInstance.Status.COMPLETED
                node_instance.save()

                # Activate rejection target
                WorkflowEngine._activate_node(
                    workflow_instance=node_instance.workflow_instance,
                    node=transition_instance.transition.rejection_target,
                )
                return
            node_instance = transition_instance.from_node_instance
            workflow_instance = node_instance.workflow_instance

            # Complete the node
            node_instance.status = ValidationNodeInstance.Status.COMPLETED
            node_instance.save(update_fields=["status"])

            # Finalize workflow
            workflow_instance.status = ValidationWorkflowInstanceStatus.REJECTED
            workflow_instance.save(update_fields=["status"])
            return

        # Otherwise continue normal flow: approve
        WorkflowEngine._advance_node(transition_instance.from_node_instance)

    @staticmethod
    def _advance_node(node_instance: ValidationNodeInstance):
        """
        Moving to next node.
        """

        if not node_instance.workflow_instance.is_active:
            return

        node = node_instance.node
        # transitions = node_instance.outgoing_transition_instances.all()
        #
        # pending = transitions.filter(status=ValidationTransitionInstance.Status.PENDING)
        # approved = transitions.filter(status=ValidationTransitionInstance.Status.APPROVED)
        # rejected = transitions.filter(status=ValidationTransitionInstance.Status.REJECTED)

        strategy = node.merge_strategy

        # if strategy == ValidationNode.MergeStrategy.WAIT_ALL:
        #
        #     if pending.exists():
        #         return
        #
        #     node_instance.status = ValidationNodeInstance.Status.COMPLETED
        #     node_instance.save()
        #
        #     for ti in approved:
        #         WorkflowEngine._activate_node(
        #             workflow_instance=node_instance.workflow_instance,
        #             node=ti.transition.to_node,
        #         )
        #     return
        #
        # elif strategy == ValidationNode.MergeStrategy.PRIORITY:
        #
        #     if approved.exists():
        #
        #         # Highest approved transition
        #         winner = approved.order_by("-transition__priority").first()
        #
        #         # Cancel lower-priority pending transitions
        #         for ti in pending:
        #             if ti.transition.priority < winner.transition.priority:
        #                 ti.status = ValidationTransitionInstance.Status.CANCELLED
        #                 ti.save()
        #
        #         # Recompute pending after cancellations
        #         remaining_pending = node_instance.transition_instances.filter(
        #             status=ValidationTransitionInstance.Status.PENDING
        #         )
        #
        #         # If no higher priority still pending → finalize
        #         if not remaining_pending.filter(
        #                 transition__priority__gt=winner.transition.priority
        #         ).exists():
        #             node_instance.status = ValidationNodeInstance.Status.COMPLETED
        #             node_instance.save()
        #
        #             WorkflowEngine._activate_node(
        #                 workflow_instance=node_instance.workflow_instance,
        #                 node=winner.transition.to_node,
        #             )
        #             return
        #
        #     # If nothing pending and no approvals
        #     if not pending.exists():
        #         node_instance.status = ValidationNodeInstance.Status.COMPLETED
        #         node_instance.save()
        #
        #     return

        if strategy == ValidationNode.MergeStrategy.LINEAR:
            # no strategy, meaning there isn't any split, we just move on

            transition_instance = node_instance.outgoing_transition_instances.get()

            if transition_instance.status == ValidationTransitionInstance.Status.PENDING:
                return  # transition still pending

            # otherwise we can already assume the node is completed
            node_instance.status = ValidationNodeInstance.Status.COMPLETED
            node_instance.save()

            if transition_instance.status == ValidationWorkflowInstanceStatus.APPROVED:
                WorkflowEngine._activate_node(node_instance.workflow_instance, transition_instance.transition.to_node)
                return
            # rejected

    @staticmethod
    @transaction.atomic
    def _cancel_other_pending(node_instance):
        """
        Cancel all remaining pending transitions
        Business logic POV: there are parallel branches and one of them got rejected, we have to automatically cancel the other ones
        """

        bulk_update_objects = []

        for transition_instance in node_instance.transition_instances.filter(
            status=ValidationTransitionInstance.Status.PENDING
        ):
            transition_instance.status = ValidationTransitionInstance.Status.CANCELLED
            bulk_update_objects.append(transition_instance)

        ValidationTransitionInstance.objects.bulk_update(bulk_update_objects, fields=["status"], batch_size=500)

    @staticmethod
    def cancel_node(node_instance):
        """
        Cancel a node instance entirely.
        """
        node_instance.status = ValidationNodeInstance.Status.CANCELLED
        node_instance.save()

        for transition_instance in node_instance.transition_instances.filter(
            status=ValidationTransitionInstance.Status.PENDING
        ):
            transition_instance.status = ValidationTransitionInstance.Status.CANCELLED
            transition_instance.save(update_fields=["status"])

    @staticmethod
    def _check_transition_permission(user, transition: ValidationTransition):
        """
        We check if the user has the permission to execute this transition.
        """
        required_roles = transition.roles_required.all()

        if not required_roles.exists():
            return  # No perm required , anybody can do it

        if user is None:  # not sure it'll happen IRL
            raise PermissionDenied("User required for this transition")

        user_role_ids = user.profile.user_roles.values_list("id", flat=True)

        if not required_roles.filter(id__in=user_role_ids).exists():
            raise PermissionDenied("You do not have permission to execute this transition")
