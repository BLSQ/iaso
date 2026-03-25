from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Project, UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.tests.api.validation_workflows_node_templates.test_views.common import BaseApiTestCase


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

        self.other_validation_workflow = ValidationWorkflow.objects.create(
            name="Random other name 2",
            description="Random description",
            created_by=self.john_doe,
            account=self.account_2,
        )

        self.other_node = ValidationNodeTemplate.objects.create(
            name="Other node", workflow=self.other_validation_workflow
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
                "validation_node_templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            )
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(
            reverse(
                "validation_node_templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            )
        )
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(
            reverse(
                "validation_node_templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            )
        )
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_check_validation_workflow_parent_slug_access(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(
            reverse(
                "validation_node_templates-list",
                kwargs={"parent_lookup_workflow__slug": self.other_validation_workflow.slug},
            )
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidListData(list_data=res_data, results_key="results", expected_length=0)

    def test_number_queries(self):
        self.client.force_authenticate(self.john_wick)

        with self.assertNumQueries(5):
            res = self.client.get(
                reverse(
                    "validation_node_templates-list",
                    kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug},
                )
            )
            self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_happy_flow(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.get(
            reverse(
                "validation_node_templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
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
                "validation_node_templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            )
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidListData(list_data=res_data, results_key="results", expected_length=3)

        self.client.force_authenticate(self.john_wick)

        res = self.client.get(
            reverse(
                "validation_node_templates-list", kwargs={"parent_lookup_workflow__slug": self.validation_workflow.slug}
            ),
            data={"limit": 1},
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidListData(list_data=res_data, results_key="results", expected_length=1)
