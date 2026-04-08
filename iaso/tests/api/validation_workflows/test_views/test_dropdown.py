from django.urls import reverse
from rest_framework import status

from iaso.models import Form
from iaso.tests.api.validation_workflows.test_views.test_list import ValidationWorkflowAPIListTestCase


class ValidationWorkflowAPIDropdownTestCase(ValidationWorkflowAPIListTestCase):
    def test_filter_out_by_account(self):
        """
        User should not see workflows that don't belong to his account.
        """
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validation_workflows-dropdown"))
        res_json = self.assertJSONResponse(res, 200)
        self.assertFalse(any(item["value"] == "out-of-account" for item in res_json))

        self.assertTrue(any(item["value"] == "name-1" for item in res_json))

    def test_search_filters(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.get(reverse("validation_workflows-dropdown"))
        res_json = self.assertJSONResponse(res, 200)
        self.assertValidValidationWorkflowDropdownListData(res_json, 17)

        with self.subTest("Search by name"):
            res = self.client.get(reverse("validation_workflows-dropdown"), data={"name": "name"})
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 15)

            res = self.client.get(reverse("validation_workflows-dropdown"), data={"name": "NAME"})
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 15)

            res = self.client.get(reverse("validation_workflows-dropdown"), data={"name": "NAME-14"})
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 1)

            res = self.client.get(reverse("validation_workflows-dropdown"), data={"name": "wrong"})
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 0)

        with self.subTest("Search by forms"):
            res = self.client.get(
                reverse("validation_workflows-dropdown"), data={"forms": [Form.objects.order_by("-pk").first().pk + 1]}
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 0)

            res = self.client.get(
                reverse("validation_workflows-dropdown"),
                data={"forms": [Form.objects.order_by("-pk").first().pk + 1, self.form.pk]},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 1)

            res = self.client.get(
                reverse("validation_workflows-dropdown"),
                data={"forms": [Form.objects.order_by("-pk").first().pk + 1, self.form.pk, self.form_2.pk]},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 1)

            res = self.client.get(
                reverse("validation_workflows-dropdown"),
                data={"forms": [Form.objects.order_by("-pk").first().pk + 1, self.form_2.pk]},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 1)

            res = self.client.get(
                reverse("validation_workflows-dropdown"),
                data={"forms": [Form.objects.order_by("-pk").first().pk + 1, self.form_2.pk, self.form_3.pk]},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 1)

            # testing with forms=x,y,z

            res = self.client.get(
                reverse("validation_workflows-dropdown"),
                data={"forms": ",".join(map(str, [Form.objects.order_by("-pk").first().pk + 1]))},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 0)

            res = self.client.get(
                reverse("validation_workflows-dropdown"),
                data={"forms": ",".join(map(str, [Form.objects.order_by("-pk").first().pk + 1, self.form.pk]))},
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 1)

    def test_view_is_not_paginated(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.get(reverse("validation_workflows-dropdown"))
        res_json = self.assertJSONResponse(res, 200)
        self.assertValidValidationWorkflowDropdownListData(res_json, 17)

        res = self.client.get(reverse("validation_workflows-dropdown"), data={"limit": 2})
        res_json = self.assertJSONResponse(res, 200)
        self.assertValidValidationWorkflowDropdownListData(res_json, 17)

    def test_search_num_queries_with_parameters_and_one_search_result(self):
        self.client.force_authenticate(self.john_wick)

        with self.assertNumQueries(4):
            res = self.client.get(
                reverse("validation_workflows-dropdown"), data={"name": "name", "forms": [self.form.pk, self.form_3.pk]}
            )
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 1)

    def test_search_num_queries_without_parameters_and_multiple_search_results(self):
        self.client.force_authenticate(self.john_wick)

        with self.assertNumQueries(4):
            self.client.force_authenticate(self.john_wick)
            res = self.client.get(reverse("validation_workflows-dropdown"))
            res_json = self.assertJSONResponse(res, 200)
            self.assertValidValidationWorkflowDropdownListData(res_json, 17)

    def test_permissions(self):
        res = self.client.get(reverse("validation_workflows-dropdown"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(reverse("validation_workflows-dropdown"))
        self.assertJSONResponse(res, 403)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validation_workflows-dropdown"))
        self.assertJSONResponse(res, 200)

        self.client.force_authenticate(self.user_without_feature_flag)
        res = self.client.get(reverse("validation_workflows-dropdown"))
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

    def test_values(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validation_workflows-dropdown"))
        res_json = self.assertJSONResponse(res, 200)
        self.assertValidValidationWorkflowDropdownListData(res_json, 17)

        self.assertIn({"label": "name-0", "value": "name-0"}, res_json)
