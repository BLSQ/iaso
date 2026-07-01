from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Project, UserRole, ValidationNodeTemplate
from iaso.services.validation_workflows import ValidationWorkflowService
from iaso.test import SwaggerTestCaseMixin

from .common import BaseApiTestCase


class ValidationNodeTemplateAPIRetrieveTestCase(SwaggerTestCaseMixin, BaseApiTestCase):
    def setUp(self):
        super().setUp()
        self.project = Project.objects.create(name="project", account=self.account)
        self.account_2 = Account.objects.create(name="account_2")
        self.add_validation_workflow_module(self.account, self.account_2)

        self.group = Group.objects.create(name=f"{self.account.id}_Group")
        self.user_role = UserRole.objects.create(group=self.group, account=self.account)

        (
            self.account_without_feature_flag,
            self.user_without_feature_flag,
            self.validation_workflow_without_feature_flag,
            self.node_without_feature_flag,
        ) = self.create_no_feature_flag_data()

        self.validation_workflow = ValidationWorkflowService.create_validation_workflow(
            name="Random other name",
            description="Random description",
            user=self.john_doe,
            account=self.account,
        )
        self.validation_workflow_version = self.validation_workflow.get_latest_version()

        # create some nodes
        self.first_node = ValidationNodeTemplate.objects.create(
            name="First node", workflow=self.validation_workflow_version
        )
        self.second_node = ValidationNodeTemplate.objects.create(
            name="Second node",
            workflow=self.validation_workflow_version,
            description="some description",
            can_skip_previous_nodes=True,
        )
        self.third_node = ValidationNodeTemplate.objects.create(
            name="Third node", workflow=self.validation_workflow_version
        )
        self.second_node.previous_node_templates.add(self.first_node)
        self.second_node.next_node_templates.add(self.third_node)
        self.second_node.roles_required.add(self.user_role)
        self.other_validation_workflow = ValidationWorkflowService.create_validation_workflow(
            name="Random other name 2",
            description="Random description",
            user=self.john_doe,
            account=self.account_2,
        )
        self.other_validation_workflow_version = self.other_validation_workflow.get_latest_version()

        self.other_node = ValidationNodeTemplate.objects.create(
            name="First node 2", workflow=self.other_validation_workflow_version
        )

    def assertValidData(self, data):
        self.assertResponseCompliantToSwagger(data, "ValidationNodeTemplateRetrieve")

    def test_check_validation_workflow_parent_slug_access(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(
            reverse(
                "nested_validation_node_templates-detail",
                kwargs={
                    "parent_lookup_workflow__slug": self.other_validation_workflow.slug,
                    "parent_lookup_version": self.other_validation_workflow_version.version_as_str,
                    "slug": self.other_node.slug,
                },
            )
        )
        self.assertJSONResponse(res, status.HTTP_404_NOT_FOUND)

    def test_permissions(self):
        res = self.client.get(
            reverse(
                "nested_validation_node_templates-detail",
                kwargs={
                    "parent_lookup_workflow__slug": self.validation_workflow.slug,
                    "parent_lookup_version": self.validation_workflow_version.version_as_str,
                    "slug": self.second_node.slug,
                },
            )
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(
            reverse(
                "nested_validation_node_templates-detail",
                kwargs={
                    "parent_lookup_workflow__slug": self.validation_workflow.slug,
                    "parent_lookup_version": self.validation_workflow_version.version_as_str,
                    "slug": self.second_node.slug,
                },
            )
        )
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(
            reverse(
                "nested_validation_node_templates-detail",
                kwargs={
                    "parent_lookup_workflow__slug": self.validation_workflow.slug,
                    "parent_lookup_version": self.validation_workflow_version.version_as_str,
                    "slug": self.second_node.slug,
                },
            )
        )
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.client.force_authenticate(self.superuser)
        res = self.client.get(
            reverse(
                "nested_validation_node_templates-detail",
                kwargs={
                    "parent_lookup_workflow__slug": self.validation_workflow.slug,
                    "parent_lookup_version": self.validation_workflow_version.version_as_str,
                    "slug": self.second_node.slug,
                },
            )
        )
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.client.force_authenticate(self.user_without_feature_flag)
        res = self.client.get(
            reverse(
                "nested_validation_node_templates-detail",
                kwargs={
                    "parent_lookup_workflow__slug": self.validation_workflow_without_feature_flag.slug,
                    "parent_lookup_version": self.validation_workflow_version.version_as_str,
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
                    "nested_validation_node_templates-detail",
                    kwargs={
                        "parent_lookup_workflow__slug": self.validation_workflow.slug,
                        "parent_lookup_version": self.validation_workflow_version.version_as_str,
                        "slug": self.second_node.slug,
                    },
                )
            )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data)

    def test_number_queries_latest(self):
        self.client.force_authenticate(self.john_wick)

        with self.assertNumQueries(5):
            res = self.client.get(
                reverse(
                    "nested_validation_node_templates-detail",
                    kwargs={
                        "parent_lookup_workflow__slug": self.validation_workflow.slug,
                        "parent_lookup_version": "latest",
                        "slug": self.second_node.slug,
                    },
                )
            )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data)

    def test_happy_flow(self):
        for user in [self.superuser, self.john_wick]:
            with self.subTest(f"with user {user}"):
                for version in ["latest", self.validation_workflow_version.version_as_str]:
                    self.client.force_authenticate(user)

                    res = self.client.get(
                        reverse(
                            "nested_validation_node_templates-detail",
                            kwargs={
                                "parent_lookup_workflow__slug": self.validation_workflow.slug,
                                "parent_lookup_version": version,
                                "slug": self.second_node.slug,
                            },
                        )
                    )
                    res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
                    self.assertValidData(res_data)
                    fields = ["slug", "name", "description", "roles_required", "can_skip_previous_nodes"]

                    for field in fields:
                        self.assertIn(field, res_data)

                    self.assertEqual(res_data["slug"], "second-node")
                    self.assertEqual(res_data["name"], "Second node")
                    self.assertEqual(res_data["description"], "some description")
                    self.assertEqual(res_data["roles_required"], [{"id": self.user_role.pk, "name": "Group"}])
                    self.assertTrue(res_data["can_skip_previous_nodes"])

    def test_exclude_if_validation_workflow_is_soft_deleted(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.get(
            reverse(
                "nested_validation_node_templates-detail",
                kwargs={
                    "parent_lookup_workflow__slug": self.validation_workflow.slug,
                    "parent_lookup_version": self.validation_workflow_version.version_as_str,
                    "slug": self.second_node.slug,
                },
            )
        )
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.validation_workflow.delete()
        self.validation_workflow.refresh_from_db()
        self.assertIsNotNone(self.validation_workflow.deleted_at)
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(
            reverse(
                "nested_validation_node_templates-detail",
                kwargs={
                    "parent_lookup_workflow__slug": self.validation_workflow.slug,
                    "parent_lookup_version": self.validation_workflow_version.version_as_str,
                    "slug": self.second_node.slug,
                },
            )
        )
        self.assertJSONResponse(res, status.HTTP_404_NOT_FOUND)

        self.validation_workflow.restore()
        self.validation_workflow.refresh_from_db()

        self.validation_workflow_version.delete()

        res = self.client.get(
            reverse(
                "nested_validation_node_templates-detail",
                kwargs={
                    "parent_lookup_workflow__slug": self.validation_workflow.slug,
                    "parent_lookup_version": self.validation_workflow_version.version_as_str,
                    "slug": self.second_node.slug,
                },
            )
        )
        self.assertJSONResponse(res, status.HTTP_404_NOT_FOUND)
