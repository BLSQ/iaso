from unittest import mock

from django.contrib.auth.models import Group
from django.db import IntegrityError
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Form, Project, UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.tests.api.validation_workflows.test_views.common import BaseValidationWorkflowAPITestCase


class ValidationWorkflowAPIDuplicateTestCase(BaseValidationWorkflowAPITestCase):
    def setUp(self):
        super().setUp()
        self.project = Project.objects.create(name="project", account=self.account)
        self.account_2 = Account.objects.create(name="account_2")
        self.add_validation_workflow_module(self.account, self.account_2)

        self.group = Group.objects.create(name=f"{self.account.id}_Group")
        self.user_role = UserRole.objects.create(group=self.group, account=self.account)

        self.form = Form.objects.create(name="form")
        self.form.projects.add(self.project)

        self.validation_workflow = ValidationWorkflow.objects.create(
            name="Random name",
            description="Random description",
            created_by=self.john_doe,
            updated_by=self.john_doe,
            account=self.account,
        )
        self.validation_workflow.form_set.set([self.form])

        # Steps created in reverse order to check the copy keeps the chain order, not the creation order
        self.third_node = ValidationNodeTemplate.objects.create(name="Third node", workflow=self.validation_workflow)
        self.second_node = ValidationNodeTemplate.objects.create(
            name="Second node",
            description="Second node description",
            can_skip_previous_nodes=True,
            workflow=self.validation_workflow,
        )
        self.first_node = ValidationNodeTemplate.objects.create(
            name="First node", description="First node description", workflow=self.validation_workflow
        )
        self.first_node.roles_required.add(self.user_role)
        self.first_node.next_node_templates.add(self.second_node)
        self.second_node.next_node_templates.add(self.third_node)

        self.validation_workflow_other_account = ValidationWorkflow.objects.create(
            name="Other account workflow", account=self.account_2
        )

    def duplicate(self, slug):
        return self.client.post(reverse("validation_workflows-duplicate", kwargs={"slug": slug}))

    def test_permissions(self):
        res = self.duplicate(self.validation_workflow.slug)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        self.assertJSONResponse(self.duplicate(self.validation_workflow.slug), status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_submission)
        self.assertJSONResponse(self.duplicate(self.validation_workflow.slug), status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_without_feature_flag)
        self.assertJSONResponse(
            self.duplicate(self.validation_workflow_without_feature_flag.slug), status.HTTP_403_FORBIDDEN
        )

    def test_other_account_workflow_is_not_found(self):
        self.client.force_authenticate(self.john_wick)
        res = self.duplicate(self.validation_workflow_other_account.slug)
        self.assertJSONResponse(res, status.HTTP_404_NOT_FOUND)

    def test_duplicate(self):
        self.client.force_authenticate(self.john_wick)
        res = self.duplicate(self.validation_workflow.slug)
        res_data = self.assertJSONResponse(res, status.HTTP_201_CREATED)

        copy = ValidationWorkflow.objects.get(slug=res_data["slug"], account=self.account)
        self.assertEqual(res_data, {"slug": copy.slug, "name": "Random name (copy)"})
        self.assertNotEqual(copy.pk, self.validation_workflow.pk)
        self.assertEqual(copy.description, "Random description")
        self.assertEqual(copy.created_by, self.john_wick)
        self.assertIsNone(copy.updated_by)

        # Forms stay linked to the original workflow only
        self.assertFalse(copy.form_set.exists())
        self.assertEqual(list(self.validation_workflow.form_set.all()), [self.form])

        self.assertEqual(copy.dump_nodes(), ["first-node", "second-node", "third-node"])
        first, second, third = (
            copy.node_templates.get(name=name) for name in ["First node", "Second node", "Third node"]
        )
        self.assertEqual(first.description, "First node description")
        self.assertEqual(list(first.roles_required.all()), [self.user_role])
        self.assertFalse(first.can_skip_previous_nodes)
        self.assertEqual(second.description, "Second node description")
        self.assertTrue(second.can_skip_previous_nodes)
        self.assertFalse(third.roles_required.exists())

        # The original is untouched
        self.assertEqual(self.validation_workflow.dump_nodes(), ["first-node", "second-node", "third-node"])
        self.assertEqual(self.validation_workflow.node_templates.count(), 3)

    def test_duplicate_names(self):
        self.client.force_authenticate(self.john_wick)

        names = [self.duplicate(self.validation_workflow.slug).json()["name"] for _ in range(3)]
        self.assertEqual(names, ["Random name (copy)", "Random name (copy 2)", "Random name (copy 3)"])

        # A deleted copy frees its name
        ValidationWorkflow.objects.get(account=self.account, name="Random name (copy)").delete()
        res_data = self.assertJSONResponse(self.duplicate(self.validation_workflow.slug), status.HTTP_201_CREATED)
        self.assertEqual(res_data["name"], "Random name (copy)")

    def test_duplicate_name_single_query(self):
        ValidationWorkflow.objects.create(name="Random name (copy)", account=self.account)
        for index in range(2, 21):
            ValidationWorkflow.objects.create(name=f"Random name (copy {index})", account=self.account)
        # Not copies of this workflow: must not be counted as taken
        ValidationWorkflow.objects.create(name="Random name (copy 21) extra", account=self.account_2)
        ValidationWorkflow.objects.create(name="Random name (copy 21)", account=self.account_2)

        with self.assertNumQueries(1):
            self.assertEqual(self.validation_workflow.get_duplicate_name(), "Random name (copy 21)")

    def test_duplicate_retries_on_concurrent_copy(self):
        # Simulates another user creating "Random name (copy)" between the name computation and the insert
        ValidationWorkflow.objects.create(name="Random name (copy)", account=self.account)
        self.client.force_authenticate(self.john_wick)

        with mock.patch.object(
            ValidationWorkflow,
            "get_duplicate_name",
            side_effect=["Random name (copy)", "Random name (copy 2)"],
        ):
            res_data = self.assertJSONResponse(self.duplicate(self.validation_workflow.slug), status.HTTP_201_CREATED)

        self.assertEqual(res_data["name"], "Random name (copy 2)")
        self.assertEqual(
            ValidationWorkflow.objects.get(slug=res_data["slug"]).dump_nodes(),
            ["first-node", "second-node", "third-node"],
        )

    def test_duplicate_gives_up_after_max_attempts(self):
        ValidationWorkflow.objects.create(name="Random name (copy)", account=self.account)

        with mock.patch.object(ValidationWorkflow, "get_duplicate_name", return_value="Random name (copy)"):
            with self.assertRaises(IntegrityError):
                self.validation_workflow.duplicate(self.john_wick)

        self.assertEqual(ValidationWorkflow.objects.filter(account=self.account, name="Random name (copy)").count(), 1)

    def test_duplicate_long_name(self):
        self.validation_workflow.name = "a" * 256
        self.validation_workflow.save()
        self.client.force_authenticate(self.john_wick)

        res_data = self.assertJSONResponse(self.duplicate(self.validation_workflow.slug), status.HTTP_201_CREATED)
        self.assertEqual(res_data["name"], "a" * 249 + " (copy)")

    def test_duplicate_without_steps(self):
        self.validation_workflow.node_templates.all().delete()
        self.client.force_authenticate(self.john_wick)

        res_data = self.assertJSONResponse(self.duplicate(self.validation_workflow.slug), status.HTTP_201_CREATED)
        copy = ValidationWorkflow.objects.get(slug=res_data["slug"], account=self.account)
        self.assertFalse(copy.node_templates.exists())
