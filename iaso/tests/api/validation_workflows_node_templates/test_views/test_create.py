from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Project, UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.models.validation_workflow.templates import PositionChoices
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.tests.api.validation_workflows_node_templates.test_views.common import BaseApiTestCase


class ValidationNodeTemplateAPICreateTestCase(BaseApiTestCase):
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

        self.other_validation_workflow = ValidationWorkflow.objects.create(
            name="Random other name 2",
            description="Random description",
            created_by=self.john_doe,
            account=self.account_2,
        )

        # create some nodes
        self.first_node = ValidationNodeTemplate.objects.create(name="First node", workflow=self.validation_workflow)
        self.second_node = ValidationNodeTemplate.objects.create(name="Second node", workflow=self.validation_workflow)
        self.second_node.previous_node_templates.add(self.first_node)

        self.outer_workflow_node = ValidationNodeTemplate.objects.create(
            name="first outer node", workflow=self.other_validation_workflow
        )

    def test_permissions(self):
        res = self.client.post(
            reverse(
                "validation_node_templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            )
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.post(
            reverse(
                "validation_node_templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            )
        )
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse(
                "validation_node_templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            )
        )
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

    def test_check_validation_workflow_parent_slug_access(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse(
                "validation_node_templates-list",
                kwargs={"parent_lookup_workflow__slug": self.other_validation_workflow.slug},
            ),
            data={"name": "random"},
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data, "workflow", f"Object with slug={self.other_validation_workflow.slug} does not exist."
        )

    def test_num_queries_insert_first(self):
        self.client.force_authenticate(self.john_wick)

        with self.assertNumQueries(16):
            res = self.client.post(
                reverse(
                    "validation_node_templates-list",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data={
                    "name": "Random name 2",
                    "description": "Random description",
                    "color": "#377760",
                    "rolesRequired": [self.user_role.pk],
                    "position": PositionChoices.first,
                    "canSkipPreviousNodes": True,
                },
            )

            self.assertJSONResponse(res, status.HTTP_201_CREATED)

    def test_num_queries_insert_last(self):
        self.client.force_authenticate(self.john_wick)

        with self.assertNumQueries(16):
            res = self.client.post(
                reverse(
                    "validation_node_templates-list",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data={
                    "name": "Random name 3",
                    "description": "Random description",
                    "color": "#377760",
                    "rolesRequired": [self.user_role.pk],
                    "position": PositionChoices.last,
                    "canSkipPreviousNodes": True,
                },
            )

            self.assertJSONResponse(res, status.HTTP_201_CREATED)

    def test_num_queries_insert_between(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(17):
            res = self.client.post(
                reverse(
                    "validation_node_templates-list",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data={
                    "name": "Random name",
                    "description": "Random description",
                    "color": "#377760",
                    "rolesRequired": [self.user_role.pk],
                    "position": PositionChoices.child_of,
                    "parentNodeTemplates": [self.first_node.slug],
                    "canSkipPreviousNodes": True,
                },
            )

            self.assertJSONResponse(res, status.HTTP_201_CREATED)

    def test_happy_flow(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse(
                "validation_node_templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            ),
            data={
                "name": "Random node",
                "description": "Random description",
                "color": "#377760",
                "rolesRequired": [self.user_role.pk],
                "position": PositionChoices.child_of,
                "parentNodeTemplates": [self.first_node.slug],
                "canSkipPreviousNodes": True,
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_201_CREATED)

        self.assertEqual(res_data, {"slug": "random-node"})

        # check the db
        created_node = ValidationNodeTemplate.objects.get(slug="random-node")

        self.assertEqual(created_node.workflow, self.validation_workflow)
        self.assertEqual(created_node.name, "Random node")
        self.assertEqual(created_node.description, "Random description")
        self.assertEqual(created_node.color, "#377760")
        self.assertTrue(created_node.can_skip_previous_nodes)
        self.assertEqual(list(created_node.previous_node_templates.values_list("pk", flat=True)), [self.first_node.pk])
        self.assertEqual(list(created_node.next_node_templates.values_list("pk", flat=True)), [self.second_node.pk])

        # check that the whole linear graph has been updated correctly
        self.validation_workflow.refresh_from_db()

        self.assertEqual(self.validation_workflow.get_starting_node(), self.first_node)
        self.first_node.refresh_from_db()
        self.assertEqual(list(self.first_node.next_node_templates.values_list("pk", flat=True)), [created_node.pk])

        self.second_node.refresh_from_db()
        self.assertEqual(list(self.second_node.previous_node_templates.values_list("pk", flat=True)), [created_node.pk])
        self.assertFalse(self.second_node.next_node_templates.exists())

        with self.subTest("Insert starting node"):
            res = self.client.post(
                reverse(
                    "validation_node_templates-list",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data={
                    "name": "Random starting node",
                    "description": "Random description",
                    "color": "#377760",
                    "position": PositionChoices.first,
                    "canSkipPreviousNodes": True,
                },
            )
            self.assertJSONResponse(res, status.HTTP_201_CREATED)

            # check the db
            second_created_node = ValidationNodeTemplate.objects.get(slug="random-starting-node")

            self.assertEqual(second_created_node.workflow, self.validation_workflow)
            self.assertEqual(second_created_node.name, "Random starting node")
            self.assertEqual(second_created_node.description, "Random description")
            self.assertEqual(second_created_node.color, "#377760")
            self.assertTrue(second_created_node.can_skip_previous_nodes)
            self.assertFalse(second_created_node.previous_node_templates.exists())
            self.assertEqual(
                list(second_created_node.next_node_templates.values_list("pk", flat=True)), [self.first_node.pk]
            )

            created_node = ValidationNodeTemplate.objects.get(slug="random-node")

            self.assertEqual(created_node.workflow, self.validation_workflow)
            self.assertEqual(created_node.name, "Random node")
            self.assertEqual(created_node.description, "Random description")
            self.assertEqual(created_node.color, "#377760")
            self.assertTrue(created_node.can_skip_previous_nodes)
            self.assertEqual(
                list(created_node.previous_node_templates.values_list("pk", flat=True)), [self.first_node.pk]
            )
            self.assertEqual(list(created_node.next_node_templates.values_list("pk", flat=True)), [self.second_node.pk])

            # check that the whole linear graph has been updated correctly
            self.validation_workflow.refresh_from_db()

            self.assertEqual(self.validation_workflow.get_starting_node(), second_created_node)

            self.first_node.refresh_from_db()
            self.assertEqual(list(self.first_node.next_node_templates.values_list("pk", flat=True)), [created_node.pk])
            self.assertEqual(
                list(self.first_node.previous_node_templates.values_list("pk", flat=True)), [second_created_node.pk]
            )

            self.second_node.refresh_from_db()
            self.assertEqual(
                list(self.second_node.previous_node_templates.values_list("pk", flat=True)), [created_node.pk]
            )
            self.assertFalse(self.second_node.next_node_templates.exists())

        # insert a last node
        with self.subTest("Insert last node"):
            res = self.client.post(
                reverse(
                    "validation_node_templates-list",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data={
                    "name": "Random last node",
                    "description": "Random description",
                    "color": "#377760",
                    "position": PositionChoices.last,
                    "canSkipPreviousNodes": True,
                },
            )
            self.assertJSONResponse(res, status.HTTP_201_CREATED)

            # check the db
            last_created_node = ValidationNodeTemplate.objects.get(slug="random-last-node")
            self.assertEqual(last_created_node.workflow, self.validation_workflow)
            self.assertEqual(last_created_node.name, "Random last node")
            self.assertEqual(last_created_node.description, "Random description")
            self.assertEqual(last_created_node.color, "#377760")
            self.assertTrue(last_created_node.can_skip_previous_nodes)
            self.assertFalse(last_created_node.next_node_templates.exists())
            self.assertEqual(
                list(last_created_node.previous_node_templates.values_list("pk", flat=True)), [self.second_node.pk]
            )

            second_created_node.refresh_from_db()
            self.assertEqual(second_created_node.workflow, self.validation_workflow)
            self.assertEqual(second_created_node.name, "Random starting node")
            self.assertEqual(second_created_node.description, "Random description")
            self.assertEqual(second_created_node.color, "#377760")
            self.assertTrue(second_created_node.can_skip_previous_nodes)
            self.assertFalse(second_created_node.previous_node_templates.exists())
            self.assertEqual(
                list(second_created_node.next_node_templates.values_list("pk", flat=True)), [self.first_node.pk]
            )

            created_node.refresh_from_db()

            self.assertEqual(created_node.workflow, self.validation_workflow)
            self.assertEqual(created_node.name, "Random node")
            self.assertEqual(created_node.description, "Random description")
            self.assertEqual(created_node.color, "#377760")
            self.assertTrue(created_node.can_skip_previous_nodes)
            self.assertEqual(
                list(created_node.previous_node_templates.values_list("pk", flat=True)), [self.first_node.pk]
            )
            self.assertEqual(list(created_node.next_node_templates.values_list("pk", flat=True)), [self.second_node.pk])

            # check that the whole linear graph has been updated correctly
            self.validation_workflow.refresh_from_db()

            self.assertEqual(self.validation_workflow.get_starting_node(), second_created_node)

            self.first_node.refresh_from_db()
            self.assertEqual(list(self.first_node.next_node_templates.values_list("pk", flat=True)), [created_node.pk])
            self.assertEqual(
                list(self.first_node.previous_node_templates.values_list("pk", flat=True)), [second_created_node.pk]
            )

            self.second_node.refresh_from_db()
            self.assertEqual(
                list(self.second_node.previous_node_templates.values_list("pk", flat=True)), [created_node.pk]
            )
            self.assertEqual(
                list(self.second_node.next_node_templates.values_list("pk", flat=True)), [last_created_node.pk]
            )
