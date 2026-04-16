from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Project, UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.tests.api.validation_workflows_node_templates.test_views.common import BaseApiTestCase


class ValidationTemplateAPIPartialUpdateTestCase(BaseApiTestCase):
    def setUp(self):
        super().setUp()
        self.project = Project.objects.create(name="project", account=self.account)
        self.account_2 = Account.objects.create(name="account_2")
        self.enable_validation_workflow_feature_flag(self.account, self.account_2)

        self.group = Group.objects.create(name="Group")
        self.other_group = Group.objects.create(name="Group 2")
        self.user_role = UserRole.objects.create(group=self.group, account=self.account)

        self.other_user_role = UserRole.objects.create(group=self.other_group, account=self.account_2)

        self.other_validation_workflow = ValidationWorkflow.objects.create(
            name="Random other name 2",
            description="Random description",
            created_by=self.john_doe,
            account=self.account_2,
        )
        (
            self.account_without_feature_flag,
            self.user_without_feature_flag,
            self.validation_workflow_without_feature_flag,
            self.node_without_feature_flag,
        ) = self.create_no_feature_flag_data()

        self.other_node = ValidationNodeTemplate.objects.create(
            name="First node 2", workflow=self.other_validation_workflow
        )

        self.validation_workflow = ValidationWorkflow.objects.create(
            name="Random other name",
            description="Random description",
            created_by=self.john_doe,
            account=self.account,
        )

        # create some nodes
        self.node = ValidationNodeTemplate.objects.create(
            name="First node",
            workflow=self.validation_workflow,
            description="some node",
            color="#ffffff",
            can_skip_previous_nodes=True,
        )

    def test_check_validation_workflow_parent_slug_access(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.patch(
            reverse(
                "validation_node_templates-detail",
                kwargs={
                    "parent_lookup_workflow__slug": self.other_validation_workflow.slug,
                    "slug": self.other_node.slug,
                },
            ),
            data={"name": "test"},
        )
        self.assertJSONResponse(res, status.HTTP_404_NOT_FOUND)

    def test_happy_flow(self):
        self.base_test_happy_flow(self.john_wick)

    def test_happy_flow_as_superuser(self):
        self.base_test_happy_flow(self.superuser)

    def base_test_happy_flow(self, user):
        self.client.force_authenticate(user)
        res = self.client.patch(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            ),
            data={"name": "test", "roles_required": [self.user_role.pk]},
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertEqual(res_data, {"slug": "first-node"})

        # check db
        self.node.refresh_from_db()

        self.assertEqual(self.node.slug, "first-node")
        self.assertEqual(self.node.name, "test")
        self.assertEqual(self.node.description, "some node")
        self.assertEqual(self.node.color, "#FFFFFF")
        self.assertTrue(self.node.can_skip_previous_nodes)
        self.assertEqual(list(self.node.roles_required.all()), [self.user_role])

    def test_permissions(self):
        res = self.client.patch(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.patch(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.patch(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(self.superuser)
        res = self.client.patch(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(self.user_without_feature_flag)
        res = self.client.patch(
            reverse(
                "validation_node_templates-detail",
                kwargs={
                    "parent_lookup_workflow__slug": self.validation_workflow_without_feature_flag.slug,
                    "slug": self.node_without_feature_flag.slug,
                },
            )
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_validation(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.patch(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        with self.subTest("name"):
            res = self.client.patch(
                reverse(
                    "validation_node_templates-detail",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
                ),
                data={"name": ""},
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data, "name", "This field may not be blank.")

            res = self.client.patch(
                reverse(
                    "validation_node_templates-detail",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
                ),
                data={"name": None},
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data, "name", "This field may not be null.")

        with self.subTest("roles_required"):
            res = self.client.patch(
                reverse(
                    "validation_node_templates-detail",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
                ),
                data={"name": "test", "roles_required": [1111]},
            )

            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

            self.assertHasError(res_data, "roles_required", 'Invalid pk "1111" - object does not exist.')

            res = self.client.patch(
                reverse(
                    "validation_node_templates-detail",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
                ),
                data={"name": "test", "roles_required": [self.other_user_role.pk]},
            )

            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

            self.assertHasError(
                res_data, "roles_required", f'Invalid pk "{self.other_user_role.pk}" - object does not exist.'
            )

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(10):
            res = self.client.patch(
                reverse(
                    "validation_node_templates-detail",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
                ),
                data={"name": "test", "roles_required": [self.user_role.pk]},
            )
            self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_uniqueness_validator(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.patch(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            ),
            data={"name": self.node.name, "roles_required": [self.user_role.pk]},
        )
        self.assertJSONResponse(res, status.HTTP_200_OK)

        # create another node
        second_node = ValidationNodeTemplate.objects.create(name="second node", workflow=self.validation_workflow)

        res = self.client.patch(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            ),
            data={"name": second_node.name, "roles_required": [self.user_role.pk]},
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(res_data, "name", "This field must be unique.")

        # try to update to a node name from another account
        res = self.client.patch(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            ),
            data={"name": self.other_node.name, "roles_required": [self.user_role.pk]},
        )

        self.assertJSONResponse(res, status.HTTP_200_OK)
