from django.urls import reverse
from rest_framework import status

from iaso.models import ValidationWorkflow
from iaso.tests.api.validation_workflows.test_views.common import BaseValidationWorkflowAPITestCase


class ValidationWorkflowAPIDeleteTestCase(BaseValidationWorkflowAPITestCase):
    def setUp(self):
        super().setUp()
        self.validation_workflow = ValidationWorkflow.objects.create(
            name="Name 1",
            account=self.account,
            description="description",
            created_by=self.john_doe,
            updated_by=self.john_wick,
        )

    def base_test_perform_delete(self, user):
        self.client.force_authenticate(user)
        res = self.client.delete(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

        self.assertEqual(ValidationWorkflow.objects.all().count(), 0)

    def test_perform_delete(self):
        self.base_test_perform_delete(self.john_wick)

    def test_perform_delete_as_superuser(self):
        self.base_test_perform_delete(self.superuser)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(5):
            res = self.client.delete(
                reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug})
            )
            self.assertJSONResponse(res, 204)

    def test_permissions(self):
        res = self.client.delete(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.delete(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.delete(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)

    def test_permissions_as_superuser(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.delete(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_204_NO_CONTENT)
