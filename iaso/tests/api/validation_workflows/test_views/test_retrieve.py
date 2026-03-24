from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Form, Instance, Project, UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.tests.api.validation_workflows.test_views.common import BaseValidationWorkflowAPITestCase


class ValidationWorkflowAPIRetrieveTestCase(BaseValidationWorkflowAPITestCase):
    def setUp(self):
        self.account = Account.objects.create(name="account")
        self.project = Project.objects.create(name="project", account=self.account)
        self.account_2 = Account.objects.create(name="account_2")

        self.group = Group.objects.create(name="Group")
        self.user_role = UserRole.objects.create(group=self.group, account=self.account)

        self.form = Form.objects.create(name="form")
        self.form.projects.add(self.project)
        self.form.save()

        Instance.objects.create(name="instance", form=self.form)
        Instance.objects.create(name="instance2", form=self.form)

        self.form_2 = Form.objects.create(name="form_2")
        self.form_2.projects.add(self.project)
        self.form_2.save()

        self.form_3 = Form.objects.create(name="form_3")

        self.john_doe = self.create_user_with_profile(
            username="john.doe", account=self.account, first_name="John", last_name="Doe"
        )

        self.john_wick = self.create_user_with_profile(
            username="john.wick", account=self.account, permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION]
        )

        self.validation_workflow_other_account = ValidationWorkflow.objects.create(
            name="Random other name",
            description="Random description",
            created_by=self.john_doe,
            account=self.account_2,
        )

        self.validation_workflow = ValidationWorkflow.objects.create(
            name="Random name",
            description="Random description",
            created_by=self.john_doe,
            updated_by=self.john_wick,
            account=self.account,
        )
        self.validation_workflow.form_set.set([self.form, self.form_2])
        self.validation_workflow.save()

        self.node_template = ValidationNodeTemplate.objects.create(
            name="First node",
            description="First node description",
            color="#FDD75A",
            can_skip_previous_nodes=False,
            workflow=self.validation_workflow,
        )

        self.node_template.roles_required.add(self.user_role)
        self.node_template.save()

        self.second_node_template = ValidationNodeTemplate.objects.create(
            name="Second node",
            description="Second node description",
            color="#740D54",
            can_skip_previous_nodes=True,
            workflow=self.validation_workflow,
        )

        self.node_template.next_node_templates.add(self.second_node_template)
        self.node_template.save()

    def test_permissions(self):
        res = self.client.get(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_404(self):
        self.client.force_authenticate(self.john_wick)

        with self.subTest("fetching wrong pk"):
            res = self.client.get(reverse("validation_workflows-detail", kwargs={"slug": "wrong-slug"}))
            self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        with self.subTest("fetching validation workflow that doesn't belong to account"):
            res = self.client.get(
                reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow_other_account.slug})
            )
            self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_workflow_without_nodes(self):
        validation_workflow = ValidationWorkflow.objects.create(name="without node", account=self.account)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validation_workflows-detail", kwargs={"slug": validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_retrieve(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        # checking main keys
        with self.subTest("Checking main top level keys"):
            for k in [
                "name",
                "slug",
                "description",
                "forms",
                "createdBy",
                "createdAt",
                "updatedBy",
                "updatedAt",
                "nodeTemplates",
            ]:
                self.assertIn(k, res_data)

            self.assertEqual(res_data["name"], "Random name")
            self.assertEqual(res_data["slug"], "random-name")
            self.assertEqual(res_data["description"], "Random description")
            self.assertEqual(res_data["createdBy"], self.john_doe.get_full_name())
            self.assertIsNotNone(res_data["createdAt"])
            self.assertIsNotNone(res_data["updatedAt"])
            self.assertEqual(res_data["updatedBy"], self.john_wick.username)

            self.assertIsNotNone(res_data["forms"])
            self.assertIsNotNone(res_data["nodeTemplates"])

        with self.subTest("checking forms"):
            for form_value in res_data["forms"]:
                self.assertIn("id", form_value)
                self.assertIn("label", form_value)
            self.assertCountEqual(
                res_data["forms"],
                [{"id": self.form.pk, "label": self.form.name}, {"id": self.form_2.pk, "label": self.form_2.name}],
            )

        with self.subTest("checking nodeTemplates"):
            for node_template in res_data["nodeTemplates"]:
                for k in ["slug", "name", "description", "color", "canSkipPreviousNodes", "rolesRequired"]:
                    self.assertIn(k, node_template)

            self.assertEqual(
                res_data["nodeTemplates"],
                [
                    {
                        "slug": "first-node",
                        "name": "First node",
                        "description": "First node description",
                        "color": "#FDD75A",
                        "rolesRequired": [{"name": "Group", "id": self.group.pk}],
                        "canSkipPreviousNodes": False,
                    },
                    {
                        "slug": "second-node",
                        "name": "Second node",
                        "description": "Second node description",
                        "color": "#740D54",
                        "rolesRequired": [],
                        "canSkipPreviousNodes": True,
                    },
                ],
            )

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(10):
            res = self.client.get(
                reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug})
            )
            self.assertEqual(res.status_code, status.HTTP_200_OK)
