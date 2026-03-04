from django.contrib.auth import get_user_model
from django.test import TestCase

from iaso.engine.validation_workflow import ValidationWorkflowEngine
from iaso.models import Instance, ValidationNode, ValidationWorkflow
from iaso.models.validation_workflow.validation_status import Status


class TestSimpleLinearValidationWorkflowEngine(TestCase):
    """
    This test represents a simple linear workflow :
    * Only one node aka task (e.g check file type)
    * In case of rejection, it stops the flow
    * No permission check

    In summary:

    [ state : Check file type ]

    """

    def setUp(self):
        self.user = get_user_model().objects.create_user(username="noprofile", password="testpass")
        self.other_user = get_user_model().objects.create(username="john.doe", password="testpass")
        self.workflow = ValidationWorkflow.objects.get_or_create(name="test workflow")[0]
        self.check_file_state = ValidationNode.objects.create(workflow=self.workflow, name="check_file_state")
        self.instance = Instance.objects.create()
        self.workflow.refresh_from_db()

    def test_start(self):
        ValidationWorkflowEngine.start(self.workflow, self.user, self.instance)

        # check that the starting state has a related ValidationStatus object
        self.assertEqual(self.check_file_state.get_validation_statuses().count(), 1)
        self.assertEqual(self.check_file_state.get_validation_statuses().first().status, Status.UNKNOWN)

    def test_complete_node_by_approving(self):
        ValidationWorkflowEngine.start(self.workflow, self.user, self.instance)

        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_states(self.workflow).first(), self.user, comment="LGTM", approved=True
        )

        # check the validation status
        self.assertEqual(self.check_file_state.get_validation_statuses().count(), 1)
        validation_status = self.check_file_state.get_validation_statuses().first()

        self.assertEqual(validation_status.final, True)
        self.assertEqual(validation_status.status, Status.ACCEPTED)
        self.assertEqual(validation_status.comment, "LGTM")
        self.assertEqual(validation_status.updated_by, self.user)

        self.assertEqual(self.instance.get_validation_status(workflow=self.workflow), "APPROVED")

    def test_complete_node_by_rejecting(self):
        ValidationWorkflowEngine.start(self.workflow, self.user, self.instance)

        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_states(self.workflow).first(), self.user, comment="Don't like it"
        )

        self.assertEqual(self.check_file_state.get_validation_statuses().count(), 1)
        validation_status = self.check_file_state.get_validation_statuses().first()

        self.assertEqual(validation_status.final, False)
        self.assertEqual(validation_status.status, Status.REJECTED)
        self.assertEqual(validation_status.comment, "Don't like it")
        self.assertEqual(validation_status.updated_by, self.user)

        self.assertEqual(self.instance.get_validation_status(workflow=self.workflow), "REJECTED")

    def test_complete_node_twice_raises_error(self):
        ValidationWorkflowEngine.start(self.workflow, self.user, self.instance)

        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_states(self.workflow).first(), self.user, comment="LGTM", approved=True
        )

        # shouldn't happen if using self.instance.get_next_pending_states.. but who knows
        with self.assertRaisesMessage(ValueError, "Already completed"):
            ValidationWorkflowEngine.complete_node(
                self.check_file_state.get_validation_statuses().first(), self.user, comment="LGTM", approved=True
            )

    def test_cannot_start_another_same_workflow_after_it_has_been_final_approved(self):
        ValidationWorkflowEngine.start(self.workflow, self.user, self.instance)

        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_states(self.workflow).first(), self.user, approved=True, comment="LGTM"
        )

        with self.assertRaisesMessage(ValueError, "Entity is already attached to a related workflow"):
            ValidationWorkflowEngine.start(self.workflow, self.user, self.instance)

    def test_cannot_start_another_same_workflow_after_it_has_been_final_rejected(self):
        ValidationWorkflowEngine.start(self.workflow, self.user, self.instance)

        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_states(self.workflow).first(), self.user, comment="Don't like it"
        )

        with self.assertRaisesMessage(ValueError, "Entity is already attached to a related workflow"):
            ValidationWorkflowEngine.start(self.workflow, self.user, self.instance)


class TestMultiLinearValidationWorkflowEngine(TestCase):
    """
    This test represents a longer linear workflow :
    * Multiple nodes aka task (e.g check file type, check file name, etc)
    * No permission checks by default

    In summary:

    [ node: check file type ]
        |
        |
        v
    [ node: check file name ]
        |
        |
        v
    [ node: manager approves ]
    """

    def setUp(self):
        self.user = get_user_model().objects.create_user(username="noprofile", password="testpass")
        self.other_user = get_user_model().objects.create(username="john.doe", password="testpass")
        self.workflow = ValidationWorkflow.objects.get_or_create(name="test workflow")[0]
        self.check_file_type_node = ValidationNode.objects.create(workflow=self.workflow, name="check_file_type")

        self.check_file_name_node = ValidationNode.objects.create(workflow=self.workflow, name="check_file_state")
        self.check_file_name_node.previous_nodes.add(self.check_file_type_node)

        self.manager_approves_node = ValidationNode.objects.create(workflow=self.workflow, name="check_file_state")
        self.manager_approves_node.previous_nodes.add(self.check_file_name_node)

        self.instance = Instance.objects.create()
        self.workflow.refresh_from_db()

    def test_happy_flow(self):
        ValidationWorkflowEngine.start(self.workflow, self.user, self.instance)

        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_states(self.workflow).first(), self.user, approved=True, comment="LGTM"
        )
        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_states(self.workflow).first(),
            self.user,
            approved=True,
            comment="I agree : LGTM",
        )
        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_states(self.workflow).first(),
            self.user,
            approved=True,
            comment="I confirm : LGTM",
        )

        self.assertEqual(self.instance.get_validation_status(workflow=self.workflow), "APPROVED")

        # check the validation statuses created
        self.assertEqual(self.instance.validationstatus_set.all().count(), 3)

        latest_task = self.instance.validationstatus_set.all().first()
        self.assertEqual(latest_task.comment, "I confirm : LGTM")
        self.assertTrue(latest_task.final)
        self.assertEqual(latest_task.updated_by, self.user)
        self.assertEqual(latest_task.node, self.manager_approves_node)

        second_task = self.instance.validationstatus_set.all()[1]
        self.assertEqual(second_task.comment, "I agree : LGTM")
        self.assertFalse(second_task.final)
        self.assertEqual(second_task.updated_by, self.user)
        self.assertEqual(second_task.node, self.check_file_name_node)

        first_task = self.instance.validationstatus_set.all().last()
        self.assertEqual(first_task.comment, "LGTM")
        self.assertFalse(first_task.final)
        self.assertEqual(first_task.updated_by, self.user)
        self.assertEqual(first_task.node, self.check_file_type_node)

    def test_reject_check_file_type_node(self):
        ValidationWorkflowEngine.start(self.workflow, self.user, self.instance)

        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_states(self.workflow).first(), self.user, approved=False, comment="Nope"
        )
        self.assertEqual(self.instance.get_validation_status(self.workflow), "REJECTED")
        self.assertEqual(self.instance.validationstatus_set.all().count(), 1)
        validation_status = self.instance.validationstatus_set.first()
        self.assertEqual(validation_status.comment, "Nope")
        self.assertEqual(validation_status.updated_by, self.user)
        self.assertEqual(validation_status.status, Status.REJECTED)
        self.assertFalse(validation_status.final)
        self.assertEqual(validation_status.node, self.check_file_type_node)

    def test_approve_check_file_type_node(self):
        ValidationWorkflowEngine.start(self.workflow, self.user, self.instance)

        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_states(self.workflow).first(), self.user, approved=True, comment="LGTM"
        )

        self.assertEqual(self.instance.get_validation_status(self.workflow), "PENDING")
        self.assertEqual(self.instance.validationstatus_set.all().count(), 2)  # this one + next one pending
        validation_status = self.instance.validationstatus_set.last()
        self.assertEqual(validation_status.comment, "LGTM")
        self.assertEqual(validation_status.updated_by, self.user)
        self.assertEqual(validation_status.status, Status.ACCEPTED)
        self.assertFalse(validation_status.final)
        self.assertEqual(validation_status.node, self.check_file_type_node)

    def test_reject_check_file_name_node(self):
        self.test_approve_check_file_type_node()
        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_states(self.workflow).first(),
            self.user,
            approved=False,
            comment="name is wrong",
        )

        self.assertEqual(self.instance.get_validation_status(self.workflow), "REJECTED")
        self.assertEqual(self.instance.validationstatus_set.all().count(), 2)
        validation_status = self.instance.validationstatus_set.first()
        self.assertEqual(validation_status.comment, "name is wrong")
        self.assertEqual(validation_status.updated_by, self.user)
        self.assertEqual(validation_status.status, Status.REJECTED)
        self.assertFalse(validation_status.final)
        self.assertEqual(validation_status.node, self.check_file_name_node)

    def test_approve_check_file_name_node(self):
        self.test_approve_check_file_type_node()
        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_states(self.workflow).first(), self.user, approved=True, comment="name LGTM"
        )
        self.assertEqual(self.instance.get_validation_status(self.workflow), "PENDING")
        self.assertEqual(
            self.instance.validationstatus_set.all().count(), 3
        )  # this one + next one pending + previous one
        validation_status = self.instance.validationstatus_set.all()[1]
        self.assertEqual(validation_status.comment, "name LGTM")
        self.assertEqual(validation_status.updated_by, self.user)
        self.assertEqual(validation_status.status, Status.ACCEPTED)
        self.assertFalse(validation_status.final)
        self.assertEqual(validation_status.node, self.check_file_name_node)

    def test_reject_manager_approves_node(self):
        self.test_approve_check_file_name_node()
        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_states(self.workflow).first(), self.user, approved=False, comment="Nope"
        )
        self.assertEqual(self.instance.get_validation_status(self.workflow), "REJECTED")
        self.assertEqual(self.instance.validationstatus_set.all().count(), 3)
        validation_status = self.instance.validationstatus_set.first()
        self.assertEqual(validation_status.comment, "Nope")
        self.assertEqual(validation_status.updated_by, self.user)
        self.assertEqual(validation_status.status, Status.REJECTED)
        self.assertFalse(validation_status.final)
        self.assertEqual(validation_status.node, self.manager_approves_node)

    def test_approve_manager_approves_node(self):
        self.test_approve_check_file_name_node()
        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_states(self.workflow).first(),
            self.user,
            approved=True,
            comment="Manager approves",
        )
        self.assertEqual(self.instance.get_validation_status(self.workflow), "APPROVED")
        self.assertEqual(self.instance.validationstatus_set.all().count(), 3)
        validation_status = self.instance.validationstatus_set.first()
        self.assertEqual(validation_status.comment, "Manager approves")
        self.assertEqual(validation_status.updated_by, self.user)
        self.assertEqual(validation_status.status, Status.ACCEPTED)
        self.assertTrue(validation_status.final)
        self.assertEqual(validation_status.node, self.manager_approves_node)


class TestPermissionCheck(TestCase):
    pass


class TestUndoFeature(TestCase):
    pass


class TestRejectionTargetFeature(TestCase):
    pass


class TestResubmitFeature(TestCase):
    pass
