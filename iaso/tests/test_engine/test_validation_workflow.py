from django.contrib.auth import get_user_model
from django.test import TestCase

from iaso.engine.validation_workflow import WorkflowEngine
from iaso.models import (
    ValidationNode,
    ValidationNodeInstance,
    ValidationTransition,
    ValidationTransitionInstance,
    ValidationWorkflow,
    ValidationWorkflowInstance,
)
from iaso.models.validation_workflow.run_instances import ValidationWorkflowInstanceStatus


class TestSimpleLinearValidationWorkflowEngine(TestCase):
    """
    This test represents a simple linear workflow :
    * Only one transition aka task (e.g check file type)
    * Only two nodes aka states (start and end)
    * In case of rejection, it stops the flow
    * No permission check
    * No entity/object linked

    In summary:

    [ start : START ]
        |
        |  (transition: check file type)
        v
    [  end  : END   ]
    """

    def setUp(self):
        self.user = get_user_model().objects.create_user(username="noprofile", password="testpass")
        self.other_user = get_user_model().objects.create(username="john.doe", password="testpass")
        self.workflow = ValidationWorkflow.objects.get_or_create(name="test workflow")[0]
        self.start_node = ValidationNode.objects.create(
            name="start", node_type=ValidationNode.NodeType.START, workflow=self.workflow
        )
        self.end_node = ValidationNode.objects.create(
            name="end", node_type=ValidationNode.NodeType.END, workflow=self.workflow
        )
        self.transition = ValidationTransition.objects.create(
            from_node=self.start_node, to_node=self.end_node, name="check file type"
        )

    def test_start(self):
        WorkflowEngine.start(self.workflow, self.user)

        # check the workflow instance
        self.assertEqual(ValidationWorkflowInstance.objects.filter(workflow=self.workflow).count(), 1)
        workflow_instance = ValidationWorkflowInstance.objects.filter(workflow=self.workflow).first()
        self.assertEqual(workflow_instance.status, ValidationWorkflowInstanceStatus.ACTIVE)
        self.assertEqual(workflow_instance.created_by, self.user)

        # check the starting node - it should be there and autocompleted
        self.assertEqual(
            ValidationNodeInstance.objects.filter(workflow_instance=workflow_instance, node=self.start_node).count(), 1
        )
        start_node_instance = ValidationNodeInstance.objects.filter(
            workflow_instance=workflow_instance, node=self.start_node
        ).first()
        self.assertEqual(start_node_instance.status, ValidationNodeInstance.Status.COMPLETED)

        # check the transition after
        self.assertEqual(ValidationTransitionInstance.objects.filter(transition=self.transition).count(), 1)
        transition_instance = ValidationTransitionInstance.objects.filter(transition=self.transition).first()
        self.assertEqual(transition_instance.status, ValidationTransitionInstance.Status.PENDING)

        # check the ending node, it shouldn't be there
        self.assertFalse(
            ValidationNodeInstance.objects.filter(workflow_instance=workflow_instance, node=self.end_node).exists()
        )

    def test_complete_transition_by_approving(self):
        WorkflowEngine.start(self.workflow, self.user)

        # get the next transition pending => how? => need to find a better way ?
        transition_instance = ValidationTransitionInstance.objects.filter(transition=self.transition).first()

        WorkflowEngine.complete_transition(transition_instance, True, self.other_user)

        transition_instance.refresh_from_db()

        workflow_instance = ValidationWorkflowInstance.objects.filter(workflow=self.workflow).first()

        # we check it has been approved
        self.assertEqual(transition_instance.status, ValidationTransitionInstance.Status.APPROVED)
        self.assertEqual(transition_instance.updated_by, self.other_user)
        self.assertEqual(transition_instance.rejection_comment, "")

        # we check the ending node instance has been created
        self.assertEqual(
            ValidationNodeInstance.objects.filter(workflow_instance=workflow_instance, node=self.end_node).count(), 1
        )
        ending_node_instance = ValidationNodeInstance.objects.filter(
            workflow_instance=workflow_instance, node=self.end_node
        ).first()
        self.assertEqual(ending_node_instance.status, ValidationNodeInstance.Status.COMPLETED)

        self.assertEqual(workflow_instance.status, ValidationWorkflowInstanceStatus.APPROVED)

    def test_complete_transition_by_rejecting(self):
        WorkflowEngine.start(self.workflow, self.user)

        # get the next transition pending => todo:  need to find a better way ?
        transition_instance = ValidationTransitionInstance.objects.filter(transition=self.transition).first()

        WorkflowEngine.complete_transition(transition_instance, False, self.other_user, "A rejection comment")

        transition_instance.refresh_from_db()

        workflow_instance = ValidationWorkflowInstance.objects.filter(workflow=self.workflow).first()

        # we check it has been approved
        self.assertEqual(transition_instance.status, ValidationTransitionInstance.Status.REJECTED)
        self.assertEqual(transition_instance.updated_by, self.other_user)
        self.assertEqual(transition_instance.rejection_comment, "A rejection comment")

        # we check the ending node instance has not been created
        self.assertFalse(
            ValidationNodeInstance.objects.filter(workflow_instance=workflow_instance, node=self.end_node).exists()
        )

        self.assertEqual(workflow_instance.status, ValidationWorkflowInstanceStatus.REJECTED)

    def test_completing_transition_twice_raises_error(self):
        WorkflowEngine.start(self.workflow, self.user)

        transition_instance = ValidationTransitionInstance.objects.get(transition=self.transition)

        WorkflowEngine.complete_transition(
            transition_instance,
            approved=True,
            user=self.other_user,
        )

        with self.assertRaises(ValueError):
            WorkflowEngine.complete_transition(
                transition_instance,
                approved=True,
                user=self.other_user,
            )

    def test_no_further_actions_allowed_after_completing(self):
        WorkflowEngine.start(self.workflow, self.user)

        transition_instance = ValidationTransitionInstance.objects.filter(transition=self.transition).first()

        WorkflowEngine.complete_transition(transition_instance, True, self.other_user)

        transition_instance.refresh_from_db()

        workflow_instance = ValidationWorkflowInstance.objects.filter(workflow=self.workflow).first()

        self.assertEqual(workflow_instance.status, ValidationWorkflowInstanceStatus.APPROVED)

        with self.assertRaises(ValueError):
            WorkflowEngine.complete_transition(transition_instance, approved=False, user=self.other_user)


class TestMultiLinearValidationWorkflowEngine(TestCase):
    """
    This test represents a more complex linear workflow :
    * Multiple transitions aka tasks (e.g check file type, check file name, etc)
    * Multiple nodes aka states
    * In case of rejection:
        * at transition `maanger approves` it goes back to state start
        * at any other transition it stops the whole flow (and sends back to user)
    * No Permission checks by default

    In summary:

    [ start : START ]
        |
        |  (transition: check file type)
        v
    [ state: file type checked ]
        |
        |  (transition: check file name)
        v
    [ state: file name checked ]
        |
        |  (transition: manager approves)
        v
    [  end  : END   ]
    """

    def setUp(self):
        # we define the users
        self.user = get_user_model().objects.create_user(username="noprofile", password="testpass")
        self.other_user = get_user_model().objects.create(username="john.doe", password="testpass")

        # workflow
        self.workflow = ValidationWorkflow.objects.get_or_create(name="test workflow")[0]

        # nodes
        self.start_node = ValidationNode.objects.create(
            name="start", node_type=ValidationNode.NodeType.START, workflow=self.workflow
        )
        self.file_type_checked_node = ValidationNode.objects.create(
            name="file type checked", node_type=ValidationNode.NodeType.TASK, workflow=self.workflow
        )
        self.file_name_checked_node = ValidationNode.objects.create(
            name="file name checked", node_type=ValidationNode.NodeType.TASK, workflow=self.workflow
        )
        self.end_node = ValidationNode.objects.create(
            name="end", node_type=ValidationNode.NodeType.END, workflow=self.workflow
        )

        # transition
        self.transition_check_file_type = ValidationTransition.objects.create(
            name="check file type", from_node=self.start_node, to_node=self.file_type_checked_node
        )
        self.transition_check_file_name = ValidationTransition.objects.create(
            name="check file name", from_node=self.file_type_checked_node, to_node=self.file_name_checked_node
        )
        self.transition_manager_approves = ValidationTransition.objects.create(
            name="manager approves",
            from_node=self.file_name_checked_node,
            to_node=self.end_node,
            rejection_target=self.start_node,
        )

    def test_happy_flow(self):
        ### Create
        WorkflowEngine.start(self.workflow, self.user)

        # check the workflow instance
        self.assertEqual(ValidationWorkflowInstance.objects.filter(workflow=self.workflow).count(), 1)
        workflow_instance = ValidationWorkflowInstance.objects.filter(workflow=self.workflow).first()
        self.assertEqual(workflow_instance.status, ValidationWorkflowInstanceStatus.ACTIVE)
        self.assertEqual(workflow_instance.created_by, self.user)

        # check the starting node - it should be there and autocompleted
        self.assertEqual(
            ValidationNodeInstance.objects.filter(workflow_instance=workflow_instance, node=self.start_node).count(), 1
        )
        start_node_instance = ValidationNodeInstance.objects.filter(
            workflow_instance=workflow_instance, node=self.start_node
        ).first()
        self.assertEqual(start_node_instance.status, ValidationNodeInstance.Status.COMPLETED)

        # check the transition after
        self.assertEqual(
            ValidationTransitionInstance.objects.filter(transition=self.transition_check_file_type).count(), 1
        )
        transition_check_file_type_instance = ValidationTransitionInstance.objects.filter(
            transition=self.transition_check_file_type
        ).first()
        self.assertEqual(transition_check_file_type_instance.status, ValidationTransitionInstance.Status.PENDING)

        # check that there isn't any other node or transition instance
        self.assertEqual(ValidationNodeInstance.objects.filter(workflow_instance=workflow_instance).count(), 1)
        self.assertEqual(
            ValidationTransitionInstance.objects.filter(
                from_node_instance__workflow_instance=workflow_instance
            ).count(),
            1,
        )

        ### Approve first step

        # approve next step : file type check
        WorkflowEngine.complete_transition(transition_check_file_type_instance, True, self.other_user)

        start_node_instance.refresh_from_db()
        transition_check_file_type_instance.refresh_from_db()
        workflow_instance.refresh_from_db()

        # check that the workflow instance is still in the right status
        self.assertEqual(workflow_instance.status, ValidationWorkflowInstanceStatus.ACTIVE)

        # check existing nodes and steps
        self.assertEqual(start_node_instance.status, ValidationNodeInstance.Status.COMPLETED)
        self.assertEqual(transition_check_file_type_instance.status, ValidationTransitionInstance.Status.APPROVED)

        # check next nodes
        self.assertEqual(ValidationNodeInstance.objects.filter(workflow_instance=workflow_instance).count(), 2)
        file_type_checked_node_instance = ValidationNodeInstance.objects.filter(
            workflow_instance=workflow_instance, node=self.file_type_checked_node
        ).first()
        self.assertEqual(file_type_checked_node_instance.status, ValidationNodeInstance.Status.ACTIVE)

        self.assertEqual(
            ValidationTransitionInstance.objects.filter(
                from_node_instance__workflow_instance=workflow_instance
            ).count(),
            2,
        )
        self.assertEqual(
            ValidationTransitionInstance.objects.filter(transition=self.transition_check_file_type).count(), 1
        )
        transition_check_file_name_instance = ValidationTransitionInstance.objects.filter(
            transition=self.transition_check_file_name
        ).first()
        self.assertEqual(transition_check_file_name_instance.status, ValidationTransitionInstance.Status.PENDING)

        ## Approve second step
        # approve next step : file name check
        WorkflowEngine.complete_transition(transition_check_file_name_instance, True, self.other_user)

        start_node_instance.refresh_from_db()
        file_type_checked_node_instance.refresh_from_db()
        transition_check_file_type_instance.refresh_from_db()
        transition_check_file_name_instance.refresh_from_db()
        workflow_instance.refresh_from_db()

        # check that the workflow instance is still in the right status
        self.assertEqual(workflow_instance.status, ValidationWorkflowInstanceStatus.ACTIVE)

        # check existing nodes and steps
        self.assertEqual(start_node_instance.status, ValidationNodeInstance.Status.COMPLETED)
        self.assertEqual(file_type_checked_node_instance.status, ValidationNodeInstance.Status.COMPLETED)
        self.assertEqual(transition_check_file_type_instance.status, ValidationTransitionInstance.Status.APPROVED)
        self.assertEqual(transition_check_file_name_instance.status, ValidationTransitionInstance.Status.APPROVED)

        # check next nodes
        self.assertEqual(ValidationNodeInstance.objects.filter(workflow_instance=workflow_instance).count(), 3)
        file_name_checked_node_instance = ValidationNodeInstance.objects.filter(
            workflow_instance=workflow_instance, node=self.file_name_checked_node
        ).first()
        self.assertEqual(file_name_checked_node_instance.status, ValidationNodeInstance.Status.ACTIVE)

        self.assertEqual(
            ValidationTransitionInstance.objects.filter(
                from_node_instance__workflow_instance=workflow_instance
            ).count(),
            3,
        )
        self.assertEqual(
            ValidationTransitionInstance.objects.filter(transition=self.transition_manager_approves).count(), 1
        )
        transition_manager_approves_instance = ValidationTransitionInstance.objects.filter(
            transition=self.transition_manager_approves
        ).first()
        self.assertEqual(transition_manager_approves_instance.status, ValidationTransitionInstance.Status.PENDING)

        ## Last approval: manager approves
        WorkflowEngine.complete_transition(transition_manager_approves_instance, True, self.other_user)

        workflow_instance.refresh_from_db()

        # check that the workflow instance is in the right status
        self.assertEqual(workflow_instance.status, ValidationWorkflowInstanceStatus.APPROVED)

        # check nodes
        self.assertEqual(ValidationNodeInstance.objects.filter(workflow_instance=workflow_instance).count(), 4)
        self.assertEqual(
            ValidationNodeInstance.objects.filter(
                workflow_instance=workflow_instance, status=ValidationNodeInstance.Status.COMPLETED
            ).count(),
            4,
        )

        # check transitions
        self.assertEqual(
            ValidationTransitionInstance.objects.filter(
                from_node_instance__workflow_instance=workflow_instance
            ).count(),
            3,
        )
        self.assertEqual(
            ValidationTransitionInstance.objects.filter(
                from_node_instance__workflow_instance=workflow_instance,
                status=ValidationTransitionInstance.Status.APPROVED,
            ).count(),
            3,
        )

    def test_reject_at_check_file_type_transition(self):
        ### Create
        WorkflowEngine.start(self.workflow, self.user)
        workflow_instance = ValidationWorkflowInstance.objects.filter(workflow=self.workflow).first()

        ### Reject first step
        transition_check_file_type_instance = ValidationTransitionInstance.objects.filter(
            transition=self.transition_check_file_type
        ).first()
        WorkflowEngine.complete_transition(
            transition_check_file_type_instance, False, self.other_user, "A rejection comment"
        )

        workflow_instance.refresh_from_db()

        # check workflow instance status
        self.assertEqual(workflow_instance.status, ValidationWorkflowInstanceStatus.REJECTED)

        # check nodes
        self.assertEqual(ValidationNodeInstance.objects.filter(workflow_instance=workflow_instance).count(), 1)
        self.assertEqual(
            ValidationNodeInstance.objects.filter(workflow_instance=workflow_instance).first().status,
            ValidationNodeInstance.Status.COMPLETED,
        )

        # check transitions
        self.assertEqual(
            ValidationTransitionInstance.objects.filter(
                from_node_instance__workflow_instance=workflow_instance
            ).count(),
            1,
        )
        self.assertEqual(
            ValidationTransitionInstance.objects.filter(from_node_instance__workflow_instance=workflow_instance)
            .first()
            .status,
            ValidationTransitionInstance.Status.REJECTED,
        )
        self.assertEqual(
            ValidationTransitionInstance.objects.filter(from_node_instance__workflow_instance=workflow_instance)
            .first()
            .rejection_comment,
            "A rejection comment",
        )

    def test_reject_at_check_file_name_transition(self):
        ### Create
        WorkflowEngine.start(self.workflow, self.user)

        workflow_instance = ValidationWorkflowInstance.objects.filter(workflow=self.workflow).first()

        transition_check_file_type_instance = ValidationTransitionInstance.objects.filter(
            transition=self.transition_check_file_type
        ).first()

        ### Approve first step

        # approve next step : file type check
        WorkflowEngine.complete_transition(transition_check_file_type_instance, True, self.other_user)

        ### Reject second step
        # reject second step : file name check
        transition_check_file_name_instance = ValidationTransitionInstance.objects.filter(
            transition=self.transition_check_file_name
        ).first()
        WorkflowEngine.complete_transition(
            transition_check_file_name_instance, False, self.other_user, "A rejection comment"
        )

        workflow_instance.refresh_from_db()

        # check workflow instance status
        self.assertEqual(workflow_instance.status, ValidationWorkflowInstanceStatus.REJECTED)

        # check nodes
        self.assertEqual(ValidationNodeInstance.objects.filter(workflow_instance=workflow_instance).count(), 2)
        self.assertEqual(
            ValidationNodeInstance.objects.filter(
                workflow_instance=workflow_instance, status=ValidationNodeInstance.Status.COMPLETED
            ).count(),
            2,
        )

        # check transitions
        self.assertEqual(
            ValidationTransitionInstance.objects.filter(
                from_node_instance__workflow_instance=workflow_instance
            ).count(),
            2,
        )
        self.assertEqual(
            ValidationTransitionInstance.objects.filter(transition=self.transition_check_file_name).first().status,
            ValidationTransitionInstance.Status.REJECTED,
        )
        self.assertEqual(
            ValidationTransitionInstance.objects.filter(transition=self.transition_check_file_type).first().status,
            ValidationTransitionInstance.Status.APPROVED,
        )
        self.assertEqual(
            ValidationTransitionInstance.objects.filter(transition=self.transition_check_file_name)
            .first()
            .rejection_comment,
            "A rejection comment",
        )

    def test_reject_at_manager_approves_transition(self):
        """
        This is the rejection case with a fallback set to the start node.

        In this case:
            * workflow instance stays ACTIVE
            * Previous nodes/steps and tasks/transitions are untouched
            * A new NodeInstance (set to the fallback target) is created with status COMPLETED (as the fallback target is a START node) + a new transition
        """
        ### Create
        WorkflowEngine.start(self.workflow, self.user)

        workflow_instance = ValidationWorkflowInstance.objects.filter(workflow=self.workflow).first()

        transition_check_file_type_instance = ValidationTransitionInstance.objects.filter(
            transition=self.transition_check_file_type
        ).first()

        ### Approve first step

        # approve next step : file type check
        WorkflowEngine.complete_transition(transition_check_file_type_instance, True, self.other_user)

        ### Approve second step
        # approve second step : file name check
        transition_check_file_name_instance = ValidationTransitionInstance.objects.filter(
            transition=self.transition_check_file_name
        ).first()
        WorkflowEngine.complete_transition(transition_check_file_name_instance, True, self.other_user)

        ### Reject last step
        # reject last step : manager
        transition_manager_approves_instance = ValidationTransitionInstance.objects.filter(
            transition=self.transition_manager_approves
        ).first()
        WorkflowEngine.complete_transition(
            transition_manager_approves_instance, False, self.other_user, "A rejection comment"
        )

        # check workflow_engine status
        workflow_instance.refresh_from_db()
        self.assertEqual(workflow_instance.status, ValidationWorkflowInstanceStatus.ACTIVE)

        # check original transitions

        transition_check_file_type_instance.refresh_from_db()
        transition_check_file_name_instance.refresh_from_db()
        transition_manager_approves_instance.refresh_from_db()

        self.assertEqual(transition_check_file_type_instance.status, ValidationTransitionInstance.Status.APPROVED)
        self.assertEqual(transition_check_file_name_instance.status, ValidationTransitionInstance.Status.APPROVED)
        self.assertEqual(transition_manager_approves_instance.status, ValidationTransitionInstance.Status.REJECTED)
        self.assertEqual(transition_manager_approves_instance.rejection_comment, "A rejection comment")

        # check already existing node instances
        start_nodes = ValidationNodeInstance.objects.filter(workflow_instance=workflow_instance, node=self.start_node)
        self.assertEqual(start_nodes.count(), 2)  # original + fallback

        file_type_nodes = ValidationNodeInstance.objects.filter(
            workflow_instance=workflow_instance, node=self.file_type_checked_node
        )
        self.assertEqual(file_type_nodes.count(), 1)

        file_name_nodes = ValidationNodeInstance.objects.filter(
            workflow_instance=workflow_instance, node=self.file_name_checked_node
        )
        self.assertEqual(file_name_nodes.count(), 1)

        # No END node should exist
        self.assertFalse(
            ValidationNodeInstance.objects.filter(workflow_instance=workflow_instance, node=self.end_node).exists()
        )

        # check start nodes (original + fallback); as we fallback to start nodes it will be set to completed automatically
        self.assertEqual(start_nodes.count(), 2)

        for start_node_instance in start_nodes:
            self.assertEqual(start_node_instance.status, ValidationNodeInstance.Status.COMPLETED)

        # check new transitions (from fallback start auto completed)
        fallback_start_node = start_nodes.order_by("created_at").last()
        fallback_transition = ValidationTransitionInstance.objects.get(
            from_node_instance=fallback_start_node, transition=self.transition_check_file_type
        )

        self.assertEqual(fallback_transition.status, ValidationTransitionInstance.Status.PENDING)

    def test_reject_at_manager_approves_transition_when_fallback_is_set_to_a_non_start_node(self):
        """
        This is the rejection case with a fallback set to the start node.

        In this case:
            * workflow instance stays ACTIVE
            * Previous nodes/steps and tasks/transitions are untouched
            * A new NodeInstance (set to the fallback target) is created with status ACTIVE + a new transition
        """

        # we modify the rejection target
        self.transition_manager_approves.rejection_target = self.file_name_checked_node
