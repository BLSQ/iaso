from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings

from iaso.models import Account, Project, UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.tests.api.validation_workflows_node_templates.test_views.common import BaseApiTestCase


class ValidationNodeTemplateAPIBulkCreateTestCase(BaseApiTestCase):
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

    def test_permissions(self):
        res = self.client.post(
            reverse(
                "validation_node_templates-bulk",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.post(
            reverse(
                "validation_node_templates-bulk",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            )
        )
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse(
                "validation_node_templates-bulk",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            )
        )
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.superuser)
        res = self.client.post(
            reverse(
                "validation_node_templates-bulk",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            )
        )
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

    def test_check_validation_workflow_parent_slug_access(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse(
                "validation_node_templates-bulk",
                kwargs={"parent_lookup_workflow__slug": self.other_validation_workflow.slug},
            ),
            data=[
                {
                    "name": "First node",
                    "color": "#740d54",
                    "description": "Here we should check something",
                },
                {
                    "name": "First-node",
                    "color": "#fdd75b",
                    "canSkipPreviousNodes": True,
                    "rolesRequired": [self.user_role.pk],
                },
            ],
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        for error in res_data:
            self.assertHasError(
                error, "workflow", f"Object with slug={self.other_validation_workflow.slug} does not exist."
            )

    def test_validation(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse(
                "validation_node_templates-bulk",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            ),
            data=[],
        )

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data, self.snake_case_to_camel_case(api_settings.NON_FIELD_ERRORS_KEY), "This list may not be empty."
        )

        res = self.client.post(
            reverse(
                "validation_node_templates-bulk",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            ),
            data=[{"roles_required": [222]}],
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data[0], "name", "This field is required.")
        self.assertHasError(res_data[0], "rolesRequired", 'Invalid pk "222" - object does not exist.')

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)

        with self.assertNumQueries(18):
            res = self.client.post(
                reverse(
                    "validation_node_templates-bulk",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data=[
                    {
                        "name": "First node",
                        "color": "#740d54",
                        "description": "Here we should check something",
                    },
                    {"name": "Second node", "color": "#fdd75a"},
                    {
                        "name": "Last node",
                        "color": "#fdd75b",
                        "canSkipPreviousNodes": True,
                        "rolesRequired": [self.user_role.pk],
                    },
                ],
            )
            self.assertJSONResponse(res, status.HTTP_201_CREATED)

    def test_uniqueness_of_slug(self):
        self.client.force_authenticate(self.john_wick)

        # create node
        ValidationNodeTemplate.objects.create(name="First-node-", workflow=self.validation_workflow)

        res = self.client.post(
            reverse(
                "validation_node_templates-bulk",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            ),
            data=[
                {
                    "name": "First node",
                    "color": "#740d54",
                    "description": "Here we should check something",
                },
                {
                    "name": "First-node",
                    "color": "#fdd75b",
                    "canSkipPreviousNodes": True,
                    "rolesRequired": [self.user_role.pk],
                },
            ],
        )
        res_data = self.assertJSONResponse(res, status.HTTP_201_CREATED)
        self.assertEqual(res_data, [{"slug": "first-node-2"}, {"slug": "first-node-1"}])

    def test_happy_flow_as_superuser(self):
        self.base_test_happy_flow(self.superuser)

    def test_happy_flow(self):
        self.base_test_happy_flow(self.john_wick)

    def base_test_happy_flow(self, user):
        self.client.force_authenticate(user)
        res = self.client.post(
            reverse(
                "validation_node_templates-bulk",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            ),
            data=[
                {
                    "name": "First node",
                    "color": "#740d54",
                    "description": "Here we should check something",
                },
                {"name": "Second node", "color": "#fdd75a"},
                {
                    "name": "Last node",
                    "color": "#fdd75b",
                    "canSkipPreviousNodes": True,
                    "rolesRequired": [self.user_role.pk],
                },
            ],
        )
        res_data = self.assertJSONResponse(res, status.HTTP_201_CREATED)
        self.assertEqual(res_data, [{"slug": "first-node"}, {"slug": "second-node"}, {"slug": "last-node"}])

        # checking the DB objects
        first_node = ValidationNodeTemplate.objects.get(slug="first-node")
        second_node = ValidationNodeTemplate.objects.get(slug="second-node")
        third_node = ValidationNodeTemplate.objects.get(slug="last-node")

        # first node
        self.assertEqual(first_node.color, "#740D54")
        self.assertEqual(first_node.name, "First node")
        self.assertEqual(first_node.description, "Here we should check something")
        self.assertEqual(first_node.workflow, self.validation_workflow)
        self.assertFalse(first_node.can_skip_previous_nodes)
        self.assertFalse(first_node.roles_required.count())
        self.assertFalse(first_node.previous_node_templates.exists())
        self.assertEqual(list(first_node.next_node_templates.values_list("pk", flat=True)), [second_node.pk])

        # second node
        self.assertEqual(second_node.color, "#FDD75A")
        self.assertEqual(second_node.name, "Second node")
        self.assertEqual(second_node.description, "")
        self.assertEqual(second_node.workflow, self.validation_workflow)
        self.assertFalse(second_node.can_skip_previous_nodes)
        self.assertFalse(second_node.roles_required.count())
        self.assertEqual(list(second_node.previous_node_templates.values_list("pk", flat=True)), [first_node.pk])
        self.assertEqual(list(second_node.next_node_templates.values_list("pk", flat=True)), [third_node.pk])

        # third node
        self.assertEqual(third_node.color, "#FDD75B")
        self.assertEqual(third_node.name, "Last node")
        self.assertEqual(third_node.description, "")
        self.assertEqual(third_node.workflow, self.validation_workflow)
        self.assertTrue(third_node.can_skip_previous_nodes)
        self.assertEqual(list(third_node.roles_required.values_list("pk", flat=True)), [self.user_role.pk])
        self.assertEqual(list(third_node.previous_node_templates.values_list("pk", flat=True)), [second_node.pk])
        self.assertFalse(third_node.next_node_templates.exists())
