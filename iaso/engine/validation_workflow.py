from typing import Optional

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import PermissionDenied
from django.db import transaction

from iaso.models import (
    ValidationStateObject,
    ValidationStateTemplate,
    ValidationStepObject,
    ValidationStepTemplate,
    ValidationWorkflowObject,
    ValidationWorkflowTemplate,
)
from iaso.models.validation_workflow.run_instances import (
    ValidationStateObjectStatus,
    ValidationStepObjectStatus,
    ValidationWorkflowObjectStatus,
)
from iaso.models.validation_workflow.templates import ValidationStateTemplateMergeStrategy, ValidationStateTemplateType


class WorkflowEngine:
    @staticmethod
    @transaction.atomic
    def start(workflow_template: ValidationWorkflowTemplate, user, entity=None):
        """
        Start a workflow by creating a workflow object and activating the START step.
        We also check the entity passed.
        """

        if entity and not workflow_template.is_entity_allowed(entity):
            raise ValueError("This workflow cannot be attached to this entity type")

        if entity:
            ct = ContentType.objects.get_for_model(entity)
            workflow_object = ValidationWorkflowObject.objects.create(
                created_by=user, workflow_template=workflow_template, content_type=ct, object_id=entity.pk
            )
        else:
            workflow_object = ValidationWorkflowObject.objects.create(
                workflow_template=workflow_template, created_by=user
            )

        start_state_template = workflow_template.get_start_state()

        return WorkflowEngine._activate_state(workflow_object=workflow_object, state_template=start_state_template)

    @staticmethod
    def _activate_state(
        workflow_object: ValidationWorkflowObject,
        state_template: ValidationStateTemplate,
        caused_by_step_object: Optional[ValidationStepObject] = None,
    ):
        """
        This function is solely responsible for activating a state and the outgoing related steps (if any) if the incoming transitions are approved.

        In case of END state, it also closes the workflow by setting it to approved.

        In case of START state, it auto sets the state to COMPLETED
        """

        state_object = ValidationStateObject.objects.create(
            workflow_object=workflow_object,
            state_template=state_template,
            status=ValidationStateObjectStatus.ACTIVE,
        )

        if caused_by_step_object is not None:
            caused_by_step_object.to_state_object = state_object
            caused_by_step_object.save(update_fields=["to_state_object"])

        # END node => complete and end workflow (approved)
        if state_template.state_type == ValidationStateTemplateType.END:
            state_object.status = ValidationStateObjectStatus.COMPLETED
            state_object.save(update_fields=["status"])

            workflow_object.status = ValidationWorkflowObjectStatus.APPROVED
            workflow_object.save(update_fields=["status"])
            return workflow_object

        # Create ValidationStepObject for all steps outgoing from this state
        with transaction.atomic():
            ValidationStepObject.objects.bulk_create(
                (
                    ValidationStepObject(
                        from_state_object=state_object,
                        step_template=step_template,
                        status=ValidationStepObjectStatus.PENDING,
                    )
                    for step_template in state_template.outgoing.all()
                ),
                batch_size=1000,
            )

        # START node auto-completes
        if state_template.state_type == ValidationStateTemplateType.START:
            state_object.status = ValidationStateObjectStatus.COMPLETED
            state_object.save(update_fields=["status"])
            # we move to the next node
            WorkflowEngine._advance_state(state_object)

        return state_object

    @staticmethod
    @transaction.atomic
    def complete_step(step_object: ValidationStepObject, approved: bool, user, comment: Optional[str] = None):
        """
        Complete (finish) a ValidationStepObject.
        Business logic POV: the user decides to validate or not the step.
        """

        if step_object.status != ValidationStepObjectStatus.PENDING:
            raise ValueError("Step already done")

        # we check if the user has permissions to approve/reject this step
        WorkflowEngine._check_step_permission(user=user, step_template=step_object.step_template)

        step_object.status = ValidationStepObjectStatus.APPROVED if approved else ValidationStepObjectStatus.REJECTED

        if comment:
            step_object.comment = comment

        if user:
            step_object.updated_by = user

        step_object.save()

        if not approved:
            # Handle the reject here, if rejection_target is set we fall back to that node, otherwise we stop completely
            if step_object.step_template.rejection_target:
                state_object = step_object.from_state_object

                # Cancel remaining pending steps (e.g parallel routes)
                # WorkflowEngine._cancel_other_pending(state_object)

                state_object.status = ValidationStateObjectStatus.COMPLETED
                state_object.save()

                # Activate rejection target
                WorkflowEngine._activate_state(
                    workflow_object=state_object.workflow_object,
                    state_template=step_object.step_template.rejection_target,
                    caused_by_step_object=step_object,
                )
                return
            state_object = step_object.from_state_object
            workflow_object = state_object.workflow_object

            # Complete the node
            state_object.status = ValidationStateObjectStatus.COMPLETED
            state_object.save(update_fields=["status"])

            # Finalize workflow
            workflow_object.status = ValidationWorkflowObjectStatus.REJECTED
            workflow_object.save(update_fields=["status"])
            return

        # Otherwise continue normal flow: approve
        WorkflowEngine._advance_state(step_object.from_state_object)

    @staticmethod
    def _advance_state(state_object: ValidationStateObject):
        """
        Moving to next state.
        """

        if not state_object.workflow_object.is_active:
            return

        state_template = state_object.state_template
        # transitions = node_object.outgoing_transition_objects.all()
        #
        # pending = transitions.filter(status=ValidationStepObject.Status.PENDING)
        # approved = transitions.filter(status=ValidationStepObject.Status.APPROVED)
        # rejected = transitions.filter(status=ValidationStepObject.Status.REJECTED)

        strategy = state_template.merge_strategy

        # todo : review this
        # if strategy == ValidationStateTemplate.MergeStrategy.WAIT_ALL:
        #
        #     if pending.exists():
        #         return
        #
        #     node_object.status = ValidationStateObject.Status.COMPLETED
        #     node_object.save()
        #
        #     for ti in approved:
        #         WorkflowEngine._activate_node(
        #             workflow_object=node_object.workflow_object,
        #             node=ti.transition.to_node,
        #         )
        #     return
        #
        # elif strategy == ValidationStateTemplate.MergeStrategy.PRIORITY:
        #
        #     if approved.exists():
        #
        #         # Highest approved transition
        #         winner = approved.order_by("-transition__priority").first()
        #
        #         # Cancel lower-priority pending transitions
        #         for ti in pending:
        #             if ti.transition.priority < winner.transition.priority:
        #                 ti.status = ValidationStepObject.Status.CANCELLED
        #                 ti.save()
        #
        #         # Recompute pending after cancellations
        #         remaining_pending = node_object.transition_objects.filter(
        #             status=ValidationStepObject.Status.PENDING
        #         )
        #
        #         # If no higher priority still pending → finalize
        #         if not remaining_pending.filter(
        #                 transition__priority__gt=winner.transition.priority
        #         ).exists():
        #             node_object.status = ValidationStateObject.Status.COMPLETED
        #             node_object.save()
        #
        #             WorkflowEngine._activate_node(
        #                 workflow_object=node_object.workflow_object,
        #                 node=winner.transition.to_node,
        #             )
        #             return
        #
        #     # If nothing pending and no approvals
        #     if not pending.exists():
        #         node_object.status = ValidationStateObject.Status.COMPLETED
        #         node_object.save()
        #
        #     return

        if strategy == ValidationStateTemplateMergeStrategy.LINEAR:
            # no strategy, meaning there isn't any split, we just move on to next one

            step_object = state_object.outgoing_step_objects.get()

            if step_object.status == ValidationStepObjectStatus.PENDING:
                return  # transition still pending, waiting for user to do anything

            # otherwise we can already assume the node is completed
            state_object.status = ValidationStateObjectStatus.COMPLETED
            state_object.save()

            if step_object.status == ValidationStepObjectStatus.APPROVED:
                WorkflowEngine._activate_state(
                    state_object.workflow_object, step_object.step_template.to_state, step_object
                )
                return
            # rejected

    # @staticmethod
    # @transaction.atomic
    # def _cancel_other_pending(state_instance: ValidationStateObject):
    #     """
    #     Cancel all remaining pending transitions
    #     Business logic POV: there are parallel branches and one of them got rejected, we have to automatically cancel the other ones
    #     """
    #
    #     bulk_update_objects = []
    #
    #     for transition_instance in state_instance.transition_instances.filter(
    #         status=ValidationStepObject.Status.PENDING
    #     ):
    #         transition_instance.status = ValidationStepObject.Status.CANCELLED
    #         bulk_update_objects.append(transition_instance)
    #
    #     ValidationStepObject.objects.bulk_update(bulk_update_objects, fields=["status"], batch_size=500)

    # @staticmethod
    # def cancel_node(node_instance):
    #     """
    #     Cancel a node instance entirely.
    #     """
    #     node_instance.status = ValidationStateObject.Status.CANCELLED
    #     node_instance.save()
    #
    #     for transition_instance in node_instance.transition_instances.filter(
    #         status=ValidationStepObject.Status.PENDING
    #     ):
    #         transition_instance.status = ValidationStepObject.Status.CANCELLED
    #         transition_instance.save(update_fields=["status"])

    @staticmethod
    def _check_step_permission(user, step_template: ValidationStepTemplate):
        """
        We check if the user has the permission to execute this step.
        """
        required_roles = step_template.roles_required.all()

        if not required_roles.exists():
            return  # No perm required , anybody can do it

        if user is None:  # not sure it'll happen IRL
            raise PermissionDenied("User required for this transition")

        if not hasattr(user, "iaso_profile"):  # not sure it'll happen IRL
            raise PermissionDenied("User required for this step")

        if not user.iaso_profile:  # not sure it'll happen IRL
            raise PermissionDenied("User required for this step")

        user_role_ids = user.iaso_profile.user_roles.values_list("pk", flat=True)

        required_roles_id = required_roles.values_list("pk", flat=True)

        if not set(required_roles_id).issubset(set(user_role_ids)):
            raise PermissionDenied("You do not have permission to execute this step")

    @staticmethod
    def can_undo_step_object(step_object: ValidationStepObject, user):
        if step_object.status == ValidationStepObjectStatus.PENDING:
            return False

        to_state = step_object.to_state_object
        if not to_state:
            return False

        workflow_object = step_object.from_state_object.workflow_object
        if not workflow_object.is_active:
            # If workflow is completed, only allow undo if this step ended it
            if to_state.state_template.state_type != ValidationStateTemplateType.END:
                return False

        if step_object.to_state_object.outgoing_step_objects.exclude(
            status=ValidationStepObjectStatus.PENDING
        ).exists():
            return False

        return True

    @staticmethod
    @transaction.atomic
    def undo_step_object(step_object: ValidationStepObject, user):
        if not WorkflowEngine.can_undo_step_object(step_object, user):
            raise ValueError("Step can no longer be undone.")

        if step_object.updated_by != user:
            raise ValueError("Only the same user can undone the step.")

        from_state = step_object.from_state_object
        to_state = step_object.to_state_object

        to_state.delete()

        if from_state.state_template.state_type != ValidationStateTemplateType.START:
            from_state.status = ValidationStateObjectStatus.ACTIVE
            from_state.save(update_fields=["status"])

        if to_state.state_template.state_type == ValidationStateTemplateType.END:
            to_state.workflow_object.status = ValidationWorkflowObjectStatus.ACTIVE
            to_state.workflow_object.save(update_fields=["status"])

        step_object.status = ValidationStepObjectStatus.PENDING
        step_object.comment = ""
        step_object.updated_by = None
        step_object.to_state_object = None
        step_object.save()
