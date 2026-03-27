from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings

from iaso.models import Account, Project, UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.tests.api.validation_workflows_node_templates.test_views.common import BaseApiTestCase


class ValidationNodeTemplateAPIBulkUpdateTestCase(BaseApiTestCase):
    def setUp(self):
        super().setUp()
        self.project = Project.objects.create(name="project", account=self.account)
        self.account_2 = Account.objects.create(name="account_2")

        self.group = Group.objects.create(name="Group")
        self.other_group = Group.objects.create(name="Group 2")
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
            account=self.account_2,
        )

        self.other_node = ValidationNodeTemplate.objects.create(
            name="other node", description="other node description", workflow=self.other_validation_workflow
        )

        # create some nodes
        self.first_node = ValidationNodeTemplate.objects.create(
            name="First node", workflow=self.validation_workflow, description="first node desc", color="#ffffff"
        )
        self.second_node = ValidationNodeTemplate.objects.create(
            name="Second node",
            workflow=self.validation_workflow,
            color="#ffffff",
            description="some description",
            can_skip_previous_nodes=True,
        )
        self.third_node = ValidationNodeTemplate.objects.create(
            name="Third node", workflow=self.validation_workflow, description="third node desc", color="#ffffff"
        )
        self.second_node.previous_node_templates.add(self.first_node)
        self.second_node.next_node_templates.add(self.third_node)
        self.second_node.roles_required.add(self.user_role)

        self.other_user_role = UserRole.objects.create(group=self.other_group, account=self.account_2)

    def test_check_validation_workflow_parent_slug_access(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.put(
            reverse(
                "validation_node_templates-bulk",
                kwargs={"parent_lookup_workflow__slug": self.other_validation_workflow.slug},
            ),
            data=[
                {"slug": self.third_node.slug, "name": "new first node", "rolesRequired": [self.user_role.pk]},
                {"slug": self.first_node.slug, "name": "new second node", "canSkipPreviousNodes": True},
                {
                    "slug": self.second_node.slug,
                    "name": "new third node",
                    "description": "some description",
                    "color": "#ebebeb",
                },
            ],
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data,
            self.snake_case_to_camel_case(api_settings.NON_FIELD_ERRORS_KEY),
            "The slugs provided don't match the existing ones",
        )

        res = self.client.put(
            reverse(
                "validation_node_templates-bulk",
                kwargs={"parent_lookup_workflow__slug": self.other_validation_workflow.slug},
            ),
            data=[{"slug": self.other_node.slug, "name": "new first node"}],
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data,
            self.snake_case_to_camel_case(api_settings.NON_FIELD_ERRORS_KEY),
            "The slugs provided don't match the existing ones",
        )

    def test_uniqueness_of_slug(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.put(
            reverse(
                "validation_node_templates-bulk",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            ),
            data=[
                {"slug": self.third_node.slug, "name": "New first node", "rolesRequired": [self.user_role.pk]},
                {"slug": self.first_node.slug, "name": "New-first-node", "canSkipPreviousNodes": True},
                {
                    "slug": self.second_node.slug,
                    "name": "new third node",
                    "description": "some description",
                    "color": "#ebebeb",
                },
            ],
        )

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertEqual(res_data, [{"slug": "third-node"}, {"slug": "first-node"}, {"slug": "second-node"}])

    def test_happy_flow(self):
        self.base_test_happy_flow(self.john_wick)

    def test_happy_flow_as_superuser(self):
        self.base_test_happy_flow(self.superuser)

    def base_test_happy_flow(self, user):
        self.client.force_authenticate(user)
        res = self.client.put(
            reverse(
                "validation_node_templates-bulk",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            ),
            data=[
                {"slug": self.third_node.slug, "name": "new first node", "rolesRequired": [self.user_role.pk]},
                {"slug": self.first_node.slug, "name": "new second node", "canSkipPreviousNodes": True},
                {
                    "slug": self.second_node.slug,
                    "name": "new third node",
                    "description": "some description",
                    "color": "#ebebeb",
                },
            ],
        )

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertEqual(res_data, [{"slug": "third-node"}, {"slug": "first-node"}, {"slug": "second-node"}])

        # check db
        self.assertEqual(self.validation_workflow.dump_nodes(), ["third-node", "first-node", "second-node"])

        self.third_node.refresh_from_db()

        self.assertEqual(self.third_node.slug, "third-node")
        self.assertEqual(self.third_node.name, "new first node")
        self.assertEqual(self.third_node.description, "third node desc")
        self.assertEqual(list(self.third_node.roles_required.all()), [self.user_role])
        self.assertEqual(self.third_node.color, "#FFFFFF")
        self.assertFalse(self.third_node.can_skip_previous_nodes)

        self.second_node.refresh_from_db()

        self.assertEqual(self.second_node.slug, "second-node")
        self.assertEqual(self.second_node.name, "new third node")
        self.assertEqual(self.second_node.description, "some description")
        self.assertEqual(list(self.second_node.roles_required.all()), [self.user_role])
        self.assertEqual(self.second_node.color, "#EBEBEB")
        self.assertTrue(self.second_node.can_skip_previous_nodes)

        self.first_node.refresh_from_db()

        self.assertEqual(self.first_node.slug, "first-node")
        self.assertEqual(self.first_node.name, "new second node")
        self.assertEqual(self.first_node.description, "first node desc")
        self.assertEqual(list(self.first_node.roles_required.all()), [])
        self.assertEqual(self.first_node.color, "#FFFFFF")
        self.assertTrue(self.first_node.can_skip_previous_nodes)

    def test_permissions(self):
        res = self.client.put(
            reverse(
                "validation_node_templates-bulk",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.put(
            reverse(
                "validation_node_templates-bulk",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.put(
            reverse(
                "validation_node_templates-bulk",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.superuser)
        res = self.client.put(
            reverse(
                "validation_node_templates-bulk",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validation(self):
        self.client.force_authenticate(self.john_wick)

        with self.subTest("Validate list"):
            self.client.force_authenticate(self.john_wick)
            res = self.client.put(
                reverse(
                    "validation_node_templates-bulk",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                )
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(
                res_data,
                self.snake_case_to_camel_case(api_settings.NON_FIELD_ERRORS_KEY),
                'Expected a list of items but got type "dict".',
            )

            self.client.force_authenticate(self.john_wick)
            res = self.client.put(
                reverse(
                    "validation_node_templates-bulk",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data=[],
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(
                res_data,
                self.snake_case_to_camel_case(api_settings.NON_FIELD_ERRORS_KEY),
                "This list may not be empty.",
            )

            res = self.client.put(
                reverse(
                    "validation_node_templates-bulk",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data=[
                    {"slug": "wrong-slug", "name": "new name"},
                    {"slug": "wrong-slug-2", "name": "new name"},
                    {"slug": "wrong-slug-3", "name": "new name"},
                ],
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(
                res_data,
                self.snake_case_to_camel_case(api_settings.NON_FIELD_ERRORS_KEY),
                "The slugs provided don't match the existing ones",
            )

            res = self.client.put(
                reverse(
                    "validation_node_templates-bulk",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data=[
                    {"name": "new-name", "slug": self.third_node.slug},
                    {"name": "new name", "slug": self.second_node.slug},
                    {"name": "new-name", "slug": self.second_node.slug},
                ],
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(
                res_data, self.snake_case_to_camel_case(api_settings.NON_FIELD_ERRORS_KEY), "Duplicate slugs provided."
            )

        with self.subTest("Validate items : name"):
            res = self.client.put(
                reverse(
                    "validation_node_templates-bulk",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data=[
                    {"name": "", "slug": self.third_node.slug},
                    {"name": "", "slug": self.second_node.slug},
                    {"name": "", "slug": self.first_node.slug},
                ],
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            for error in res_data:
                self.assertHasError(error, "name", "This field may not be blank.")

            res = self.client.put(
                reverse(
                    "validation_node_templates-bulk",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data=[
                    {"name": None, "slug": self.third_node.slug},
                    {"name": None, "slug": self.second_node.slug},
                    {"name": None, "slug": self.first_node.slug},
                ],
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            for error in res_data:
                self.assertHasError(error, "name", "This field may not be null.")

            res = self.client.put(
                reverse(
                    "validation_node_templates-bulk",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data=[{"slug": self.third_node.slug}, {"slug": self.second_node.slug}, {"slug": self.first_node.slug}],
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            for error in res_data:
                self.assertHasError(error, "name", "This field is required.")

        with self.subTest("Validate items : roles required"):
            res = self.client.put(
                reverse(
                    "validation_node_templates-bulk",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data=[
                    {"slug": self.first_node.slug, "name": "test", "rolesRequired": [1111]},
                    {"slug": self.second_node.slug, "name": "test", "rolesRequired": [1111]},
                    {"slug": self.third_node.slug, "name": "test", "rolesRequired": [1111]},
                ],
            )

            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            for error in res_data:
                self.assertHasError(error, "rolesRequired", 'Invalid pk "1111" - object does not exist.')

            res = self.client.put(
                reverse(
                    "validation_node_templates-bulk",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data=[
                    {"slug": self.first_node.slug, "name": "test", "rolesRequired": [self.other_user_role.pk]},
                    {"slug": self.second_node.slug, "name": "test", "rolesRequired": [self.other_user_role.pk]},
                    {"slug": self.third_node.slug, "name": "test", "rolesRequired": [self.other_user_role.pk]},
                ],
            )

            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            for error in res_data:
                self.assertHasError(
                    error, "rolesRequired", f'Invalid pk "{self.other_user_role.pk}" - object does not exist.'
                )

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(12):
            res = self.client.put(
                reverse(
                    "validation_node_templates-bulk",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                ),
                data=[
                    {"slug": self.third_node.slug, "name": "new first node", "rolesRequired": [self.user_role.pk]},
                    {"slug": self.first_node.slug, "name": "new second node", "canSkipPreviousNodes": True},
                    {
                        "slug": self.second_node.slug,
                        "name": "new third node",
                        "description": "some description",
                        "color": "#ebebeb",
                    },
                ],
            )
            self.assertJSONResponse(res, status.HTTP_200_OK)
