from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Project, UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.tests.api.validation_workflows_node_templates.test_views.common import BaseApiTestCase


class ValidationNodeTemplateAPIDeleteTestCase(BaseApiTestCase):
    def setUp(self):
        self.account = Account.objects.create(name="account")
        self.project = Project.objects.create(name="project", account=self.account)
        self.account_2 = Account.objects.create(name="account_2")
        self.enable_validation_workflow_feature_flag(self.account, self.account_2)

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
        (
            self.account_without_feature_flag,
            self.user_without_feature_flag,
            self.validation_workflow_without_feature_flag,
            self.node_without_feature_flag,
        ) = self.create_no_feature_flag_data()
        self.other_node = ValidationNodeTemplate.objects.create(
            name="Other node", workflow=self.other_validation_workflow
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
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            )
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.delete(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            )
        )
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.delete(
            reverse(
                "validation_node_templates-detail",
                kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug, "slug": self.second_node.slug},
            )
        )
        self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

        self.client.force_authenticate(self.user_without_feature_flag)
        res = self.client.delete(
            reverse(
                "validation_node_templates-detail",
                kwargs={
                    "parent_lookup_workflow__slug": self.validation_workflow_without_feature_flag.slug,
                    "slug": self.node_without_feature_flag.slug,
                },
            )
        )
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(16):
            res = self.client.delete(
                reverse(
                    "validation_node_templates-detail",
                    kwargs={
                        "parent_lookup_workflow__slug": self.validation_workflow.slug,
                        "slug": self.second_node.slug,
                    },
                )
            )
            self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

    def test_check_validation_workflow_parent_slug_access(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.delete(
            reverse(
                "validation_node_templates-detail",
                kwargs={
                    "parent_lookup_workflow__slug": self.other_validation_workflow.slug,
                    "slug": self.other_node.slug,
                },
            )
        )
        self.assertJSONResponse(res, status.HTTP_404_NOT_FOUND)

    def test_happy_flow(self):
        self.client.force_authenticate(self.john_wick)

        second_node_slug = self.second_node.slug
        res = self.client.delete(
            reverse(
                "validation_node_templates-detail",
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
