from django.urls import reverse
from rest_framework import status

from iaso.models import Account, ValidationWorkflow
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.tests.api.validation_workflows.test_views.common import BaseValidationWorkflowAPITestCase


class ValidationWorkflowAPIDeleteTestCase(BaseValidationWorkflowAPITestCase):
    def setUp(self):
        self.account = Account.objects.create(name="account")
        self.john_doe = self.create_user_with_profile(username="john.doe", account=self.account)

        self.john_wick = self.create_user_with_profile(
            username="john.wick", account=self.account, permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION]
        )

        self.validation_workflow = ValidationWorkflow.objects.create(
            name="Name 1",
            account=self.account,
            description="description",
            created_by=self.john_doe,
            updated_by=self.john_wick,
        )

    def test_perform_delete(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.delete(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, 204)

        self.assertEqual(ValidationWorkflow.objects.all().count(), 0)

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
        self.assertJSONResponse(res, 403)

        self.client.force_authenticate(self.john_wick)
        res = self.client.delete(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, 204)
