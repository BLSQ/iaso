from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Form, Instance, UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.test import SwaggerTestCaseMixin
from iaso.tests.api.validation_workflows.test_views.common import BaseValidationWorkflowAPITestCase


class ValidationWorkflowAPIListTestCase(BaseValidationWorkflowAPITestCase):
    def setUp(self):
        super().setUp()
        self.account_2 = Account.objects.create(name="account_2")
        self.add_validation_workflow_module(self.account, self.account_2)

        self.form = Form.objects.create(name="form")
        Instance.objects.create(name="instance", form=self.form)
        Instance.objects.create(name="instance2", form=self.form)

        self.form_2 = Form.objects.create(name="form_2")
        self.form_3 = Form.objects.create(name="form_3")

        self.vf_pk = None
        for i in range(15):
            v = ValidationWorkflow.objects.create(
                name=f"name-{i}",
                account=self.account,
                description=f"description-{i}",
                created_by=self.john_doe,
                updated_by=self.john_wick,
            )
            if i == 0:
                self.vf_pk = v.pk
                v.form_set.set([self.form_3])
                v.save()

        self.validation_workflow_no_form = ValidationWorkflow.objects.create(
            name="no-form",
            account=self.account,
            description="description-no-form",
            created_by=self.john_doe,
            updated_by=self.john_wick,
        )

        self.validation_workflow_multiple_forms = ValidationWorkflow.objects.create(
            name="multiple-forms",
            account=self.account,
            description="description-no-form",
            created_by=self.john_doe,
            updated_by=self.john_wick,
        )
        self.validation_workflow_multiple_forms.form_set.set([self.form, self.form_2])
        self.validation_workflow_multiple_forms.save()

        self.out_of_account_vw = ValidationWorkflow.objects.create(name="out-of-account", account=self.account_2)

        # Steps created in reverse order: the list must follow the chain, not the creation order
        self.user_role = UserRole.objects.create(
            group=Group.objects.create(name=f"{self.account.id}_Validator"), account=self.account
        )
        self.last_step = ValidationNodeTemplate.objects.create(
            name="Last step", workflow=self.validation_workflow_multiple_forms
        )
        self.first_step = ValidationNodeTemplate.objects.create(
            name="First step", workflow=self.validation_workflow_multiple_forms
        )
        self.first_step.roles_required.add(self.user_role)
        self.first_step.next_node_templates.add(self.last_step)

    def test_output_fields(self):
        for user in [self.john_wick, self.superuser]:
            with self.subTest(f"with user {user}"):
                self.client.force_authenticate(user)
                res = self.client.get(reverse("validation_workflows-list"), data={"name": "multiple-forms"})
                res_json = self.assertJSONResponse(res, status.HTTP_200_OK)

                item = res_json["results"][0]

                self.assertEqual(item["form_count"], 2)
                self.assertEqual(item["linked_forms_count"], 2)
                self.assertEqual(
                    item["steps"],
                    [
                        {
                            "slug": self.first_step.slug,
                            "name": "First step",
                            "roles_required": [{"id": self.user_role.id, "name": "Validator"}],
                        },
                        {"slug": self.last_step.slug, "name": "Last step", "roles_required": []},
                    ],
                )
                self.assertEqual(item["created_by"], "John Doe")
                self.assertEqual(item["updated_by"], "john.wick")

    def test_filter_out_by_account(self):
        """
        User should not see workflows that don't belong to his account.
        """
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validation_workflows-list"), data={"limit": 100})
        res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertFalse(any(item["name"] == "out-of-account" for item in res_json["results"]))

        self.assertTrue(any(item["name"] == "name-1" for item in res_json["results"]))

    def test_search_filters(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.get(reverse("validation_workflows-list"))
        res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidValidationWorkflowListData(res_json, 17)

        with self.subTest("Search by name"):
            res = self.client.get(reverse("validation_workflows-list"), data={"name": "name"})
            res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidValidationWorkflowListData(res_json, 15)

            res = self.client.get(reverse("validation_workflows-list"), data={"name": "NAME"})
            res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidValidationWorkflowListData(res_json, 15)

            res = self.client.get(reverse("validation_workflows-list"), data={"name": "NAME-14"})
            res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidValidationWorkflowListData(res_json, 1)

            res = self.client.get(reverse("validation_workflows-list"), data={"name": "wrong"})
            res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidValidationWorkflowListData(res_json, 0)

        with self.subTest("Search by forms"):
            res = self.client.get(
                reverse("validation_workflows-list"), data={"forms": [Form.objects.order_by("-pk").first().pk + 1]}
            )
            res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidValidationWorkflowListData(res_json, 0)

            res = self.client.get(
                reverse("validation_workflows-list"),
                data={"forms": [Form.objects.order_by("-pk").first().pk + 1, self.form.pk]},
            )
            res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidValidationWorkflowListData(res_json, 1)

            res = self.client.get(
                reverse("validation_workflows-list"),
                data={"forms": [Form.objects.order_by("-pk").first().pk + 1, self.form.pk, self.form_2.pk]},
            )
            res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidValidationWorkflowListData(res_json, 1)

            res = self.client.get(
                reverse("validation_workflows-list"),
                data={"forms": [Form.objects.order_by("-pk").first().pk + 1, self.form_2.pk]},
            )
            res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidValidationWorkflowListData(res_json, 1)

            res = self.client.get(
                reverse("validation_workflows-list"),
                data={"forms": [Form.objects.order_by("-pk").first().pk + 1, self.form_2.pk, self.form_3.pk]},
            )
            res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidValidationWorkflowListData(res_json, 1)

            # testing with forms=x,y,z

            res = self.client.get(
                reverse("validation_workflows-list"),
                data={"forms": ",".join(map(str, [Form.objects.order_by("-pk").first().pk + 1]))},
            )
            res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidValidationWorkflowListData(res_json, 0)

            res = self.client.get(
                reverse("validation_workflows-list"),
                data={"forms": ",".join(map(str, [Form.objects.order_by("-pk").first().pk + 1, self.form.pk]))},
            )
            res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidValidationWorkflowListData(res_json, 1)

    def test_search_is_paginated(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.get(reverse("validation_workflows-list"))
        res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidValidationWorkflowListData(res_json, 17)

        res = self.client.get(reverse("validation_workflows-list"), data={"limit": 2})
        res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidValidationWorkflowListData(res_json, 2)

    def test_search_num_queries_with_parameters_and_one_search_result(self):
        self.client.force_authenticate(self.john_wick)

        # +1: steps (the workflow found has none, so no step relations to load)
        with self.assertNumQueries(6):
            res = self.client.get(
                reverse("validation_workflows-list"), data={"name": "name", "forms": [self.form.pk, self.form_3.pk]}
            )
            res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidValidationWorkflowListData(res_json, 1)

    def test_search_num_queries_without_parameters_and_multiple_search_results(self):
        self.client.force_authenticate(self.john_wick)

        # +5: steps, their next and previous steps, their roles and the roles' groups
        with self.assertNumQueries(10):
            self.client.force_authenticate(self.john_wick)
            res = self.client.get(reverse("validation_workflows-list"))
            res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidValidationWorkflowListData(res_json, 17)

    def test_linked_forms_count_and_steps_of_workflows_without_them(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validation_workflows-list"), data={"name": "no-form"})
        item = self.assertJSONResponse(res, status.HTTP_200_OK)["results"][0]
        self.assertEqual(item["linked_forms_count"], 0)
        self.assertEqual(item["steps"], [])

    def test_permissions(self):
        res = self.client.get(reverse("validation_workflows-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(reverse("validation_workflows-list"))
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validation_workflows-list"))
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.client.force_authenticate(self.superuser)
        res = self.client.get(reverse("validation_workflows-list"))
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.client.force_authenticate(self.user_without_feature_flag)
        res = self.client.get(reverse("validation_workflows-list"))
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)


class ValidationWorkflowAPISwaggerListTestCase(SwaggerTestCaseMixin, BaseValidationWorkflowAPITestCase):
    def setUp(self):
        super().setUp()
        self.add_validation_workflow_module(self.account)

        self.form = Form.objects.create(name="form")
        Instance.objects.create(name="instance", form=self.form)
        Instance.objects.create(name="instance2", form=self.form)

        self.form_2 = Form.objects.create(name="form_2")
        self.form_3 = Form.objects.create(name="form_3")
        for i in range(15):
            v = ValidationWorkflow.objects.create(
                name=f"name-{i}",
                account=self.account,
                description=f"description-{i}",
                created_by=self.john_doe,
                updated_by=self.john_wick,
            )
            if i == 0:
                self.vf_pk = v.pk
                v.form_set.set([self.form_3])
                v.save()

    def test_response_is_compliant(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validation_workflows-list"))
        res_json = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidValidationWorkflowListData(res_json, 15)

        # res_json["results"][0]["slug"] = 1

        self.assertResponseCompliantToSwagger(res_json, "PaginatedValidationWorkflowListList")
