from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status

from iaso.models import Account, Form, Instance, Project, UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.test import APITestCase


class BaseValidationWorkflowAPITestCase(APITestCase):
    def assertValidValidationWorkflowListData(self, list_data, expected_length, paginated=True):
        results_key = "results"
        self.assertValidListData(
            list_data=list_data, results_key=results_key, expected_length=expected_length, paginated=False
        )

        for data in list_data[results_key]:
            self.assertIn("slug", data)
            self.assertIn("name", data)
            self.assertIn("formCount", data)
            self.assertIn("createdBy", data)
            self.assertIn("updatedBy", data)
            self.assertIn("createdAt", data)
            self.assertIn("updatedAt", data)

    def assertValidValidationWorkflowDropdownListData(self, list_data, expected_length):
        self.assertValidListData(
            list_data=list_data, results_key=None, expected_length=expected_length, paginated=False
        )
        for data in list_data:
            self.assertIn("label", data)
            self.assertIn("value", data)


class ValidationWorkflowAPIListTestCase(BaseValidationWorkflowAPITestCase):
    def setUp(self):
        self.account = Account.objects.create(name="account")
        self.account_2 = Account.objects.create(name="account_2")

        self.form = Form.objects.create(name="form")
        Instance.objects.create(name="instance", form=self.form)
        Instance.objects.create(name="instance2", form=self.form)

        self.form_2 = Form.objects.create(name="form_2")
        self.form_3 = Form.objects.create(name="form_3")

        self.john_doe = self.create_user_with_profile(
            username="john.doe", account=self.account, first_name="John", last_name="Doe"
        )

        self.john_wick = self.create_user_with_profile(
            username="john.wick", account=self.account, permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION]
        )

        for i in range(15):
            v = ValidationWorkflow.objects.create(
                name=f"name-{i}",
                account=self.account,
                description=f"description-{i}",
                created_by=self.john_doe,
                updated_by=self.john_wick,
            )
            if i == 0:
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

        ValidationWorkflow.objects.create(name="out-of-account", account=self.account_2)

    def test_output_fields(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validationworkflows-list"), data={"name": "multiple-forms"})
        res_json = self.assertJSONResponse(res, 200)

        item = res_json["results"][0]

        self.assertEqual(item["formCount"], 2)
        self.assertEqual(item["createdBy"], "John Doe")
        self.assertEqual(item["updatedBy"], "john.wick")

    def test_filter_out_by_account(self):
        """
        User should not see workflows that don't belong to his account.
        """
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validationworkflows-list"), data={"limit": 100})
        res_json = self.assertJSONResponse(res, 200)
        self.assertFalse(any(item["name"] == "out-of-account" for item in res_json["results"]))

        self.assertTrue(any(item["name"] == "name-1" for item in res_json["results"]))

    def test_search_filters(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.get(reverse("validationworkflows-list"))
        res_json = self.assertJSONResponse(res, 200)
        self.assertValidValidationWorkflowListData(res_json, 17)

        with self.subTest("Search by name"):
            res = self.client.get(reverse("validationworkflows-list"), data={"name": "name"})
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowListData(res_json, 15)

            res = self.client.get(reverse("validationworkflows-list"), data={"name": "NAME"})
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowListData(res_json, 15)

            res = self.client.get(reverse("validationworkflows-list"), data={"name": "NAME-14"})
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowListData(res_json, 1)

            res = self.client.get(reverse("validationworkflows-list"), data={"name": "wrong"})
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowListData(res_json, 0)

        with self.subTest("Search by forms"):
            res = self.client.get(
                reverse("validationworkflows-list"), data={"forms": [Form.objects.order_by("-pk").first().pk + 1]}
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowListData(res_json, 0)

            res = self.client.get(
                reverse("validationworkflows-list"),
                data={"forms": [Form.objects.order_by("-pk").first().pk + 1, self.form.pk]},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowListData(res_json, 1)

            res = self.client.get(
                reverse("validationworkflows-list"),
                data={"forms": [Form.objects.order_by("-pk").first().pk + 1, self.form.pk, self.form_2.pk]},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowListData(res_json, 1)

            res = self.client.get(
                reverse("validationworkflows-list"),
                data={"forms": [Form.objects.order_by("-pk").first().pk + 1, self.form_2.pk]},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowListData(res_json, 1)

            res = self.client.get(
                reverse("validationworkflows-list"),
                data={"forms": [Form.objects.order_by("-pk").first().pk + 1, self.form_2.pk, self.form_3.pk]},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowListData(res_json, 1)

            # testing with forms=x,y,z

            res = self.client.get(
                reverse("validationworkflows-list"),
                data={"forms": ",".join(map(str, [Form.objects.order_by("-pk").first().pk + 1]))},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowListData(res_json, 0)

            res = self.client.get(
                reverse("validationworkflows-list"),
                data={"forms": ",".join(map(str, [Form.objects.order_by("-pk").first().pk + 1, self.form.pk]))},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowListData(res_json, 1)

    def test_search_is_paginated(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.get(reverse("validationworkflows-list"))
        res_json = self.assertJSONResponse(res, 200)
        self.assertValidValidationWorkflowListData(res_json, 17)

        res = self.client.get(reverse("validationworkflows-list"), data={"limit": 2})
        res_json = self.assertJSONResponse(res, 200)
        self.assertValidValidationWorkflowListData(res_json, 2)

    def test_search_num_queries_with_parameters_and_one_search_result(self):
        self.client.force_authenticate(self.john_wick)

        with self.assertNumQueries(5):
            res = self.client.get(
                reverse("validationworkflows-list"), data={"name": "name", "forms": [self.form.pk, self.form_3.pk]}
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowListData(res_json, 1)

    def test_search_num_queries_without_parameters_and_multiple_search_results(self):
        self.client.force_authenticate(self.john_wick)

        with self.assertNumQueries(5):
            self.client.force_authenticate(self.john_wick)
            res = self.client.get(reverse("validationworkflows-list"))
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowListData(res_json, 17)

    def test_permissions(self):
        res = self.client.get(reverse("validationworkflows-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(reverse("validationworkflows-list"))
        self.assertJSONResponse(res, 403)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validationworkflows-list"))
        self.assertJSONResponse(res, 200)


class ValidationWorkflowAPIDropdownTestCase(ValidationWorkflowAPIListTestCase):
    def test_filter_out_by_account(self):
        """
        User should not see workflows that don't belong to his account.
        """
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validationworkflows-dropdown"))
        res_json = self.assertJSONResponse(res, 200)
        self.assertFalse(any(item["label"] == "out-of-account" for item in res_json))

        self.assertTrue(any(item["label"] == "name-1" for item in res_json))

    def test_search_filters(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.get(reverse("validationworkflows-dropdown"))
        res_json = self.assertJSONResponse(res, 200)
        self.assertValidValidationWorkflowDropdownListData(res_json, 17)

        with self.subTest("Search by name"):
            res = self.client.get(reverse("validationworkflows-dropdown"), data={"name": "name"})
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 15)

            res = self.client.get(reverse("validationworkflows-dropdown"), data={"name": "NAME"})
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 15)

            res = self.client.get(reverse("validationworkflows-dropdown"), data={"name": "NAME-14"})
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 1)

            res = self.client.get(reverse("validationworkflows-dropdown"), data={"name": "wrong"})
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 0)

        with self.subTest("Search by forms"):
            res = self.client.get(
                reverse("validationworkflows-dropdown"), data={"forms": [Form.objects.order_by("-pk").first().pk + 1]}
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 0)

            res = self.client.get(
                reverse("validationworkflows-dropdown"),
                data={"forms": [Form.objects.order_by("-pk").first().pk + 1, self.form.pk]},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 1)

            res = self.client.get(
                reverse("validationworkflows-dropdown"),
                data={"forms": [Form.objects.order_by("-pk").first().pk + 1, self.form.pk, self.form_2.pk]},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 1)

            res = self.client.get(
                reverse("validationworkflows-dropdown"),
                data={"forms": [Form.objects.order_by("-pk").first().pk + 1, self.form_2.pk]},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 1)

            res = self.client.get(
                reverse("validationworkflows-dropdown"),
                data={"forms": [Form.objects.order_by("-pk").first().pk + 1, self.form_2.pk, self.form_3.pk]},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 1)

            # testing with forms=x,y,z

            res = self.client.get(
                reverse("validationworkflows-dropdown"),
                data={"forms": ",".join(map(str, [Form.objects.order_by("-pk").first().pk + 1]))},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 0)

            res = self.client.get(
                reverse("validationworkflows-dropdown"),
                data={"forms": ",".join(map(str, [Form.objects.order_by("-pk").first().pk + 1, self.form.pk]))},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 1)

    def test_view_is_not_paginated(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.get(reverse("validationworkflows-dropdown"))
        res_json = self.assertJSONResponse(res, 200)
        self.assertValidValidationWorkflowDropdownListData(res_json, 17)

        res = self.client.get(reverse("validationworkflows-dropdown"), data={"limit": 2})
        res_json = self.assertJSONResponse(res, 200)
        self.assertValidValidationWorkflowDropdownListData(res_json, 17)

    def test_search_num_queries_with_parameters_and_one_search_result(self):
        self.client.force_authenticate(self.john_wick)

        with self.assertNumQueries(3):
            res = self.client.get(
                reverse("validationworkflows-dropdown"), data={"name": "name", "forms": [self.form.pk, self.form_3.pk]}
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 1)

    def test_search_num_queries_without_parameters_and_multiple_search_results(self):
        self.client.force_authenticate(self.john_wick)

        with self.assertNumQueries(3):
            self.client.force_authenticate(self.john_wick)
            res = self.client.get(reverse("validationworkflows-dropdown"))
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 17)

    def test_permissions(self):
        res = self.client.get(reverse("validationworkflows-dropdown"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(reverse("validationworkflows-dropdown"))
        self.assertJSONResponse(res, 403)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validationworkflows-dropdown"))
        self.assertJSONResponse(res, 200)

    def test_values(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validationworkflows-dropdown"))
        res_json = self.assertJSONResponse(res, 200)
        self.assertValidValidationWorkflowDropdownListData(res_json, 17)

        self.assertIn({"label": "name-0", "value": ValidationWorkflow.objects.get(slug="name-0").id}, res_json)


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
        res = self.client.delete(reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, 204)

        self.assertEqual(ValidationWorkflow.objects.all().count(), 0)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(5):
            res = self.client.delete(
                reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug})
            )
            self.assertJSONResponse(res, 204)

    def test_permissions(self):
        res = self.client.delete(reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.delete(reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, 403)

        self.client.force_authenticate(self.john_wick)
        res = self.client.delete(reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, 204)


class ValidationWorkflowAPICreateTestCase(BaseValidationWorkflowAPITestCase):
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

    def test_happy_flow(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.post(
            reverse("validationworkflows-list"),
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

    def test_permissions(self):
        res = self.client.post(reverse("validationworkflows-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)

        res = self.client.post(reverse("validationworkflows-list"))
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)

        res = self.client.post(reverse("validationworkflows-list"))
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(5):
            res = self.client.post(
                reverse("validationworkflows-list"),
                data={
                    "name": "Validation workflow",
                    "description": "Some description",
                },
            )
            res_data = self.assertJSONResponse(res, status.HTTP_201_CREATED)
            self.assertEqual(
                res_data,
                {
                    "slug": "validation-workflow",
                },
            )


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
        res = self.client.put(reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.put(reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.put(reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

    def test_validation(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.put(reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "name", "This field is required.")

        res = self.client.put(
            reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}), data={"name": ""}
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "name", "This field may not be blank.")

        res = self.client.put(
            reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}), data={"name": None}
        )
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "name", "This field may not be null.")

    def test_update(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.put(
            reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}),
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
            reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}),
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
                reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}),
                data={"name": "Random new name", "description": "Random new description"},
            )
            self.assertJSONResponse(res, status.HTTP_200_OK)


class ValidationWorkflowAPIPartialUpdateTestCase(BaseValidationWorkflowAPITestCase):
    def setUp(self):
        self.account = Account.objects.create(name="account")

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

    def test_permissions(self):
        res = self.client.patch(reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.patch(reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.patch(reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_validation(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.patch(reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

        res = self.client.patch(
            reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}),
            data={"name": ""},
        )

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "name", "This field may not be blank.")

        res = self.client.patch(
            reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}),
            data={"name": None},
        )

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(res_data, "name", "This field may not be null.")

    def test_partial_update(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.patch(
            reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}),
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
            reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}),
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
        with self.assertNumQueries(5):
            res = self.client.patch(
                reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}),
                data={"name": "Random new name", "description": "Random new description"},
            )
            self.assertJSONResponse(res, status.HTTP_200_OK)


class ValidationWorkflowAPIRetrieveTestCase(BaseValidationWorkflowAPITestCase):
    def setUp(self):
        self.account = Account.objects.create(name="account")
        self.project = Project.objects.create(name="project", account=self.account)
        self.account_2 = Account.objects.create(name="account_2")

        self.group = Group.objects.create(name="Group")
        self.user_role = UserRole.objects.create(group=self.group, account=self.account)

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

        self.validation_workflow_other_account = ValidationWorkflow.objects.create(
            name="Random other name",
            description="Random description",
            created_by=self.john_doe,
            account=self.account_2,
        )

        self.validation_workflow = ValidationWorkflow.objects.create(
            name="Random name",
            description="Random description",
            created_by=self.john_doe,
            updated_by=self.john_wick,
            account=self.account,
        )
        self.validation_workflow.form_set.set([self.form, self.form_2])
        self.validation_workflow.save()

        self.node_template = ValidationNodeTemplate.objects.create(
            name="First node",
            description="First node description",
            color="#FDD75A",
            can_skip_previous_nodes=False,
            workflow=self.validation_workflow,
        )

        self.node_template.roles_required.add(self.user_role)
        self.node_template.save()

        self.second_node_template = ValidationNodeTemplate.objects.create(
            name="Second node",
            description="Second node description",
            color="#740D54",
            can_skip_previous_nodes=True,
            workflow=self.validation_workflow,
        )

        self.node_template.next_node_templates.add(self.second_node_template)
        self.node_template.save()

    def test_permissions(self):
        res = self.client.get(reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_404(self):
        self.client.force_authenticate(self.john_wick)

        with self.subTest("fetching wrong pk"):
            res = self.client.get(reverse("validationworkflows-detail", kwargs={"slug": "wrong-slug"}))
            self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        with self.subTest("fetching validation workflow that doesn't belong to account"):
            res = self.client.get(
                reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow_other_account.slug})
            )
            self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        # checking main keys
        with self.subTest("Checking main top level keys"):
            for k in [
                "name",
                "slug",
                "description",
                "forms",
                "createdBy",
                "createdAt",
                "updatedBy",
                "updatedAt",
                "nodeTemplates",
            ]:
                self.assertIn(k, res_data)

            self.assertEqual(res_data["name"], "Random name")
            self.assertEqual(res_data["slug"], "random-name")
            self.assertEqual(res_data["description"], "Random description")
            self.assertEqual(res_data["createdBy"], self.john_doe.get_full_name())
            self.assertIsNotNone(res_data["createdAt"])
            self.assertIsNotNone(res_data["updatedAt"])
            self.assertEqual(res_data["updatedBy"], self.john_wick.username)

            self.assertIsNotNone(res_data["forms"])
            self.assertIsNotNone(res_data["nodeTemplates"])

        with self.subTest("checking forms"):
            for form_value in res_data["forms"]:
                self.assertIn("id", form_value)
                self.assertIn("label", form_value)
            self.assertCountEqual(
                res_data["forms"],
                [{"id": self.form.pk, "label": self.form.name}, {"id": self.form_2.pk, "label": self.form_2.name}],
            )

        with self.subTest("checking nodeTemplates"):
            for node_template in res_data["nodeTemplates"]:
                for k in ["slug", "name", "description", "color", "canSkipPreviousNodes", "rolesRequired"]:
                    self.assertIn(k, node_template)

            self.assertEqual(
                res_data["nodeTemplates"],
                [
                    {
                        "slug": "first-node",
                        "name": "First node",
                        "description": "First node description",
                        "color": "#FDD75A",
                        "rolesRequired": [{"name": "Group", "id": self.group.pk}],
                        "canSkipPreviousNodes": False,
                    },
                    {
                        "slug": "second-node",
                        "name": "Second node",
                        "description": "Second node description",
                        "color": "#740D54",
                        "rolesRequired": [],
                        "canSkipPreviousNodes": True,
                    },
                ],
            )

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(10):
            res = self.client.get(reverse("validationworkflows-detail", kwargs={"slug": self.validation_workflow.slug}))
            self.assertEqual(res.status_code, status.HTTP_200_OK)
