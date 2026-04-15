from django.urls import reverse
from rest_framework import status

from iaso.models import Account, ValidationWorkflow
from iaso.tests.api.validation_workflows.test_views.common import BaseValidationWorkflowAPITestCase


class ValidationWorkflowAPIPartialUpdateTestCase(BaseValidationWorkflowAPITestCase):
    def setUp(self):
        super().setUp()

        self.validation_workflow = ValidationWorkflow.objects.create(
            name="Random name",
            description="Random description",
            created_by=self.john_doe,
            account=self.account,
        )

    def test_permissions(self):
        res = self.client.patch(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.patch(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.patch(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.client.force_authenticate(self.superuser)
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

    def test_partial_update_as_superuser(self):
        self.base_test_partial_update(self.superuser)

    def test_partial_update(self):
        self.base_test_partial_update(self.john_wick)

    def base_test_partial_update(self, user):
        self.client.force_authenticate(user)
        res = self.client.patch(
            reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}),
            data={"name": "Random new name", "description": "Random new description"},
        )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.validation_workflow.refresh_from_db()

        self.assertEqual(self.validation_workflow.description, "Random new description")
        self.assertEqual(self.validation_workflow.name, "Random new name")
        self.assertEqual(self.validation_workflow.slug, "random-name")
        self.assertEqual(self.validation_workflow.account, self.account)
        self.assertEqual(self.validation_workflow.updated_by, user)

        self.assertEqual(
            res_data,
            {
                "slug": "random-name",
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
        self.assertEqual(self.validation_workflow.slug, "random-name")
        self.assertEqual(self.validation_workflow.account, self.account)
        self.assertEqual(self.validation_workflow.updated_by, user)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(7):
            res = self.client.patch(
                reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}),
                data={"name": "Random new name", "description": "Random new description"},
            )
            self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_uniqueness_validators(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.patch(
            reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}),
            data={"name": self.validation_workflow.name, "description": "Random new description"},
        )
        self.assertJSONResponse(res, status.HTTP_200_OK)

        validation_workflow = ValidationWorkflow.objects.create(name="Random new name", account=self.account)

        res = self.client.patch(
            reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}),
            data={"name": validation_workflow.name, "description": "Random new description"},
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(res_data, "name", "This field must be unique.")

        validation_workflow.delete()
        self.assertIsNotNone(validation_workflow.deleted_at)

        res = self.client.patch(
            reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}),
            data={"name": validation_workflow.name, "description": "Random new description"},
        )
        self.assertJSONResponse(res, status.HTTP_200_OK)

        # create a workflow that belongs to another account
        other_account_validation_workflow = ValidationWorkflow.objects.create(
            name="Random new name 2", account=Account.objects.create(name="random account")
        )

        self.validation_workflow.refresh_from_db()
        res = self.client.patch(
            reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}),
            data={"name": other_account_validation_workflow.name, "description": "Random new description"},
        )
        self.assertJSONResponse(res, status.HTTP_200_OK)
