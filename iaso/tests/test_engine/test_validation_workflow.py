from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser, Group
from django.core.exceptions import PermissionDenied
from django.test import TestCase

from iaso.engine.validation_workflow import ValidationWorkflowEngine
from iaso.models import Account, Instance, Profile, UserRole, ValidationNode, ValidationWorkflow
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
    """
    This test represents a simple linear workflow with permission check:
    * Only one node aka task (e.g check file type)
    * In case of rejection, it stops the flow
    * Permission check: only some user roels are allowed

    In summary:

    [ state : Check file type ]

    """

    def setUp(self):
        account = Account.objects.create(name="test")
        group_1 = Group.objects.create(name="Group 1")
        group_2 = Group.objects.create(name="Group 2")
        user_role_1 = UserRole.objects.create(group=group_1, account=account)
        user_role_2 = UserRole.objects.create(group=group_2, account=account)

        self.user = get_user_model().objects.create_user(username="noprofile", password="testpass")
        self.other_user = get_user_model().objects.create(username="john.doe", password="testpass")

        profile = Profile.objects.create(account=account, user=self.user)
        profile.user_roles.set([user_role_1, user_role_2])

        profile_with_just_one_role = Profile.objects.create(account=account, user=self.other_user)
        profile_with_just_one_role.user_roles.add(user_role_1)

        self.workflow = ValidationWorkflow.objects.get_or_create(name="test workflow")[0]
        self.check_file_state = ValidationNode.objects.create(workflow=self.workflow, name="check_file_state")

        self.check_file_state.roles_required.set([user_role_1, user_role_2])

        self.instance = Instance.objects.create()
        self.workflow.refresh_from_db()

    def _has_no_impact(self):
        self.assertEqual(self.check_file_state.get_validation_statuses().count(), 1)
        self.assertEqual(self.check_file_state.get_validation_statuses().first().status, Status.UNKNOWN)

    def test_approve_anonymous_user(self):
        ValidationWorkflowEngine.start(workflow_template=self.workflow, user=self.user, entity=self.instance)

        with self.assertRaisesMessage(PermissionDenied, "User required"):
            ValidationWorkflowEngine.complete_node(
                self.instance.get_next_pending_states(self.workflow).first(),
                AnonymousUser(),
                comment="LGTM",
                approved=True,
            )

        with self.assertRaisesMessage(PermissionDenied, "User required"):
            ValidationWorkflowEngine.complete_node(
                self.instance.get_next_pending_states(self.workflow).first(), None, comment="LGTM", approved=True
            )

        # check that there's no impact
        self._has_no_impact()

    def test_approve_with_user_without_all_required_permissions(self):
        ValidationWorkflowEngine.start(workflow_template=self.workflow, user=self.user, entity=self.instance)

        with self.assertRaisesMessage(PermissionDenied, "You do not have permission to complete this task"):
            ValidationWorkflowEngine.complete_node(
                self.instance.get_next_pending_states(self.workflow).first(),
                self.other_user,
                comment="LGTM",
                approved=True,
            )

        # check that there's no impact
        self._has_no_impact()

    def test_approve_happy_flow(self):
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

    def test_reject_anonymous_user(self):
        ValidationWorkflowEngine.start(workflow_template=self.workflow, user=self.user, entity=self.instance)

        with self.assertRaisesMessage(PermissionDenied, "User required"):
            ValidationWorkflowEngine.complete_node(
                self.instance.get_next_pending_states(self.workflow).first(),
                AnonymousUser(),
                comment="Nope",
                approved=False,
            )

        with self.assertRaisesMessage(PermissionDenied, "User required"):
            ValidationWorkflowEngine.complete_node(
                self.instance.get_next_pending_states(self.workflow).first(), None, comment="Nope", approved=False
            )

        # check that there's no impact
        self._has_no_impact()

    def test_reject_with_user_without_all_required_permissions(self):
        ValidationWorkflowEngine.start(workflow_template=self.workflow, user=self.user, entity=self.instance)

        with self.assertRaisesMessage(PermissionDenied, "You do not have permission to complete this task"):
            ValidationWorkflowEngine.complete_node(
                self.instance.get_next_pending_states(self.workflow).first(),
                self.other_user,
                comment="Nope",
                approved=False,
            )

        # check that there's no impact
        self._has_no_impact()

    def test_reject_happy_flow(self):
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


class TestUndoFeature(TestCase):
    """
    Purpose of this test is to demonstrate the undo feature
    Simple linear workflow:
    * Two nodes aka task (e.g check file type, check file name)
    * No permission checks by default
    * Default rejection behavior

    In summary:

    [ node: check file type ]
        |
        |
        v
    [ node: manager approves ]
    """

    def setUp(self):
        self.user = get_user_model().objects.create_user(username="noprofile", password="testpass")
        self.workflow = ValidationWorkflow.objects.get_or_create(name="test workflow")[0]
        self.check_file_type_node = ValidationNode.objects.create(workflow=self.workflow, name="check_file_type")
        self.manager_approves_node = ValidationNode.objects.create(workflow=self.workflow, name="check_file_state")
        self.manager_approves_node.previous_nodes.add(self.check_file_type_node)
        self.instance = Instance.objects.create()
        self.parent_instance = Instance.objects.create()
        self.workflow.refresh_from_db()

    def test_try_undo_first_approved_node(self):
        pass

    def test_try_undo_last_approved_node(self):
        """
        Shouldn't be possible as a notification might have been sent to the user already
        """

    def test_try_undo_rejected_node(self):
        """
        Shouldn't be possible as a notification might have been sent to the user already
        """

    def test_try_undo_rejected_last_node(self):
        """
        Shouldn't be possible as a notification might have been sent to the user already
        """


class TestRejectionTargetFeature(TestCase):
    pass


class TestResubmitFeature(TestCase):
    """
    Purpose of this test is to show how to handle a new submission (resubmit) for an entity.
    Simple linear workflow:
    * Two nodes aka task (e.g check file type, check file name)
    * No permission checks by default
    * Default rejection behavior

    In summary:

    [ node: check file type ]
        |
        |
        v
    [ node: manager approves ]

    """

    def setUp(self):
        self.user = get_user_model().objects.create_user(username="noprofile", password="testpass")
        self.workflow = ValidationWorkflow.objects.get_or_create(name="test workflow")[0]
        self.check_file_type_node = ValidationNode.objects.create(workflow=self.workflow, name="check_file_type")
        self.manager_approves_node = ValidationNode.objects.create(workflow=self.workflow, name="check_file_state")
        self.manager_approves_node.previous_nodes.add(self.check_file_type_node)
        self.instance = Instance.objects.create()
        self.parent_instance = Instance.objects.create()
        self.workflow.refresh_from_db()

    def test_resubmit_after_reject(self):
        ValidationWorkflowEngine.start(self.workflow, self.user, self.parent_instance)

        ValidationWorkflowEngine.complete_node(
            self.parent_instance.get_next_pending_states(self.workflow).first(),
            self.user,
            approved=False,
            comment="Nope",
        )

        ValidationWorkflowEngine.start(self.workflow, self.user, self.instance, self.parent_instance)

        self.instance.refresh_from_db()
        self.assertEqual(self.instance.parent_instance_for_validation, self.parent_instance)

        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_states(self.workflow).first(),
            self.user,
            approved=False,
            comment="Nope for the second time",
        )

        validations = self.instance.get_all_validation_statuses(self.workflow)
        self.assertEqual(validations.count(), 2)
        first_validation = validations.first()
        last_validation = validations.last()

        self.assertEqual(first_validation.comment, "Nope for the second time")
        self.assertEqual(first_validation.instance, self.instance)

        self.assertEqual(last_validation.comment, "Nope")
        self.assertEqual(last_validation.instance, self.parent_instance)

    def test_try_resubmit_after_approved(self):
        ValidationWorkflowEngine.start(self.workflow, self.user, self.parent_instance)

        ValidationWorkflowEngine.complete_node(
            self.parent_instance.get_next_pending_states(self.workflow).first(),
            self.user,
            approved=True,
            comment="LGTM",
        )

        with self.assertRaisesMessage(ValueError, "Invalid parent entity: workflow is in incorrect status"):
            ValidationWorkflowEngine.start(self.workflow, self.user, self.instance, self.parent_instance)

        self.instance.refresh_from_db()
        self.assertIsNone(self.instance.parent_instance_for_validation)
        self.assertFalse(self.instance.validationstatus_set.exists())
