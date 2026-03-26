from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Form, Instance, Project, ValidationWorkflow
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.tests.api.validation_workflows.test_views.common import BaseValidationWorkflowAPITestCase


class ValidationWorkflowAPIUpdateTestCase(BaseValidationWorkflowAPITestCase):
    def setUp(self):
        self.account = Account.objects.create(name="account")
        self.project = Project.objects.create(name="project", account=self.account)
        self.account_2 = Account.objects.create(name="account_2")

        self.form = Form.objects.create(name="form")
        self.form.projects.add(self.project)
        self.form.save()

        Instance.objects.create(name="instance", form=self.form)
        Instance.objects.create(name="instance2", form=self.form)

        self.form_2 = Form.objects.create(name="form_2")
        self.form_2.projects.add(self.project)
        self.form_2.save()

        self.form_3 = Form.objects.create(name="form_3")

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
        self.validation_workflow.form_set.set([self.form, self.form_2])

    def test_permissions(self):
        res = self.client.put(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.put(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.put(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

    def test_validation(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.put(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "name", "This field is required.")

        res = self.client.put(
            reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}), data={"name": ""}
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "name", "This field may not be blank.")

        res = self.client.put(
            reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}), data={"name": None}
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "name", "This field may not be null.")

    def test_update(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.put(
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
        self.assertCountEqual(
            list(self.validation_workflow.form_set.values_list("pk", flat=True)), [self.form.pk, self.form_2.pk]
        )

        self.assertEqual(
            res_data,
            {
                "slug": "random-new-name",
            },
        )

        res = self.client.put(
            reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}),
            data={"name": "Random new name"},
        )

        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.validation_workflow.refresh_from_db()

        self.assertEqual(self.validation_workflow.description, "Random new description")
        self.assertEqual(self.validation_workflow.name, "Random new name")
        self.assertEqual(self.validation_workflow.slug, "random-new-name")
        self.assertEqual(self.validation_workflow.account, self.account)
        self.assertEqual(self.validation_workflow.updated_by, self.john_wick)
        self.assertCountEqual(
            list(self.validation_workflow.form_set.values_list("pk", flat=True)), [self.form.pk, self.form_2.pk]
        )

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(5):
            res = self.client.put(
                reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}),
                data={"name": "Random new name", "description": "Random new description"},
            )
            self.assertJSONResponse(res, status.HTTP_200_OK)
