from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Project, UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.tests.api.validation_workflows_node_templates.test_views.common import BaseApiTestCase


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
                "validation_node_templates-detail",
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
        self.assertEqual(res_data, {"slug": "first-node"})

        # check in db
        self.node.refresh_from_db()

        self.assertEqual(self.node.name, "test")
        self.assertEqual(self.node.slug, "first-node")
        self.assertEqual(self.node.description, "desc")
        self.assertEqual(self.node.color, "#FFFFFF")
        self.assertTrue(self.node.can_skip_previous_nodes)
        self.assertEqual(list(self.node.roles_required.all()), [self.user_role])

    def test_permissions(self):
        res = self.client.put(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.put(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.put(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validation(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.put(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            )
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(res_data, "name", "This field is required.")

        res = self.client.put(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
            ),
            data={"name": "test", "rolesRequired": [1111]},
        )

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(res_data, "rolesRequired", 'Invalid pk "1111" - object does not exist.')

        res = self.client.put(
            reverse(
                "validation_node_templates-detail",
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
        with self.assertNumQueries(8):
            res = self.client.put(
                reverse(
                    "validation_node_templates-detail",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.node.slug},
                ),
                data={"name": "test", "rolesRequired": [self.user_role.pk]},
            )

            self.assertJSONResponse(res, status.HTTP_200_OK)
