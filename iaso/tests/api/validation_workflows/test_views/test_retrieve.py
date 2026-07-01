from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Form, Instance, Project, UserRole
from iaso.services.validation_workflows import ValidationWorkflowService
from iaso.test import SwaggerTestCaseMixin
from iaso.tests.api.validation_workflows.test_views.common import BaseValidationWorkflowAPITestCase


class ValidationWorkflowAPIRetrieveTestCase(SwaggerTestCaseMixin, BaseValidationWorkflowAPITestCase):
    def setUp(self):
        super().setUp()
        self.project = Project.objects.create(name="project", account=self.account)
        self.account_2 = Account.objects.create(name="account_2")
        self.add_validation_workflow_module(self.account, self.account_2)

        self.group = Group.objects.create(name=f"{self.account.id}_Group")
        self.user_role = UserRole.objects.create(group=self.group, account=self.account)

        self.form = Form.objects.create(name="form")
        self.form.projects.add(self.project)
        self.form.save()

        self.instance = Instance.objects.create(name="instance", form=self.form)
        self.instance_2 = Instance.objects.create(name="instance2", form=self.form)

        self.form_2 = Form.objects.create(name="form_2")
        self.form_2.projects.add(self.project)
        self.form_2.save()

        self.form_3 = Form.objects.create(name="form_3")

        self.validation_workflow_other_account = ValidationWorkflowService.create_validation_workflow(
            name="Random other name",
            description="Random description",
            user=self.john_doe,
            account=self.account_2,
        )

        self.validation_workflow = ValidationWorkflowService.create_validation_workflow(
            name="Random name",
            description="Random description",
            user=self.john_doe,
            account=self.account,
        )
        ValidationWorkflowService.create_new_version(validation_workflow=self.validation_workflow, user=self.john_doe)
        self.validation_workflow.form_set.set([self.form, self.form_2])
        self.validation_workflow.save()

    def assertValidRetrieveData(self, data):
        self.assertResponseCompliantToSwagger(data, "ValidationWorkflowRetrieve")

    def test_permissions(self):
        res = self.client.get(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.client.force_authenticate(self.superuser)
        res = self.client.get(reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.client.force_authenticate(self.user_without_feature_flag)
        res = self.client.get(
            reverse(
                "validation_workflows-detail", kwargs={"slug": self.base_validation_workflow_without_feature_flag.slug}
            )
        )
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

    def test_404(self):
        self.client.force_authenticate(self.john_wick)

        with self.subTest("fetching wrong pk"):
            res = self.client.get(reverse("validation_workflows-detail", kwargs={"slug": "wrong-slug"}))
            self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        with self.subTest("fetching validation workflow that doesn't belong to account"):
            res = self.client.get(
                reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow_other_account.slug})
            )
            self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve(self):
        for user in [self.john_wick, self.superuser]:
            with self.subTest(f"with user {user}"):
                self.client.force_authenticate(user)
                res = self.client.get(
                    reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug})
                )
                res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
                self.assertValidRetrieveData(res_data)

                # checking main keys
                with self.subTest("Checking main top level keys"):
                    for k in [
                        "name",
                        "slug",
                        "description",
                        "forms",
                        "created_by",
                        "created_at",
                        "updated_by",
                        "updated_at",
                        "versions",
                    ]:
                        self.assertIn(k, res_data)

                    print(res_data)
                    self.assertEqual(res_data["name"], "Random name")
                    self.assertEqual(res_data["slug"], "random-name")
                    self.assertEqual(res_data["description"], "Random description")
                    self.assertEqual(res_data["created_by"], self.john_doe.get_full_name())
                    self.assertEqual(res_data["updated_by"], self.john_doe.get_full_name())
                    self.assertIsNotNone(res_data["created_at"])
                    self.assertIsNotNone(res_data["updated_at"])

                    self.assertIsNotNone(res_data["versions"])

                with self.subTest("checking forms"):
                    for form_value in res_data["forms"]:
                        self.assertIn("id", form_value)
                        self.assertIn("label", form_value)
                    self.assertCountEqual(
                        res_data["forms"],
                        [
                            {"id": self.form.pk, "label": self.form.name},
                            {"id": self.form_2.pk, "label": self.form_2.name},
                        ],
                    )

                with self.subTest("checking versions"):
                    self.assertCountEqual(
                        res_data["versions"],
                        ["1.0.0", "2.0.0"],
                    )

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(6):
            res = self.client.get(
                reverse("validation_workflows-detail", kwargs={"slug": self.validation_workflow.slug})
            )
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidRetrieveData(res_data)
