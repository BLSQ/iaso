from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Form, Instance, Project, ValidationWorkflow
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.tests.api.validation_workflows.test_views.common import BaseValidationWorkflowAPITestCase


class ValidationWorkflowAPICreateTestCase(BaseValidationWorkflowAPITestCase):
    def setUp(self):
        self.account = Account.objects.create(name="account")
        self.project = Project.objects.create(name="project", account=self.account)
        self.account_2 = Account.objects.create(name="account_2")
        self.enable_validation_workflow_feature_flag(self.account, self.account_2)

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
        (
            self.account_without_feature_flag,
            self.user_without_feature_flag,
            self.validation_workflow_without_feature_flag,
        ) = self.create_no_feature_flag_data()

    def test_validation(self):
        self.client.force_authenticate(self.john_wick)

        with self.subTest("name is required"):
            res = self.client.post(reverse("validation_workflows-list"), data={})
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

            self.assertHasError(res_data, "name", "This field is required.")

        with self.subTest("forms that don't belong to account should raise an error"):
            res = self.client.post(reverse("validation_workflows-list"), data={"forms": [self.form_3.pk]})
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data, "forms", f'Invalid pk "{self.form_3.pk}" - object does not exist.')

    def test_happy_flow(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse("validation_workflows-list"),
            data={
                "name": "Validation workflow",
                "description": "Some description",
                "forms": [self.form.pk, self.form_2.pk],
            },
        )
        res_data = self.assertJSONResponse(res, status.HTTP_201_CREATED)
        self.assertEqual(
            res_data,
            {
                "slug": "validation-workflow",
            },
        )

        validation_workflow = ValidationWorkflow.objects.get(slug="validation-workflow")
        self.assertEqual(validation_workflow.description, "Some description")
        self.assertEqual(validation_workflow.name, "Validation workflow")
        self.assertEqual(validation_workflow.account, self.account)
        self.assertEqual(validation_workflow.created_by, self.john_wick)
        self.assertCountEqual(
            list(validation_workflow.form_set.values_list("pk", flat=True)), [self.form.pk, self.form_2.pk]
        )

    def test_permissions(self):
        res = self.client.post(reverse("validation_workflows-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)

        res = self.client.post(reverse("validation_workflows-list"))
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)

        res = self.client.post(reverse("validation_workflows-list"))
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.user_without_feature_flag)
        res = self.client.post(reverse("validation_workflows-list"))
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(10):
            res = self.client.post(
                reverse("validation_workflows-list"),
                data={
                    "name": "Validation workflow",
                    "description": "Some description",
                    "forms": [self.form.pk, self.form_2.pk],
                },
            )
            res_data = self.assertJSONResponse(res, status.HTTP_201_CREATED)
            self.assertEqual(
                res_data,
                {
                    "slug": "validation-workflow",
                },
            )
