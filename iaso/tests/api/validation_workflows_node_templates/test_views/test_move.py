from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings

from iaso.models import Account, Project, UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.tests.api.validation_workflows_node_templates.test_views.common import BaseApiTestCase


class ValidationNodeTemplateAPIMoveTestCase(BaseApiTestCase):
    def setUp(self):
        self.account = Account.objects.create(name="account")
        self.project = Project.objects.create(name="project", account=self.account)
        self.account_2 = Account.objects.create(name="account_2")

        self.group = Group.objects.create(name="Group")
        self.user_role = UserRole.objects.create(group=self.group, account=self.account)

        self.john_doe = self.create_user_with_profile(
            username="john.doe", account=self.account, first_name="John", last_name="Doe"
        )

        self.john_wick = self.create_user_with_profile(
            username="john.wick", account=self.account, permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION]
        )

        self.validation_workflow = ValidationWorkflow.objects.create(
            name="Random other name",
            description="Random description",
            created_by=self.john_doe,
            account=self.account,
        )

        # create some nodes
        self.first_node = ValidationNodeTemplate.objects.create(name="First node", workflow=self.validation_workflow)
        self.second_node = ValidationNodeTemplate.objects.create(name="Second node", workflow=self.validation_workflow)
        self.third_node = ValidationNodeTemplate.objects.create(name="Third node", workflow=self.validation_workflow)
        self.second_node.previous_node_templates.add(self.first_node)
        self.second_node.next_node_templates.add(self.third_node)

    def test_happy_flow(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            ),
            data={
                "newNextNodes": [self.first_node.slug],
            },
        )

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        # check that it was moved to first node
        self.validation_workflow.refresh_from_db()
        self.assertEqual(self.validation_workflow.dump_nodes(), ["second-node", "first-node", "third-node"])

        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            ),
            data={
                "newPreviousNodes": [self.first_node.slug],
                "newNextNodes": [self.third_node.slug],
            },
        )

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.validation_workflow.dump_nodes(), ["first-node", "second-node", "third-node"])

        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            ),
            data={
                "newPreviousNodes": [self.third_node.slug],
            },
        )

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.validation_workflow.dump_nodes(), ["first-node", "third-node", "second-node"])

    def test_permissions(self):
        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            ),
            data={
                "newNextNodes": [self.first_node.slug],
            },
        )

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            ),
            data={
                "newNextNodes": [self.first_node.slug],
            },
        )

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            ),
            data={
                "newNextNodes": [self.first_node.slug],
            },
        )

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_validation(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            )
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data,
            self.snake_case_to_camel_case(api_settings.NON_FIELD_ERRORS_KEY),
            "You must provide one of those : new_next_nodes, new_previous_nodes.",
        )

        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            ),
            data={
                "newPreviousNodes": [self.second_node.slug],
                "newNextNodes": [self.second_node.slug],
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(res_data, "newPreviousNodes", "Object with slug=second-node does not exist.")
        self.assertHasError(res_data, "newNextNodes", "Object with slug=second-node does not exist.")

        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            ),
            data={
                "newPreviousNodes": ["wrong"],
                "newNextNodes": ["wrong"],
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(res_data, "newPreviousNodes", "Object with slug=wrong does not exist.")
        self.assertHasError(res_data, "newNextNodes", "Object with slug=wrong does not exist.")

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            ),
            data={
                "newNextNodes": [self.first_node.slug],
            },
        )

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        # check that it was moved to first node
        self.validation_workflow.refresh_from_db()
        self.assertEqual(self.validation_workflow.dump_nodes(), ["second-node", "first-node", "third-node"])

        with self.assertNumQueries(10):
            res = self.client.put(
                reverse(
                    "validation_node_templates-move",
                    kwargs={
                        "parent_lookup_workflow__slug": self.validation_workflow.slug,
                        "slug": self.second_node.slug,
                    },
                ),
                data={
                    "newPreviousNodes": [self.first_node.slug],
                    "newNextNodes": [self.third_node.slug],
                },
            )

            self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
