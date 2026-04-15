from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings

from iaso.models import Account, Form, Instance, Project, ValidationWorkflow
from iaso.tests.api.validation_workflows.test_views.common import BaseValidationWorkflowAPITestCase


class ValidationWorkflowAPICreateTestCase(BaseValidationWorkflowAPITestCase):
    def setUp(self):
        super().setUp()

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

    def test_uniqueness_validators(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse("validation_workflows-list"),
            data={
                "name": "Validation workflow",
                "description": "Some description",
                "forms": [self.form.pk, self.form_2.pk],
            },
        )
        self.assertJSONResponse(res, status.HTTP_201_CREATED)

        res = self.client.post(
            reverse("validation_workflows-list"),
            data={
                "name": "Validation workflow",
                "description": "Some description",
                "forms": [self.form.pk, self.form_2.pk],
            },
        )

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data, api_settings.NON_FIELD_ERRORS_KEY, "The fields name, account must make a unique set."
        )

        vf = ValidationWorkflow.objects.get(slug="validation-workflow")
        vf.delete()

        vf.refresh_from_db()
        self.assertIsNotNone(vf.deleted_at)

        res = self.client.post(
            reverse("validation_workflows-list"),
            data={
                "name": "Validation workflow",
                "description": "Some description",
                "forms": [self.form.pk, self.form_2.pk],
            },
        )

        res_data = self.assertJSONResponse(res, status.HTTP_201_CREATED)

        self.assertEqual(res_data["slug"], vf.slug)

        # create workflow with same name from another account
        vf = ValidationWorkflow.objects.create(name="other-account", account=self.account_2)

        res = self.client.post(
            reverse("validation_workflows-list"),
            data={
                "name": vf.name,
                "description": "Some description",
                "forms": [self.form.pk, self.form_2.pk],
            },
        )

        self.assertJSONResponse(res, status.HTTP_201_CREATED)

    def test_happy_flow(self):
        self.base_test_happy_flow(self.john_wick)

    def base_test_happy_flow(self, user):
        self.client.force_authenticate(user)
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
        self.assertEqual(validation_workflow.created_by, user)
        self.assertCountEqual(
            list(validation_workflow.form_set.values_list("pk", flat=True)), [self.form.pk, self.form_2.pk]
        )

    def test_happy_flow_as_superuser(self):
        self.base_test_happy_flow(self.superuser)

    def test_permissions(self):
        res = self.client.post(reverse("validation_workflows-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)

        res = self.client.post(reverse("validation_workflows-list"))
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)

        res = self.client.post(reverse("validation_workflows-list"))
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.superuser)

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
