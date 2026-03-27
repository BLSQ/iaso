from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Project, UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.models.validation_workflow.templates import PositionChoices
from iaso.tests.api.validation_workflows_node_templates.test_views.common import BaseApiTestCase


class ValidationNodeTemplateAPIMoveTestCase(BaseApiTestCase):
    def setUp(self):
        super().setUp()
        self.project = Project.objects.create(name="project", account=self.account)
        self.account_2 = Account.objects.create(name="account_2")

        self.group = Group.objects.create(name="Group")
        self.user_role = UserRole.objects.create(group=self.group, account=self.account)

        self.validation_workflow = ValidationWorkflow.objects.create(
            name="Random other name",
            description="Random description",
            created_by=self.john_doe,
            account=self.account,
        )

        self.other_validation_workflow = ValidationWorkflow.objects.create(
            name="Random other name 2",
            description="Random description",
            created_by=self.john_doe,
            account=self.account_2,
        )

        self.other_node = ValidationNodeTemplate.objects.create(
            name="First node 2", workflow=self.other_validation_workflow
        )
        self.other_second_node = ValidationNodeTemplate.objects.create(
            name="Second node 2", workflow=self.other_validation_workflow
        )
        self.other_second_node.previous_node_templates.add(self.other_node)

        # create some nodes
        self.first_node = ValidationNodeTemplate.objects.create(name="First node", workflow=self.validation_workflow)
        self.second_node = ValidationNodeTemplate.objects.create(name="Second node", workflow=self.validation_workflow)
        self.third_node = ValidationNodeTemplate.objects.create(name="Third node", workflow=self.validation_workflow)
        self.second_node.previous_node_templates.add(self.first_node)
        self.second_node.next_node_templates.add(self.third_node)

    def test_check_validation_workflow_parent_slug_access(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={
                    "parent_lookup_workflow__slug": self.other_validation_workflow.slug,
                    "slug": self.other_node.slug,
                },
            ),
            data={
                "position": PositionChoices.first,
            },
        )
        self.assertJSONResponse(res, status.HTTP_404_NOT_FOUND)

    def test_happy_flow(self):
        self.base_test_happy_flow(self.john_wick)

    def test_happy_flow_as_superuser(self):
        self.base_test_happy_flow(self.superuser)

    def base_test_happy_flow(self, user):
        self.client.force_authenticate(user)
        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            ),
            data={"position": PositionChoices.first},
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
            data={"position": PositionChoices.child_of, "parentNodeTemplates": [self.first_node.slug]},
        )

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.validation_workflow.dump_nodes(), ["first-node", "second-node", "third-node"])

        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            ),
            data={"position": PositionChoices.last},
        )

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.validation_workflow.dump_nodes(), ["first-node", "third-node", "second-node"])

    def test_permissions(self):
        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            ),
            data={"position": PositionChoices.first},
        )

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            ),
            data={"position": PositionChoices.first},
        )

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            ),
            data={"position": PositionChoices.first},
        )

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        self.client.force_authenticate(self.superuser)
        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            ),
            data={"position": PositionChoices.first},
        )

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.put(
            reverse(
                "validation_node_templates-move",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            ),
            data={"position": PositionChoices.first},
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
                data={"position": PositionChoices.child_of, "parentNodeTemplates": [self.first_node.slug]},
            )

            self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
