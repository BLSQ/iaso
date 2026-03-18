import re

from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings

from iaso.models import Account, Project, UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.test import APITestCase


class BaseApiTestCase(APITestCase):
    @staticmethod
    def camel_case_to_snake_case(value):
        pattern = re.compile(r"(?<!^)(?=[A-Z])")
        return pattern.sub("_", value).lower()

    @staticmethod
    def snake_case_to_camel_case(value):
        camel_string = "".join(x.capitalize() for x in value.lower().split("_"))

        return value[0].lower() + camel_string[1:]


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
            name="Random other name",
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
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            )
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.post(
            reverse(
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            )
        )
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse(
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            )
        )
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

    def test_validation(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse(
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            )
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "name", "This field is required.")

        res = self.client.post(
            reverse(
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            ),
            data={"name": "Random name"},
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data,
            self.snake_case_to_camel_case(api_settings.NON_FIELD_ERRORS_KEY),
            "You must specify either next node templates or previous node templates.",
        )

        res = self.client.post(
            reverse(
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            ),
            data={"name": "Random name", "rolesRequired": [222]},
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "rolesRequired", 'Invalid pk "222" - object does not exist.')

        res = self.client.post(
            reverse(
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            ),
            data={
                "name": "Random name",
                "previousNodeTemplates": [self.outer_workflow_node.slug],
                "nextNodeTemplates": [self.outer_workflow_node.slug],
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data, "previousNodeTemplates", f"Object with slug={self.outer_workflow_node.slug} does not exist."
        )
        self.assertHasError(
            res_data, "nextNodeTemplates", f"Object with slug={self.outer_workflow_node.slug} does not exist."
        )

        res = self.client.post(
            reverse(
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            ),
            data={
                "name": "Random name",
                "previousNodeTemplates": [self.first_node.slug, self.first_node.slug],
                "nextNodeTemplates": [self.first_node.slug, self.first_node.slug],
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "previousNodeTemplates", "Duplicate nodes are not allowed.")
        self.assertHasError(res_data, "nextNodeTemplates", "Duplicate nodes are not allowed.")

        res = self.client.post(
            reverse(
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            ),
            data={
                "name": "Random name",
                "previousNodeTemplates": [self.first_node.slug, self.second_node.slug],
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "previousNodeTemplates", "One node maximum allowed.")

        res = self.client.post(
            reverse(
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            ),
            data={
                "name": "Random name",
                "nextNodeTemplates": [self.first_node.slug, self.second_node.slug],
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "nextNodeTemplates", "One node maximum allowed.")

        res = self.client.post(
            reverse(
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            ),
            data={
                "name": "Random name",
                "previousNodeTemplates": [self.first_node.slug],
                "nextNodeTemplates": [self.first_node.slug],
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data,
            self.snake_case_to_camel_case(api_settings.NON_FIELD_ERRORS_KEY),
            "There are duplicate nodes in previous and next node templates.",
        )

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(1):
            res = self.client.post(
                reverse(
                    "validation-node-templates-list",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data={
                    "name": "Random name",
                    "description": "Random description",
                    "color": "#377760",
                    "rolesRequired": [self.user_role.pk],
                    "previousNodeTemplates": [self.first_node.slug],
                    "nextNodeTemplates": [self.second_node.slug],
                    "canSkipPreviousNodes": True,
                },
            )

            self.assertJSONResponse(res, status.HTTP_201_CREATED)

    def test_happy_flow(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse(
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            ),
            data={
                "name": "Random node",
                "description": "Random description",
                "color": "#377760",
                "rolesRequired": [self.user_role.pk],
                "previousNodeTemplates": [self.first_node.slug],
                "nextNodeTemplates": [self.second_node.slug],
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
                    "validation-node-templates-list",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data={
                    "name": "Random starting node",
                    "description": "Random description",
                    "color": "#377760",
                    "rolesRequired": [self.user_role.pk],
                    "nextNodeTemplates": [self.first_node.slug],
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
                    "validation-node-templates-list",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data={
                    "name": "Random last node",
                    "description": "Random description",
                    "color": "#377760",
                    "rolesRequired": [self.user_role.pk],
                    "previousNodeTemplates": [self.second_node.slug],
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


class ValidationNodeTemplateAPIBulkCreateTestCase(BaseApiTestCase):
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

    def test_permissions(self):
        res = self.client.post(
            reverse(
                "validation-node-templates-bulk-create",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.post(
            reverse(
                "validation-node-templates-bulk-create",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            )
        )
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse(
                "validation-node-templates-bulk-create",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            )
        )
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

    def test_validation(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse(
                "validation-node-templates-bulk-create",
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
                "validation-node-templates-bulk-create",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            ),
            data=[{"roles_required": [222]}],
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data[0], "name", "This field is required.")
        self.assertHasError(res_data[0], "rolesRequired", 'Invalid pk "222" - object does not exist.')

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)

        with self.assertNumQueries(10):
            res = self.client.post(
                reverse(
                    "validation-node-templates-bulk-create",
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

    def test_happy_flow(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse(
                "validation-node-templates-bulk-create",
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


class ValidationNodeTemplateAPIRetrieveTestCase(BaseApiTestCase):
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
        self.second_node = ValidationNodeTemplate.objects.create(
            name="Second node",
            workflow=self.validation_workflow,
            color="#ffffff",
            description="some description",
            can_skip_previous_nodes=True,
        )
        self.third_node = ValidationNodeTemplate.objects.create(name="Third node", workflow=self.validation_workflow)
        self.second_node.previous_node_templates.add(self.first_node)
        self.second_node.next_node_templates.add(self.third_node)
        self.second_node.roles_required.add(self.user_role)

    def test_permissions(self):
        res = self.client.get(
            reverse(
                "validation-node-templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(
            reverse(
                "validation-node-templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            )
        )
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(
            reverse(
                "validation-node-templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            )
        )
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_number_queries(self):
        self.client.force_authenticate(self.john_wick)

        with self.assertNumQueries(2):
            res = self.client.get(
                reverse(
                    "validation-node-templates-detail",
                    kwargs={
                        "parent_lookup_workflow__slug": self.validation_workflow.slug,
                        "slug": self.second_node.slug,
                    },
                )
            )
            self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_happy_flow(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.get(
            reverse(
                "validation-node-templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            )
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        fields = ["slug", "name", "description", "color", "rolesRequired", "canSkipPreviousNodes"]

        for field in fields:
            self.assertIn(field, res_data)

        self.assertEqual(res_data["slug"], "second-node")
        self.assertEqual(res_data["name"], "Second node")
        self.assertEqual(res_data["description"], "some description")
        self.assertEqual(res_data["color"], "#FFFFFF")
        self.assertEqual(res_data["rolesRequired"], [{"id": self.user_role.pk, "name": self.user_role.group.name}])
        self.assertTrue(res_data["canSkipPreviousNodes"])


class ValidationNodeTemplateAPIListTestCase(BaseApiTestCase):
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
        self.second_node = ValidationNodeTemplate.objects.create(
            name="Second node",
            workflow=self.validation_workflow,
            color="#ffffff",
            description="some description",
            can_skip_previous_nodes=True,
        )
        self.third_node = ValidationNodeTemplate.objects.create(name="Third node", workflow=self.validation_workflow)
        self.second_node.previous_node_templates.add(self.first_node)
        self.second_node.next_node_templates.add(self.third_node)
        self.second_node.roles_required.add(self.user_role)

    def test_permissions(self):
        res = self.client.get(
            reverse(
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            )
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(
            reverse(
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            )
        )
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(
            reverse(
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            )
        )
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_number_queries(self):
        self.client.force_authenticate(self.john_wick)

        with self.assertNumQueries(2):
            res = self.client.get(
                reverse(
                    "validation-node-templates-list",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                )
            )
            self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_happy_flow(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.get(
            reverse(
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            )
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidListData(list_data=res_data, results_key="results", expected_length=3)

        fields = ["slug", "name", "description", "color", "rolesRequired", "canSkipPreviousNodes"]

        for data in res_data["results"]:
            for field in fields:
                self.assertIn(field, data)

    def test_is_paginated(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.get(
            reverse(
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            )
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidListData(list_data=res_data, results_key="results", expected_length=3)

        self.client.force_authenticate(self.john_wick)

        res = self.client.get(
            reverse(
                "validation-node-templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            ),
            data={"limit": 1},
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidListData(list_data=res_data, results_key="results", expected_length=1)


class ValidationNodeTemplateAPIDeleteTestCase(BaseApiTestCase):
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

    def test_permissions(self):
        res = self.client.delete(
            reverse(
                "validation-node-templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.delete(
            reverse(
                "validation-node-templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            )
        )
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.delete(
            reverse(
                "validation-node-templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            )
        )
        self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(1):
            res = self.client.delete(
                reverse(
                    "validation-node-templates-detail",
                    kwargs={
                        "parent_lookup_workflow__slug": self.validation_workflow.slug,
                        "slug": self.second_node.slug,
                    },
                )
            )
            self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

    def test_happy_flow(self):
        self.client.force_authenticate(self.john_wick)

        second_node_slug = self.second_node.slug
        res = self.client.delete(
            reverse(
                "validation-node-templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            )
        )
        self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

        # check db
        self.assertFalse(ValidationNodeTemplate.objects.filter(slug=second_node_slug).exists())

        self.first_node.refresh_from_db()
        self.assertFalse(self.first_node.previous_node_templates.exists())
        self.assertEqual(list(self.first_node.next_node_templates.values_list("pk", flat=True)), [self.third_node.pk])

        self.third_node.refresh_from_db()
        self.assertFalse(self.third_node.next_node_templates.exists())
        self.assertEqual(
            list(self.third_node.previous_node_templates.values_list("pk", flat=True)), [self.first_node.pk]
        )


class ValidationNodeTemplateAPIBulkUpdateTestCase(BaseApiTestCase):
    def test_happy_flow(self):
        self.fail()

    def test_permissions(self):
        self.fail()

    def test_validation(self):
        self.fail()

    def test_num_queries(self):
        self.fail()


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
                "validation-node-templates-move",
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
                "validation-node-templates-move",
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
                "validation-node-templates-move",
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
                "validation-node-templates-move",
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
                "validation-node-templates-move",
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
                "validation-node-templates-move",
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
                "validation-node-templates-move",
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
                "validation-node-templates-move",
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
                "validation-node-templates-move",
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
                "validation-node-templates-move",
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

        with self.assertNumQueries(2):
            res = self.client.put(
                reverse(
                    "validation-node-templates-move",
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


class ValidationNodeTemplateAPIUpdateTestCase(BaseApiTestCase):
    def setUp(self):
        self.account = Account.objects.create(name="account")
        self.project = Project.objects.create(name="project", account=self.account)
        self.account_2 = Account.objects.create(name="account_2")

        self.group = Group.objects.create(name="Group")
        self.other_group = Group.objects.create(name="Group 2")
        self.user_role = UserRole.objects.create(group=self.group, account=self.account)

        self.other_user_role = UserRole.objects.create(group=self.other_group, account=self.account_2)

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
        self.node = ValidationNodeTemplate.objects.create(name="First node", workflow=self.validation_workflow)

    def test_happy_flow(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.put(
            reverse(
                "validation-node-templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            ),
            data={
                "name": "test",
                "description": "desc",
                "color": "#ffffff",
                "canSkipPreviousNodes": True,
                "rolesRequired": [self.user_role.pk],
            },
        )

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertEqual(res_data, {"slug": "test"})

        # check in db
        self.node.refresh_from_db()

        self.assertEqual(self.node.name, "test")
        self.assertEqual(self.node.slug, "test")
        self.assertEqual(self.node.description, "desc")
        self.assertEqual(self.node.color, "#FFFFFF")
        self.assertTrue(self.node.can_skip_previous_nodes)
        self.assertEqual(list(self.node.roles_required.all()), [self.user_role])

    def test_permissions(self):
        res = self.client.put(
            reverse(
                "validation-node-templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.put(
            reverse(
                "validation-node-templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.put(
            reverse(
                "validation-node-templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validation(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.put(
            reverse(
                "validation-node-templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            )
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(res_data, "name", "This field is required.")

        res = self.client.put(
            reverse(
                "validation-node-templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            ),
            data={"name": "test", "rolesRequired": [1111]},
        )

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(res_data, "rolesRequired", 'Invalid pk "1111" - object does not exist.')

        res = self.client.put(
            reverse(
                "validation-node-templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            ),
            data={"name": "test", "rolesRequired": [self.other_user_role.pk]},
        )

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(
            res_data, "rolesRequired", f'Invalid pk "{self.other_user_role.pk}" - object does not exist.'
        )

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(2):
            res = self.client.put(
                reverse(
                    "validation-node-templates-detail",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
                ),
                data={"name": "test", "rolesRequired": [self.user_role.pk]},
            )

            self.assertJSONResponse(res, status.HTTP_200_OK)


class ValidationTemplateAPIPartialUpdateTestCase(BaseApiTestCase):
    def setUp(self):
        self.account = Account.objects.create(name="account")
        self.project = Project.objects.create(name="project", account=self.account)
        self.account_2 = Account.objects.create(name="account_2")

        self.group = Group.objects.create(name="Group")
        self.user_role = UserRole.objects.create(group=self.group, account=self.account)

        self.other_user_role = UserRole.objects.create(group=self.group, account=self.account_2)

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

    def test_happy_flow(self):
        self.fail()

    def test_permissions(self):
        self.fail()

    def test_validation(self):
        self.fail()

    def test_num_queries(self):
        self.fail()
