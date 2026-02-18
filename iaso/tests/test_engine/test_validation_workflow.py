from django.contrib.auth import get_user_model
from django.test import TestCase

from iaso.engine.validation_workflow import WorkflowEngine
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
from iaso.models.validation_workflow.templates import ValidationStateTemplateType


class TestSimpleLinearValidationWorkflowEngine(TestCase):
    """
    This test represents a simple linear workflow :
    * Only one step (step) aka task (e.g check file type)
    * Only two states (start and end)
    * In case of rejection, it stops the flow
    * No permission check
    * No entity/object linked

    In summary:

    [ state : START ]
        |
        |  (step: check file type)
        v
    [  state  : END   ]
    """

    def setUp(self):
        self.user = get_user_model().objects.create_user(username="noprofile", password="testpass")
        self.other_user = get_user_model().objects.create(username="john.doe", password="testpass")
        self.workflow = ValidationWorkflowTemplate.objects.get_or_create(name="test workflow")[0]
        self.start_state = ValidationStateTemplate.objects.create(
            name="start", state_type=ValidationStateTemplateType.START, workflow=self.workflow
        )
        self.end_state = ValidationStateTemplate.objects.create(
            name="end", state_type=ValidationStateTemplateType.END, workflow=self.workflow
        )
        self.step = ValidationStepTemplate.objects.create(
            from_state=self.start_state, to_state=self.end_state, name="check file type"
        )

    def test_start(self):
        WorkflowEngine.start(self.workflow, self.user)

        # check the workflow object
        self.assertEqual(ValidationWorkflowObject.objects.filter(workflow_template=self.workflow).count(), 1)
        workflow_object = ValidationWorkflowObject.objects.filter(workflow_template=self.workflow).first()
        self.assertEqual(workflow_object.status, ValidationWorkflowObjectStatus.ACTIVE)
        self.assertEqual(workflow_object.created_by, self.user)

        # check the starting state - it should be there and autocompleted
        self.assertEqual(
            ValidationStateObject.objects.filter(
                workflow_object=workflow_object, state_template=self.start_state
            ).count(),
            1,
        )
        start_state_object = ValidationStateObject.objects.filter(
            workflow_object=workflow_object, state_template=self.start_state
        ).first()
        self.assertEqual(start_state_object.status, ValidationStateObjectStatus.COMPLETED)

        # check the step after
        self.assertEqual(ValidationStepObject.objects.filter(step_template=self.step).count(), 1)
        step_object = ValidationStepObject.objects.filter(step_template=self.step).first()
        self.assertEqual(step_object.status, ValidationStepObjectStatus.PENDING)

        # check the ending state, it shouldn't be there
        self.assertFalse(
            ValidationStateObject.objects.filter(
                workflow_object=workflow_object, state_template=self.end_state
            ).exists()
        )

    def test_complete_step_by_approving(self):
        WorkflowEngine.start(self.workflow, self.user)

        # get the next step pending => how? => need to find a better way ?
        step_object = ValidationStepObject.objects.filter(step_template=self.step).first()

        WorkflowEngine.complete_step(step_object, True, self.other_user)

        step_object.refresh_from_db()

        workflow_object = ValidationWorkflowObject.objects.filter(workflow_template=self.workflow).first()

        # we check it has been approved
        self.assertEqual(step_object.status, ValidationStepObjectStatus.APPROVED)
        self.assertEqual(step_object.updated_by, self.other_user)
        self.assertEqual(step_object.rejection_comment, "")

        # we check the ending state object has been created
        self.assertEqual(
            ValidationStateObject.objects.filter(
                workflow_object=workflow_object, state_template=self.end_state
            ).count(),
            1,
        )
        ending_state_object = ValidationStateObject.objects.filter(
            workflow_object=workflow_object, state_template=self.end_state
        ).first()
        self.assertEqual(ending_state_object.status, ValidationStateObjectStatus.COMPLETED)

        self.assertEqual(workflow_object.status, ValidationWorkflowObjectStatus.APPROVED)

    def test_complete_step_by_rejecting(self):
        WorkflowEngine.start(self.workflow, self.user)

        # get the next step pending => todo:  need to find a better way ?
        step_object = ValidationStepObject.objects.filter(step_template=self.step).first()

        WorkflowEngine.complete_step(step_object, False, self.other_user, "A rejection comment")

        step_object.refresh_from_db()

        workflow_object = ValidationWorkflowObject.objects.filter(workflow_template=self.workflow).first()

        # we check it has been approved
        self.assertEqual(step_object.status, ValidationStepObjectStatus.REJECTED)
        self.assertEqual(step_object.updated_by, self.other_user)
        self.assertEqual(step_object.rejection_comment, "A rejection comment")

        # we check the ending state object has not been created
        self.assertFalse(
            ValidationStateObject.objects.filter(
                workflow_object=workflow_object, state_template=self.end_state
            ).exists()
        )

        self.assertEqual(workflow_object.status, ValidationWorkflowObjectStatus.REJECTED)

    def test_completing_step_twice_raises_error(self):
        WorkflowEngine.start(self.workflow, self.user)

        step_object = ValidationStepObject.objects.get(step_template=self.step)

        WorkflowEngine.complete_step(
            step_object,
            approved=True,
            user=self.other_user,
        )

        with self.assertRaises(ValueError) as ve:
            WorkflowEngine.complete_step(
                step_object,
                approved=True,
                user=self.other_user,
            )

        self.assertEqual(str(ve.exception), "Step already done")

    def test_no_further_actions_allowed_after_completing(self):
        WorkflowEngine.start(self.workflow, self.user)

        step_object = ValidationStepObject.objects.filter(step_template=self.step).first()

        WorkflowEngine.complete_step(step_object, True, self.other_user)

        step_object.refresh_from_db()

        workflow_object = ValidationWorkflowObject.objects.filter(workflow_template=self.workflow).first()

        self.assertEqual(workflow_object.status, ValidationWorkflowObjectStatus.APPROVED)

        with self.assertRaises(ValueError):
            WorkflowEngine.complete_step(step_object, approved=False, user=self.other_user)


class TestMultiLinearValidationWorkflowEngine(TestCase):
    """
    This test represents a more complex linear workflow :
    * Multiple steps (e.g check file type, check file name, etc)
    * Multiple states (not just a start and end)
    * In case of rejection:
        * at step `manager approves` it goes back to state `start`
        * at any other step it stops the whole flow (and sends back to user)
    * No Permission checks by default

    In summary:

    [ state: START ]
        |
        |  (step: check file type)
        v
    [ state: file type checked ]
        |
        |  (step: check file name)
        v
    [ state: file name checked ]
        |
        |  (step: manager approves)
        v
    [  state: END   ]
    """

    def setUp(self):
        # we define the users
        self.user = get_user_model().objects.create_user(username="noprofile", password="testpass")
        self.other_user = get_user_model().objects.create(username="john.doe", password="testpass")

        # workflow
        self.workflow = ValidationWorkflowTemplate.objects.get_or_create(name="test workflow")[0]

        # states
        self.start_state = ValidationStateTemplate.objects.create(
            name="start", state_type=ValidationStateTemplateType.START, workflow=self.workflow
        )
        self.file_type_checked_state = ValidationStateTemplate.objects.create(
            name="file type checked", state_type=ValidationStateTemplateType.TASK, workflow=self.workflow
        )
        self.file_name_checked_state = ValidationStateTemplate.objects.create(
            name="file name checked", state_type=ValidationStateTemplateType.TASK, workflow=self.workflow
        )
        self.end_state = ValidationStateTemplate.objects.create(
            name="end", state_type=ValidationStateTemplateType.END, workflow=self.workflow
        )

        # step
        self.step_check_file_type = ValidationStepTemplate.objects.create(
            name="check file type", from_state=self.start_state, to_state=self.file_type_checked_state
        )
        self.step_check_file_name = ValidationStepTemplate.objects.create(
            name="check file name", from_state=self.file_type_checked_state, to_state=self.file_name_checked_state
        )
        self.step_manager_approves = ValidationStepTemplate.objects.create(
            name="manager approves",
            from_state=self.file_name_checked_state,
            to_state=self.end_state,
            rejection_target=self.start_state,
        )

    def test_happy_flow(self):
        ### Create
        WorkflowEngine.start(self.workflow, self.user)

        # check the workflow object
        self.assertEqual(ValidationWorkflowObject.objects.filter(workflow_template=self.workflow).count(), 1)
        workflow_object = ValidationWorkflowObject.objects.filter(workflow_template=self.workflow).first()
        self.assertEqual(workflow_object.status, ValidationWorkflowObjectStatus.ACTIVE)
        self.assertEqual(workflow_object.created_by, self.user)

        # check the starting state - it should be there and autocompleted
        self.assertEqual(
            ValidationStateObject.objects.filter(
                workflow_object=workflow_object, state_template=self.start_state
            ).count(),
            1,
        )
        start_state_object = ValidationStateObject.objects.filter(
            workflow_object=workflow_object, state_template=self.start_state
        ).first()
        self.assertEqual(start_state_object.status, ValidationStateObjectStatus.COMPLETED)

        # check the step after
        self.assertEqual(ValidationStepObject.objects.filter(step_template=self.step_check_file_type).count(), 1)
        step_check_file_type_object = ValidationStepObject.objects.filter(
            step_template=self.step_check_file_type
        ).first()
        self.assertEqual(step_check_file_type_object.status, ValidationStepObjectStatus.PENDING)

        # check that there isn't any other state or step object
        self.assertEqual(ValidationStateObject.objects.filter(workflow_object=workflow_object).count(), 1)
        self.assertEqual(
            ValidationStepObject.objects.filter(from_state_object__workflow_object=workflow_object).count(),
            1,
        )

        ### Approve first step

        # approve next step : file type check
        WorkflowEngine.complete_step(step_check_file_type_object, True, self.other_user)

        start_state_object.refresh_from_db()
        step_check_file_type_object.refresh_from_db()
        workflow_object.refresh_from_db()

        # check that the workflow object is still in the right status
        self.assertEqual(workflow_object.status, ValidationWorkflowObjectStatus.ACTIVE)

        # check existing states and steps
        self.assertEqual(start_state_object.status, ValidationStateObjectStatus.COMPLETED)
        self.assertEqual(step_check_file_type_object.status, ValidationStepObjectStatus.APPROVED)

        # check next states
        self.assertEqual(ValidationStateObject.objects.filter(workflow_object=workflow_object).count(), 2)
        file_type_checked_state_object = ValidationStateObject.objects.filter(
            workflow_object=workflow_object, state_template=self.file_type_checked_state
        ).first()
        self.assertEqual(file_type_checked_state_object.status, ValidationStateObjectStatus.ACTIVE)

        self.assertEqual(
            ValidationStepObject.objects.filter(from_state_object__workflow_object=workflow_object).count(),
            2,
        )
        self.assertEqual(ValidationStepObject.objects.filter(step_template=self.step_check_file_type).count(), 1)
        step_check_file_name_object = ValidationStepObject.objects.filter(
            step_template=self.step_check_file_name
        ).first()
        self.assertEqual(step_check_file_name_object.status, ValidationStepObjectStatus.PENDING)

        ## Approve second step
        # approve next step : file name check
        WorkflowEngine.complete_step(step_check_file_name_object, True, self.other_user)

        start_state_object.refresh_from_db()
        file_type_checked_state_object.refresh_from_db()
        step_check_file_type_object.refresh_from_db()
        step_check_file_name_object.refresh_from_db()
        workflow_object.refresh_from_db()

        # check that the workflow object is still in the right status
        self.assertEqual(workflow_object.status, ValidationWorkflowObjectStatus.ACTIVE)

        # check existing states and steps
        self.assertEqual(start_state_object.status, ValidationStateObjectStatus.COMPLETED)
        self.assertEqual(file_type_checked_state_object.status, ValidationStateObjectStatus.COMPLETED)
        self.assertEqual(step_check_file_type_object.status, ValidationStepObjectStatus.APPROVED)
        self.assertEqual(step_check_file_name_object.status, ValidationStepObjectStatus.APPROVED)

        # check next states
        self.assertEqual(ValidationStateObject.objects.filter(workflow_object=workflow_object).count(), 3)
        file_name_checked_state_object = ValidationStateObject.objects.filter(
            workflow_object=workflow_object, state_template=self.file_name_checked_state
        ).first()
        self.assertEqual(file_name_checked_state_object.status, ValidationStateObjectStatus.ACTIVE)

        self.assertEqual(
            ValidationStepObject.objects.filter(from_state_object__workflow_object=workflow_object).count(),
            3,
        )
        self.assertEqual(ValidationStepObject.objects.filter(step_template=self.step_manager_approves).count(), 1)
        step_manager_approves_object = ValidationStepObject.objects.filter(
            step_template=self.step_manager_approves
        ).first()
        self.assertEqual(step_manager_approves_object.status, ValidationStepObjectStatus.PENDING)

        ## Last approval: manager approves
        WorkflowEngine.complete_step(step_manager_approves_object, True, self.other_user)

        workflow_object.refresh_from_db()

        # check that the workflow object is in the right status
        self.assertEqual(workflow_object.status, ValidationWorkflowObjectStatus.APPROVED)

        # check states
        self.assertEqual(ValidationStateObject.objects.filter(workflow_object=workflow_object).count(), 4)
        self.assertEqual(
            ValidationStateObject.objects.filter(
                workflow_object=workflow_object, status=ValidationStateObjectStatus.COMPLETED
            ).count(),
            4,
        )

        # check steps
        self.assertEqual(
            ValidationStepObject.objects.filter(from_state_object__workflow_object=workflow_object).count(),
            3,
        )
        self.assertEqual(
            ValidationStepObject.objects.filter(
                from_state_object__workflow_object=workflow_object,
                status=ValidationStepObjectStatus.APPROVED,
            ).count(),
            3,
        )

    def test_reject_at_check_file_type_step(self):
        ### Create
        WorkflowEngine.start(self.workflow, self.user)
        workflow_object = ValidationWorkflowObject.objects.filter(workflow_template=self.workflow).first()

        ### Reject first step
        step_check_file_type_object = ValidationStepObject.objects.filter(
            step_template=self.step_check_file_type
        ).first()
        WorkflowEngine.complete_step(step_check_file_type_object, False, self.other_user, "A rejection comment")

        workflow_object.refresh_from_db()

        # check workflow object status
        self.assertEqual(workflow_object.status, ValidationWorkflowObjectStatus.REJECTED)

        # check states
        self.assertEqual(ValidationStateObject.objects.filter(workflow_object=workflow_object).count(), 1)
        self.assertEqual(
            ValidationStateObject.objects.filter(workflow_object=workflow_object).first().status,
            ValidationStateObjectStatus.COMPLETED,
        )

        # check steps
        self.assertEqual(
            ValidationStepObject.objects.filter(from_state_object__workflow_object=workflow_object).count(),
            1,
        )
        self.assertEqual(
            ValidationStepObject.objects.filter(from_state_object__workflow_object=workflow_object).first().status,
            ValidationStepObjectStatus.REJECTED,
        )
        self.assertEqual(
            ValidationStepObject.objects.filter(from_state_object__workflow_object=workflow_object)
            .first()
            .rejection_comment,
            "A rejection comment",
        )

    def test_reject_at_check_file_name_step(self):
        ### Create
        WorkflowEngine.start(self.workflow, self.user)

        workflow_object = ValidationWorkflowObject.objects.filter(workflow_template=self.workflow).first()

        step_check_file_type_object = ValidationStepObject.objects.filter(
            step_template=self.step_check_file_type
        ).first()

        ### Approve first step

        # approve next step : file type check
        WorkflowEngine.complete_step(step_check_file_type_object, True, self.other_user)

        ### Reject second step
        # reject second step : file name check
        step_check_file_name_object = ValidationStepObject.objects.filter(
            step_template=self.step_check_file_name
        ).first()
        WorkflowEngine.complete_step(step_check_file_name_object, False, self.other_user, "A rejection comment")

        workflow_object.refresh_from_db()

        # check workflow object status
        self.assertEqual(workflow_object.status, ValidationWorkflowObjectStatus.REJECTED)

        # check states
        self.assertEqual(ValidationStateObject.objects.filter(workflow_object=workflow_object).count(), 2)
        self.assertEqual(
            ValidationStateObject.objects.filter(
                workflow_object=workflow_object, status=ValidationStateObjectStatus.COMPLETED
            ).count(),
            2,
        )

        # check steps
        self.assertEqual(
            ValidationStepObject.objects.filter(from_state_object__workflow_object=workflow_object).count(),
            2,
        )
        self.assertEqual(
            ValidationStepObject.objects.filter(step_template=self.step_check_file_name).first().status,
            ValidationStepObjectStatus.REJECTED,
        )
        self.assertEqual(
            ValidationStepObject.objects.filter(step_template=self.step_check_file_type).first().status,
            ValidationStepObjectStatus.APPROVED,
        )
        self.assertEqual(
            ValidationStepObject.objects.filter(step_template=self.step_check_file_name).first().rejection_comment,
            "A rejection comment",
        )

    def test_reject_at_manager_approves_step(self):
        """
        This is the rejection case with a fallback set to the start state.

        In this case:
            * workflow object stays ACTIVE
            * Previous states and steps are untouched
            * A new StateObject (set to the fallback target) is created with status COMPLETED (as the fallback target is a START state) + a new step
        """
        ### Create
        WorkflowEngine.start(self.workflow, self.user)

        workflow_object = ValidationWorkflowObject.objects.filter(workflow_template=self.workflow).first()

        step_check_file_type_object = ValidationStepObject.objects.filter(
            step_template=self.step_check_file_type
        ).first()

        ### Approve first step

        # approve next step : file type check
        WorkflowEngine.complete_step(step_check_file_type_object, True, self.other_user)

        ### Approve second step
        # approve second step : file name check
        step_check_file_name_object = ValidationStepObject.objects.filter(
            step_template=self.step_check_file_name
        ).first()
        WorkflowEngine.complete_step(step_check_file_name_object, True, self.other_user)

        ### Reject last step
        # reject last step : manager
        step_manager_approves_object = ValidationStepObject.objects.filter(
            step_template=self.step_manager_approves
        ).first()
        WorkflowEngine.complete_step(step_manager_approves_object, False, self.other_user, "A rejection comment")

        # check workflow_engine status
        workflow_object.refresh_from_db()
        self.assertEqual(workflow_object.status, ValidationWorkflowObjectStatus.ACTIVE)

        # check original steps

        step_check_file_type_object.refresh_from_db()
        step_check_file_name_object.refresh_from_db()
        step_manager_approves_object.refresh_from_db()

        self.assertEqual(step_check_file_type_object.status, ValidationStepObjectStatus.APPROVED)
        self.assertEqual(step_check_file_name_object.status, ValidationStepObjectStatus.APPROVED)
        self.assertEqual(step_manager_approves_object.status, ValidationStepObjectStatus.REJECTED)
        self.assertEqual(step_manager_approves_object.rejection_comment, "A rejection comment")

        # check already existing state objects
        start_states = ValidationStateObject.objects.filter(
            workflow_object=workflow_object, state_template=self.start_state
        )
        self.assertEqual(start_states.count(), 2)  # original + fallback

        file_type_states = ValidationStateObject.objects.filter(
            workflow_object=workflow_object, state_template=self.file_type_checked_state
        )
        self.assertEqual(file_type_states.count(), 1)

        file_name_states = ValidationStateObject.objects.filter(
            workflow_object=workflow_object, state_template=self.file_name_checked_state
        )
        self.assertEqual(file_name_states.count(), 1)

        # No END state should exist
        self.assertFalse(
            ValidationStateObject.objects.filter(
                workflow_object=workflow_object, state_template=self.end_state
            ).exists()
        )

        # check start states (original + fallback); as we fallback to start states it will be set to completed automatically
        self.assertEqual(start_states.count(), 2)

        for start_state_object in start_states:
            self.assertEqual(start_state_object.status, ValidationStateObjectStatus.COMPLETED)

        # check new steps (from fallback start auto completed)
        fallback_start_state = start_states.order_by("created_at").last()
        fallback_step = ValidationStepObject.objects.get(
            from_state_object=fallback_start_state, step_template=self.step_check_file_type
        )

        self.assertEqual(fallback_step.status, ValidationStepObjectStatus.PENDING)

    def test_reject_at_manager_approves_step_when_fallback_is_set_to_a_non_start_state(self):
        """
        This is the rejection case with a fallback set to the start state.

        In this case:
            * workflow object stays ACTIVE
            * Previous states and steps are untouched
            * A new StateObject (set to the fallback target) is created with status ACTIVE + a new step
        """

        # we modify the rejection target
        self.step_manager_approves.rejection_target = self.file_name_checked_state
        self.step_manager_approves.save()

        ### Create
        WorkflowEngine.start(self.workflow, self.user)

        workflow_object = ValidationWorkflowObject.objects.filter(workflow_template=self.workflow).first()

        step_check_file_type_object = ValidationStepObject.objects.filter(
            step_template=self.step_check_file_type
        ).first()

        ### Approve first step

        # approve next step : file type check
        WorkflowEngine.complete_step(step_check_file_type_object, True, self.other_user)

        ### Approve second step
        # approve second step : file name check
        step_check_file_name_object = ValidationStepObject.objects.filter(
            step_template=self.step_check_file_name
        ).first()
        WorkflowEngine.complete_step(step_check_file_name_object, True, self.other_user)

        ### Reject last step
        # reject last step : manager
        step_manager_approves_object = ValidationStepObject.objects.filter(
            step_template=self.step_manager_approves
        ).first()
        WorkflowEngine.complete_step(step_manager_approves_object, False, self.other_user, "A rejection comment")

        # check workflow_engine status
        workflow_object.refresh_from_db()
        self.assertEqual(workflow_object.status, ValidationWorkflowObjectStatus.ACTIVE)

        # check original steps

        step_check_file_type_object.refresh_from_db()
        step_check_file_name_object.refresh_from_db()
        step_manager_approves_object.refresh_from_db()

        self.assertEqual(step_check_file_type_object.status, ValidationStepObjectStatus.APPROVED)
        self.assertEqual(step_check_file_name_object.status, ValidationStepObjectStatus.APPROVED)
        self.assertEqual(step_manager_approves_object.status, ValidationStepObjectStatus.REJECTED)
        self.assertEqual(step_manager_approves_object.rejection_comment, "A rejection comment")

        # check already existing state objects
        start_states = ValidationStateObject.objects.filter(
            workflow_object=workflow_object, state_template=self.start_state
        )
        self.assertEqual(start_states.count(), 1)

        file_type_states = ValidationStateObject.objects.filter(
            workflow_object=workflow_object, state_template=self.file_type_checked_state
        )
        self.assertEqual(file_type_states.count(), 1)

        file_name_states = ValidationStateObject.objects.filter(
            workflow_object=workflow_object, state_template=self.file_name_checked_state
        )
        self.assertEqual(file_name_states.count(), 2)  # original + fallback

        # No END state should exist
        self.assertFalse(
            ValidationStateObject.objects.filter(
                workflow_object=workflow_object, state_template=self.end_state
            ).exists()
        )

        # check file name checked states (original + fallback); as we fall back to start states it will be set to completed automatically
        self.assertEqual(file_name_states.count(), 2)

        self.assertEqual(file_name_states.order_by("created_at").last().status, ValidationStateObjectStatus.ACTIVE)
        self.assertEqual(file_name_states.order_by("created_at").first().status, ValidationStateObjectStatus.COMPLETED)

        # check new steps (from fallback start auto completed)
        fallback_file_name_state = file_name_states.order_by("created_at").last()
        fallback_step = ValidationStepObject.objects.get(
            from_state_object=fallback_file_name_state, step_template=self.step_manager_approves
        )

        self.assertEqual(fallback_step.status, ValidationStepObjectStatus.PENDING)
