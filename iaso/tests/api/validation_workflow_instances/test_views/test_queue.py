import datetime
import uuid

from types import SimpleNamespace

from django.contrib.auth.models import Group
from django.db import connection
from django.test import SimpleTestCase
from django.test.utils import CaptureQueriesContext
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from iaso.api.validation_workflow_instances.serializers.list import compute_step_positions
from iaso.engine.validation_workflow import ValidationWorkflowEngine
from iaso.models import (
    Account,
    DataSource,
    Form,
    Instance,
    Project,
    SourceVersion,
    UserRole,
    ValidationNode,
    ValidationNodeTemplate,
    ValidationWorkflow,
)
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus
from iaso.modules import MODULE_VALIDATION_WORKFLOW
from iaso.permissions.core_permissions import (
    CORE_SUBMISSIONS_PERMISSION,
    CORE_SUBMISSIONS_PII_PERMISSION,
    CORE_VALIDATION_WORKFLOW_PERMISSION,
)
from iaso.test import APITestCase, SwaggerTestCaseMixin


LIST_URL = reverse("validation_workflow_instances-list")
COUNTS_URL = reverse("validation_workflow_instances-counts")


class ValidationWorkflowInstanceQueueTestCase(SwaggerTestCaseMixin, APITestCase):
    """
    Linear workflow: "Submission check" (no role) => "District validation" (district role) => "Final approval" (both roles)
    """

    def setUp(self):
        self.account = Account.objects.create(name="account", modules=[MODULE_VALIDATION_WORKFLOW.codename])

        self.district_role = UserRole.objects.create(account=self.account, group=Group.objects.create(name="district"))
        self.national_role = UserRole.objects.create(account=self.account, group=Group.objects.create(name="national"))

        permissions = [CORE_VALIDATION_WORKFLOW_PERMISSION, CORE_SUBMISSIONS_PERMISSION]
        self.submitter = self.create_user_with_profile(
            username="submitter", account=self.account, first_name="Jean", last_name="Mbala", permissions=permissions
        )
        self.validator = self.create_user_with_profile(
            username="validator", account=self.account, permissions=permissions, user_roles=[self.district_role]
        )
        self.other_validator = self.create_user_with_profile(
            username="other.validator",
            account=self.account,
            permissions=permissions,
            user_roles=[self.district_role],
        )

        self.form = Form.objects.create(name="Pièce justificative", label_keys=["reference", "patient"])
        self.workflow = ValidationWorkflow.objects.create(name="Remboursement mensuel", account=self.account)
        self.workflow.form_set.add(self.form)

        self.first_step = ValidationNodeTemplate.objects.create(name="Submission check", workflow=self.workflow)
        self.second_step = ValidationNodeTemplate.objects.create(name="District validation", workflow=self.workflow)
        self.second_step.roles_required.add(self.district_role)
        self.second_step.previous_node_templates.add(self.first_step)
        self.third_step = ValidationNodeTemplate.objects.create(name="Final approval", workflow=self.workflow)
        self.third_step.roles_required.add(self.district_role, self.national_role)
        self.third_step.previous_node_templates.add(self.second_step)

        self.project = Project.objects.create(account=self.account, app_id="project")
        self.project.forms.add(self.form)

        source_version = SourceVersion.objects.create(data_source=DataSource.objects.create(name="ds"), number=1)
        org_unit_type = self.create_org_unit_type(name="type", projects=[self.project])
        self.district = self.create_valid_org_unit(name="DPS Kinshasa", type=org_unit_type, version=source_version)
        self.health_center = self.create_valid_org_unit(name="CS Kingasani", type=org_unit_type, version=source_version)
        self.health_center.parent = self.district
        self.health_center.save()

    def create_instance(self, reference="FAC-1", patient="Jean"):
        return self.create_form_instance(
            form=self.form,
            project=self.project,
            org_unit=self.health_center,
            uuid=str(uuid.uuid4()),
            json={"reference": reference, "patient": patient},
        )

    @staticmethod
    def complete_pending_step(instance, user, approved=True):
        ValidationWorkflowEngine.complete_node(instance.get_next_pending_nodes().first(), user, instance, approved)

    @staticmethod
    def set_pending_since(instance, pending_since):
        instance.get_next_pending_nodes().update(created_at=pending_since)

    def get_list(self, user, **params):
        self.client.force_authenticate(user)
        res = self.client.get(LIST_URL, data=params)
        data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertResponseCompliantToSwagger(data, "PaginatedValidationWorkflowInstanceListList")
        return data

    def get_counts(self, user, **params):
        self.client.force_authenticate(user)
        res = self.client.get(COUNTS_URL, data=params)
        data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertResponseCompliantToSwagger(data, "ValidationWorkflowInstanceCounts")
        return data

    def test_list_item_details(self):
        instance = self.create_instance()
        ValidationWorkflowEngine.start(self.workflow, self.submitter, instance)
        self.complete_pending_step(instance, self.validator)

        data = self.get_list(self.validator)

        self.assertEqual(data["count"], 1)
        item = data["results"][0]
        self.assertEqual(item["id"], instance.id)
        self.assertEqual(item["display_name"], "FAC-1 Jean")
        self.assertEqual(item["form"], {"id": self.form.id, "name": "Pièce justificative"})
        self.assertEqual(item["workflow"], {"id": self.workflow.id, "name": "Remboursement mensuel"})
        self.assertEqual(
            item["org_unit"],
            {
                "id": self.health_center.id,
                "name": "CS Kingasani",
                "parent": {"id": self.district.id, "name": "DPS Kinshasa"},
            },
        )
        self.assertEqual(
            item["submitted_by"],
            {"id": self.submitter.id, "username": "submitter", "first_name": "Jean", "last_name": "Mbala"},
        )
        submission_node = instance.validationnode_set.get(status=ValidationNodeStatus.SUBMISSION)
        self.assertEqual(item["submitted_at"], submission_node.created_at.isoformat().replace("+00:00", "Z"))
        self.assertEqual(item["validation_status"], "PENDING")
        self.assertFalse(item["is_resubmission"])
        self.assertTrue(item["requires_user_action"])
        self.assertTrue(item["handled_by_me"])
        self.assertEqual(item["step_count"], 3)

        pending_node = instance.get_next_pending_nodes().get()
        self.assertEqual(len(item["current_steps"]), 1)
        current_step = item["current_steps"][0]
        self.assertEqual(current_step["id"], pending_node.id)
        self.assertEqual(current_step["node_template_id"], self.second_step.id)
        self.assertEqual(current_step["name"], "District validation")
        self.assertEqual(current_step["position"], 2)
        self.assertTrue(current_step["user_can_act"])
        self.assertEqual(item["pending_since"], current_step["pending_since"])

        self.assertEqual(item["last_user_action"]["status"], ValidationNodeStatus.ACCEPTED)
        self.assertEqual(item["last_user_action"]["name"], "Submission check")
        self.assertEqual(item["last_user_action"]["position"], 1)

        # the submitter sees the same submission, without any action of their own
        item = self.get_list(self.submitter)["results"][0]
        self.assertIsNone(item["last_user_action"])
        self.assertFalse(item["handled_by_me"])
        self.assertFalse(item["requires_user_action"])
        self.assertFalse(item["current_steps"][0]["user_can_act"])

    def test_display_name_falls_back_to_none_without_label_keys(self):
        self.form.label_keys = None
        self.form.save()
        instance = self.create_instance()
        ValidationWorkflowEngine.start(self.workflow, self.submitter, instance)

        item = self.get_list(self.submitter)["results"][0]
        self.assertIsNone(item["display_name"])

    def test_display_name_hides_personal_data(self):
        self.form.non_pii_fields = ["reference"]
        self.form.save()
        instance = self.create_instance()
        ValidationWorkflowEngine.start(self.workflow, self.submitter, instance)

        item = self.get_list(self.submitter)["results"][0]
        self.assertEqual(item["display_name"], "FAC-1")

        pii_user = self.create_user_with_profile(
            username="pii",
            account=self.account,
            permissions=[
                CORE_VALIDATION_WORKFLOW_PERMISSION,
                CORE_SUBMISSIONS_PERMISSION,
                CORE_SUBMISSIONS_PII_PERMISSION,
            ],
        )
        item = self.get_list(pii_user)["results"][0]
        self.assertEqual(item["display_name"], "FAC-1 Jean")

    def test_resubmission(self):
        instance = self.create_instance()
        ValidationWorkflowEngine.start(self.workflow, self.submitter, instance)
        self.complete_pending_step(instance, self.validator, approved=False)
        ValidationWorkflowEngine.start(self.workflow, self.submitter, instance)

        item = self.get_list(self.validator)["results"][0]
        self.assertTrue(item["is_resubmission"])
        self.assertEqual(item["current_steps"][0]["name"], "Submission check")
        self.assertEqual(item["last_user_action"]["status"], ValidationNodeStatus.REJECTED)

    def test_step_requiring_several_roles_needs_all_of_them(self):
        instance = self.create_instance()
        ValidationWorkflowEngine.start(self.workflow, self.submitter, instance)
        self.complete_pending_step(instance, self.validator)
        self.complete_pending_step(instance, self.validator)

        # the final step needs the district AND national roles, the other validator only has the district one
        data = self.get_list(self.other_validator)
        self.assertEqual(data["count"], 0)

        self.other_validator.iaso_profile.user_roles.add(self.national_role)
        data = self.get_list(self.other_validator)
        self.assertEqual(data["count"], 1)
        self.assertTrue(data["results"][0]["requires_user_action"])
        self.assertTrue(data["results"][0]["current_steps"][0]["user_can_act"])

    def create_queues(self):
        """
        For the validator:
        - awaiting_my_action: waiting on "District validation" for 10 days, and for 3 days
        - awaiting_others: validator approved "District validation", waiting on "Final approval"
        - rejected: validator rejected "District validation"
        """
        now = timezone.now()

        oldest = self.create_instance(reference="FAC-OLD")
        ValidationWorkflowEngine.start(self.workflow, self.submitter, oldest)
        self.complete_pending_step(oldest, self.submitter)
        self.set_pending_since(oldest, now - datetime.timedelta(days=10))

        newest = self.create_instance(reference="FAC-NEW")
        ValidationWorkflowEngine.start(self.workflow, self.submitter, newest)
        self.complete_pending_step(newest, self.submitter)
        self.set_pending_since(newest, now - datetime.timedelta(days=3))

        awaiting_others = self.create_instance(reference="FAC-OTHERS")
        ValidationWorkflowEngine.start(self.workflow, self.submitter, awaiting_others)
        self.complete_pending_step(awaiting_others, self.submitter)
        self.complete_pending_step(awaiting_others, self.validator)
        self.set_pending_since(awaiting_others, now - datetime.timedelta(days=20))

        rejected = self.create_instance(reference="FAC-REJECTED")
        ValidationWorkflowEngine.start(self.workflow, self.submitter, rejected)
        self.complete_pending_step(rejected, self.submitter)
        self.complete_pending_step(rejected, self.validator, approved=False)

        return oldest, newest, awaiting_others, rejected

    def test_queue_filter(self):
        oldest, newest, awaiting_others, rejected = self.create_queues()

        def ids(**params):
            return {item["id"] for item in self.get_list(self.validator, **params)["results"]}

        self.assertEqual(ids(), {oldest.id, newest.id, awaiting_others.id, rejected.id})
        self.assertEqual(ids(queue="awaiting_my_action"), {oldest.id, newest.id})
        self.assertEqual(ids(queue="awaiting_others"), {awaiting_others.id})
        self.assertEqual(ids(queue="handled_by_me"), {awaiting_others.id, rejected.id})
        self.assertEqual(ids(queue="rejected"), {rejected.id})

        self.client.force_authenticate(self.validator)
        res = self.client.get(LIST_URL, data={"queue": "unknown"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_order_by_pending_since(self):
        oldest, newest, awaiting_others, rejected = self.create_queues()

        results = self.get_list(self.validator, queue="awaiting_my_action", order="pending_since")["results"]
        self.assertEqual([item["id"] for item in results], [oldest.id, newest.id])

        results = self.get_list(self.validator, queue="awaiting_my_action", order="-pending_since")["results"]
        self.assertEqual([item["id"] for item in results], [newest.id, oldest.id])

        # submissions that are not pending come last
        results = self.get_list(self.validator, order="pending_since")["results"]
        self.assertEqual([item["id"] for item in results], [awaiting_others.id, oldest.id, newest.id, rejected.id])

    def test_counts(self):
        oldest, newest, awaiting_others, rejected = self.create_queues()

        data = self.get_counts(self.validator)
        self.assertEqual(
            {key: value for key, value in data.items() if key != "oldest_pending_since"},
            {"all": 4, "awaiting_my_action": 2, "awaiting_others": 1, "handled_by_me": 2, "rejected": 1},
        )
        self.assertEqual(
            data["oldest_pending_since"],
            self.get_list(self.validator, order="pending_since")["results"][0]["pending_since"],
        )

        # the queue filter is ignored for the counts, but used for the oldest pending date
        queue_data = self.get_counts(self.validator, queue="awaiting_my_action")
        self.assertEqual(queue_data["awaiting_my_action"], 2)
        self.assertEqual(queue_data["all"], 4)
        oldest_item = self.get_list(self.validator, queue="awaiting_my_action", order="pending_since")["results"][0]
        self.assertEqual(oldest_item["id"], oldest.id)
        self.assertEqual(queue_data["oldest_pending_since"], oldest_item["pending_since"])

        rejected_data = self.get_counts(self.validator, queue="rejected")
        self.assertIsNone(rejected_data["oldest_pending_since"])

        # the other filters apply to the counts
        other_form = Form.objects.create(name="other")
        data = self.get_counts(self.validator, forms=str(other_form.id))
        self.assertEqual(data["all"], 0)
        self.assertIsNone(data["oldest_pending_since"])

    def test_counts_permissions(self):
        res = self.client.get(COUNTS_URL)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        no_permission_user = self.create_user_with_profile(username="nope", account=self.account)
        self.client.force_authenticate(no_permission_user)
        res = self.client.get(COUNTS_URL)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_soft_deleted_submissions_are_not_in_the_queues(self):
        instance = self.create_instance()
        ValidationWorkflowEngine.start(self.workflow, self.submitter, instance)
        deleted_instance = self.create_instance(reference="FAC-2")
        ValidationWorkflowEngine.start(self.workflow, self.submitter, deleted_instance)
        Instance.objects.filter(pk=deleted_instance.pk).update(deleted=True)

        data = self.get_list(self.validator)
        self.assertEqual([item["id"] for item in data["results"]], [instance.id])
        self.assertEqual(self.get_counts(self.validator)["all"], 1)

    def test_submissions_of_another_account_are_not_visible(self):
        instance = self.create_instance()
        ValidationWorkflowEngine.start(self.workflow, self.submitter, instance)
        self.assertEqual(self.get_list(self.validator)["count"], 1)

        other_account = Account.objects.create(name="other account", modules=[MODULE_VALIDATION_WORKFLOW.codename])
        permissions = [CORE_VALIDATION_WORKFLOW_PERMISSION, CORE_SUBMISSIONS_PERMISSION]
        other_user = self.create_user_with_profile(
            username="other.account.user", account=other_account, permissions=permissions
        )
        # a superuser bypasses the roles of the steps, but not the account
        other_superuser = self.create_user_with_profile(
            username="other.account.superuser", account=other_account, is_superuser=True
        )

        for user in [other_user, other_superuser]:
            with self.subTest(user=user.username):
                self.assertEqual(self.get_list(user)["count"], 0)
                counts = self.get_counts(user)
                self.assertEqual(
                    counts,
                    {
                        "all": 0,
                        "awaiting_my_action": 0,
                        "awaiting_others": 0,
                        "handled_by_me": 0,
                        "rejected": 0,
                        "oldest_pending_since": None,
                    },
                )

    def set_last_updated(self, instance, last_updated):
        # update() does not touch the auto_now field, so the date can be set
        instance.validationnode_set.update(updated_at=last_updated)

    def test_order_by_last_updated(self):
        now = timezone.now()
        old = self.create_instance(reference="FAC-OLD")
        recent = self.create_instance(reference="FAC-RECENT")
        middle = self.create_instance(reference="FAC-MIDDLE")
        for instance in [old, recent, middle]:
            ValidationWorkflowEngine.start(self.workflow, self.submitter, instance)
        self.set_last_updated(old, now - datetime.timedelta(days=3))
        self.set_last_updated(recent, now - datetime.timedelta(days=1))
        self.set_last_updated(middle, now - datetime.timedelta(days=2))

        def ids(**params):
            return [item["id"] for item in self.get_list(self.validator, **params)["results"]]

        # the most recently updated first by default
        results = self.get_list(self.validator)["results"]
        self.assertEqual([item["id"] for item in results], [recent.id, middle.id, old.id])
        self.assertEqual(
            results[0]["last_updated"], (now - datetime.timedelta(days=1)).isoformat().replace("+00:00", "Z")
        )

        self.assertEqual(ids(order="last_updated"), [old.id, middle.id, recent.id])
        self.assertEqual(ids(order="-last_updated"), [recent.id, middle.id, old.id])
        self.assertEqual(ids(order="id"), [old.id, recent.id, middle.id])
        self.assertEqual(ids(order="-id"), [middle.id, recent.id, old.id])

        # ordering on a field that is not allowed (e.g. the answers of the submission) is ignored
        self.assertEqual(ids(order="json"), [recent.id, middle.id, old.id])

    def test_superuser_can_act_on_every_step(self):
        superuser = self.create_user_with_profile(username="superuser", account=self.account, is_superuser=True)
        instance = self.create_instance()
        ValidationWorkflowEngine.start(self.workflow, self.submitter, instance)
        self.complete_pending_step(instance, self.validator)
        self.complete_pending_step(instance, self.validator)

        # the final step needs the district and national roles, the superuser has none of them
        item = self.get_list(superuser)["results"][0]
        self.assertTrue(item["requires_user_action"])
        self.assertEqual(item["current_steps"][0]["name"], "Final approval")
        self.assertTrue(item["current_steps"][0]["user_can_act"])
        self.assertEqual(self.get_counts(superuser)["awaiting_my_action"], 1)

        # while the validator, with the district role only, cannot
        item = self.get_list(self.validator)["results"][0]
        self.assertFalse(item["requires_user_action"])
        self.assertFalse(item["current_steps"][0]["user_can_act"])

    def test_submitted_by_and_at_fall_back_on_the_submission(self):
        # e.g. submissions sent for validation before the submission step was recorded
        submitted_at = timezone.now() - datetime.timedelta(days=5)
        instance = self.create_instance()
        ValidationWorkflowEngine.start(self.workflow, self.submitter, instance)
        self.complete_pending_step(instance, self.validator)
        ValidationNode.objects.filter(
            instance=instance, status__in=[ValidationNodeStatus.SUBMISSION, ValidationNodeStatus.NEW_VERSION]
        ).delete()
        Instance.objects.filter(pk=instance.pk).update(created_by=self.submitter, source_created_at=submitted_at)

        item = self.get_list(self.validator)["results"][0]
        self.assertEqual(
            item["submitted_by"],
            {"id": self.submitter.id, "username": "submitter", "first_name": "Jean", "last_name": "Mbala"},
        )
        self.assertEqual(item["submitted_at"], submitted_at.isoformat().replace("+00:00", "Z"))
        self.assertFalse(item["is_resubmission"])

        # without the date of the device, the creation date on the server
        Instance.objects.filter(pk=instance.pk).update(created_by=None, source_created_at=None)
        instance.refresh_from_db()
        item = self.get_list(self.validator)["results"][0]
        self.assertIsNone(item["submitted_by"])
        self.assertEqual(item["submitted_at"], instance.created_at.isoformat().replace("+00:00", "Z"))

    # Queries, whatever the number of submissions (user permissions already loaded by a first request):
    #  list (5): 1 user org units, 1 count, 1 page (with the queue annotations),
    #            1 validation nodes (with user_can_act), 1 steps of the workflows (with their next steps)
    #  counts (3): 1 user org units, 1 queue counts, 1 oldest pending date
    def create_started_instances(self, count):
        for index in range(count):
            instance = self.create_instance(reference=f"FAC-{index}")
            ValidationWorkflowEngine.start(self.workflow, self.submitter, instance)
            self.complete_pending_step(instance, self.validator)

    def assert_num_queries_do_not_grow(self, url):
        self.client.force_authenticate(self.validator)
        self.client.get(url)  # loads the user permissions, cached for the next requests
        self.create_started_instances(2)
        with CaptureQueriesContext(connection) as few:
            self.assertJSONResponse(self.client.get(url), status.HTTP_200_OK)
        self.create_started_instances(5)
        with CaptureQueriesContext(connection) as many:
            self.assertJSONResponse(self.client.get(url), status.HTTP_200_OK)
        self.assertEqual(len(many.captured_queries), len(few.captured_queries))
        return len(few.captured_queries)

    def test_list_num_queries(self):
        self.assertEqual(self.assert_num_queries_do_not_grow(LIST_URL), 5)

    def test_counts_num_queries(self):
        self.assertEqual(self.assert_num_queries_do_not_grow(COUNTS_URL), 3)


class ComputeStepPositionsTestCase(SimpleTestCase):
    @staticmethod
    def steps(graph):
        """{step id: [next step ids]} => steps as the list view loads them"""
        return [SimpleNamespace(pk=pk, next_node_template_ids=next_ids) for pk, next_ids in graph.items()]

    def test_linear(self):
        self.assertEqual(compute_step_positions(self.steps({1: [2], 2: [3], 3: []})), {1: 1, 2: 2, 3: 3})

    def test_parallel_steps_share_the_same_position(self):
        # 1 => 2 and 3 in parallel => 4
        positions = compute_step_positions(self.steps({1: [2, 3], 2: [4], 3: [4], 4: []}))
        self.assertEqual(positions, {1: 1, 2: 2, 3: 2, 4: 3})

    def test_position_is_the_longest_path(self):
        # 1 => 2 => 4 and 1 => 3 => 5 => 4: step 4 comes after the longest branch
        positions = compute_step_positions(self.steps({1: [2, 3], 2: [4], 3: [5], 5: [4], 4: []}))
        self.assertEqual(positions, {1: 1, 2: 2, 3: 2, 5: 3, 4: 4})

    def test_steps_in_a_cycle_have_no_position(self):
        # 1 => 2 => 3 => 2
        positions = compute_step_positions(self.steps({1: [2], 2: [3], 3: [2]}))
        self.assertEqual(positions, {1: 1})

    def test_several_starting_steps(self):
        positions = compute_step_positions(self.steps({1: [3], 2: [3], 3: []}))
        self.assertEqual(positions, {1: 1, 2: 1, 3: 2})

    def test_no_steps(self):
        self.assertEqual(compute_step_positions([]), {})
