from django.urls import reverse
from rest_framework import status

from iaso.models import Account, ValidationWorkflow
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.tests.api.validation_workflows.test_views.common import BaseValidationWorkflowAPITestCase


class ValidationWorkflowAPIPartialUpdateTestCase(BaseValidationWorkflowAPITestCase):
    def setUp(self):
        self.account = Account.objects.create(name="account")
        self.enable_validation_workflow_feature_flag(self.account)

        self.john_doe = self.create_user_with_profile(
            username="john.doe", account=self.account, first_name="John", last_name="Doe"
        )

        self.john_wick = self.create_user_with_profile(
            username="john.wick", account=self.account, permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION]
        )

        self.validation_workflow = ValidationWorkflow.objects.create(
            name="Random name",
            description="Random description",
            created_by=self.john_doe,
            account=self.account,
        )
        (
            self.account_without_feature_flag,
            self.user_without_feature_flag,
            self.validation_workflow_without_feature_flag,
        ) = self.create_no_feature_flag_data()

    def test_permissions(self):
        res = self.client.patch(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.patch(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.patch(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.client.force_authenticate(self.user_without_feature_flag)
        res = self.client.patch(
            reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow_without_feature_flag.slug})
        )
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

    def test_validation(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.patch(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

        res = self.client.patch(
            reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}),
            data={"name": ""},
        )

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "name", "This field may not be blank.")

        res = self.client.patch(
            reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}),
            data={"name": None},
        )

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "name", "This field may not be null.")

    def test_partial_update(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.patch(
            reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}),
            data={"name": "Random new name", "description": "Random new description"},
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.validation_workflow.refresh_from_db()

        self.assertEqual(self.validation_workflow.description, "Random new description")
        self.assertEqual(self.validation_workflow.name, "Random new name")
        self.assertEqual(self.validation_workflow.slug, "random-new-name")
        self.assertEqual(self.validation_workflow.account, self.account)
        self.assertEqual(self.validation_workflow.updated_by, self.john_wick)

        self.assertEqual(
            res_data,
            {
                "slug": "random-new-name",
            },
        )

        res = self.client.patch(
            reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}),
            data={
                "name": "Random new name 2",
            },
        )

        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.validation_workflow.refresh_from_db()

        self.assertEqual(self.validation_workflow.description, "Random new description")
        self.assertEqual(self.validation_workflow.name, "Random new name 2")
        self.assertEqual(self.validation_workflow.slug, "random-new-name-2")
        self.assertEqual(self.validation_workflow.account, self.account)
        self.assertEqual(self.validation_workflow.updated_by, self.john_wick)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(6):
            res = self.client.patch(
                reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}),
                data={"name": "Random new name", "description": "Random new description"},
            )
            self.assertJSONResponse(res, status.HTTP_200_OK)
