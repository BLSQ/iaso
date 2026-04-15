from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Project, UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.tests.api.validation_workflows_node_templates.test_views.common import BaseApiTestCase


class ValidationNodeTemplateAPIRetrieveTestCase(BaseApiTestCase):
    def setUp(self):
        super().setUp()
        self.project = Project.objects.create(name="project", account=self.account)
        self.account_2 = Account.objects.create(name="account_2")
        self.enable_validation_workflow_feature_flag(self.account, self.account_2)

        self.group = Group.objects.create(name="Group")
        self.user_role = UserRole.objects.create(group=self.group, account=self.account)

        (
            self.account_without_feature_flag,
            self.user_without_feature_flag,
            self.validation_workflow_without_feature_flag,
            self.node_without_feature_flag,
        ) = self.create_no_feature_flag_data()

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
        self.other_validation_workflow = ValidationWorkflow.objects.create(
            name="Random other name 2",
            description="Random description",
            created_by=self.john_doe,
            account=self.account_2,
        )

        self.other_node = ValidationNodeTemplate.objects.create(
            name="First node 2", workflow=self.other_validation_workflow
        )

    def test_check_validation_workflow_parent_slug_access(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(
            reverse(
                "validation_node_templates-detail",
                kwargs={
                    "parent_lookup_workflow__slug": self.other_validation_workflow.slug,
                    "slug": self.other_node.slug,
                },
            )
        )
        self.assertJSONResponse(res, status.HTTP_404_NOT_FOUND)

    def test_permissions(self):
        res = self.client.get(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            )
        )
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            )
        )
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.client.force_authenticate(self.superuser)
        res = self.client.get(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            )
        )
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.client.force_authenticate(self.user_without_feature_flag)
        res = self.client.get(
            reverse(
                "validation_node_templates-detail",
                kwargs={
                    "parent_lookup_workflow__slug": self.validation_workflow_without_feature_flag.slug,
                    "slug": self.node_without_feature_flag.slug,
                },
            )
        )
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

    def test_number_queries(self):
        self.client.force_authenticate(self.john_wick)

        with self.assertNumQueries(5):
            res = self.client.get(
                reverse(
                    "validation_node_templates-detail",
                    kwargs={
                        "parent_lookup_workflow__slug": self.validation_workflow.slug,
                        "slug": self.second_node.slug,
                    },
                )
            )
            self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_happy_flow(self):
        for user in [self.superuser, self.john_wick]:
            with self.subTest(f"with user {user}"):
                self.client.force_authenticate(user)

                res = self.client.get(
                    reverse(
                        "validation_node_templates-detail",
                        kwargs={
                            "parent_lookup_workflow__slug": self.validation_workflow.slug,
                            "slug": self.second_node.slug,
                        },
                    )
                )
                res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
                fields = ["slug", "name", "description", "color", "roles_required", "can_skip_previous_nodes"]

                for field in fields:
                    self.assertIn(field, res_data)

                self.assertEqual(res_data["slug"], "second-node")
                self.assertEqual(res_data["name"], "Second node")
                self.assertEqual(res_data["description"], "some description")
                self.assertEqual(res_data["color"], "#FFFFFF")
                self.assertEqual(
                    res_data["roles_required"], [{"id": self.user_role.pk, "name": self.user_role.group.name}]
                )
                self.assertTrue(res_data["can_skip_previous_nodes"])
