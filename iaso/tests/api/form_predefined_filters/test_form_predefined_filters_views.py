import typing

from iaso import models as m
from iaso.api.query_params import APP_ID, FORM_ID
from iaso.tests.tasks.task_api_test_case import TaskAPITestCase


BASE_URL = "/api/formpredefinedfilters/"


class FormPredefinedFilterViewsTestCase(TaskAPITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = account = m.Account.objects.create(name="Account")
        cls.account2 = account2 = m.Account.objects.create(name="Account2")
        cls.user_with_rights, cls.anon_user, cls.user_without_rights = cls.create_base_users(account, ["iaso_forms"])

        cls.unauthenticated_project = unauthenticated_project = m.Project.objects.create(
            name="Unauthenticated Project",
            app_id="unauthenticated",
            account=account,
        )
        cls.authenticated_project = authenticated_project = m.Project.objects.create(
            name="Authenticated Project",
            app_id="authenticated",
            account=account,
            needs_authentication=True,
        )
        account2_project = m.Project.objects.create(
            name="Account2 Project",
            app_id="unaccessible",
            account=account2,
        )
        cls.form1 = form1 = m.Form.objects.create(name="Form1", legend_threshold=10)
        cls.form2 = form2 = m.Form.objects.create(name="Form2", legend_threshold=10)
        cls.form3 = form3 = m.Form.objects.create(name="Form3", legend_threshold=10)

        unauthenticated_project.forms.set([form1, form2])
        authenticated_project.forms.set([form1, form2])
        account2_project.forms.set([form3])

        m.FormPredefinedFilter.objects.create(
            form=form3,
            name="Unaccessible Filter",
            short_name="Hu-Ho!",
            json_logic="""{}""",
        )

    def test_formpredefinedfilters_list_without_auth(self):
        f"""GET {BASE_URL} without auth: 0 result"""

        response = self.client.get(BASE_URL)
        self.assertJSONResponse(response, 401)

    def test_formpredefinedfilters_list_without_auth_for_project_requiring_auth(self):
        f"""GET {BASE_URL} without auth for project which requires it: 401"""

        response = self.client.get(BASE_URL, {APP_ID: self.authenticated_project.app_id})
        self.assertJSONResponse(response, 401)

    def test_formpredefinedfilters_list_without_auth_for_project_not_requiring_auth(self):
        f"""GET {BASE_URL} without auth for project which doesn't requires it: 200"""

        with self.assertNumQueries(3):
            response = self.client.get(BASE_URL, {APP_ID: self.unauthenticated_project.app_id})
        self.assertJSONResponse(response, 200)
        self.assertValidFiltersListData(response.json(), 0)

    def test_formpredefinedfilters_list_with_invalid_form_id(self):
        f"""GET {BASE_URL} with invalid form id: 404"""

        self.client.force_authenticate(user=self.user_with_rights)
        response = self.client.get(BASE_URL, {FORM_ID: 1000})
        self.assertJSONResponse(response, 404)

    def test_formpredefinedfilters_list_with_wrong_form_id(self):
        f"""GET {BASE_URL} with wrong form id: 400"""

        self.client.force_authenticate(user=self.user_with_rights)
        response = self.client.get(BASE_URL, {FORM_ID: "FooBar"})
        self.assertJSONResponse(response, 400)

    def test_formpredefinedfilters_from_other_account(self):
        f"""GET {BASE_URL} from other account: 404"""
        self.client.force_authenticate(user=self.user_with_rights)
        response = self.client.get(BASE_URL, {FORM_ID: self.form3.id})
        self.assertJSONResponse(response, 404)

    def test_formpredefinedfilters_create_get_delete(self):
        self.client.force_authenticate(self.user_with_rights)
        response = self.client.post(
            path=BASE_URL,
            data={
                "name": "test",
                "form_id": self.form1.id,
                "short_name": "short_test",
                "json_logic": """{"key":1}""",
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)

        with self.assertNumQueries(2):
            response = self.client.get(
                path=BASE_URL,
                data={"form_id": self.form1.id},
                format="json",
            )
        self.assertJSONResponse(response, 200)
        self.assertValidFiltersListData(response.json(), 1)
        first_predefined_filter = response.json().get("form_predefined_filters")[0]
        self.assertEqual(first_predefined_filter.get("name"), "test")
        self.assertEqual(first_predefined_filter.get("form_id"), self.form1.id)
        self.assertEqual(first_predefined_filter.get("short_name"), "short_test")
        self.assertEqual(first_predefined_filter.get("json_logic"), """{"key":1}""")
        id = first_predefined_filter.get("id")

        response = self.client.get(
            path=BASE_URL,
            data={"form_id": self.form2.id},
            format="json",
        )
        self.assertJSONResponse(response, 200)
        self.assertValidFiltersListData(response.json(), 0)

        response = self.client.patch(
            path=f"{BASE_URL}{id}/",
            data={"name": "test2"},
            format="json",
        )
        self.assertJSONResponse(response, 200)

        response = self.client.get(
            path=BASE_URL,
            data={"form_id": self.form1.id},
            format="json",
        )
        self.assertJSONResponse(response, 200)
        self.assertValidFiltersListData(response.json(), 1)
        first_predefined_filter = response.json().get("form_predefined_filters")[0]
        self.assertEqual(first_predefined_filter.get("name"), "test2")
        self.assertEqual(first_predefined_filter.get("form_id"), self.form1.id)
        self.assertEqual(first_predefined_filter.get("short_name"), "short_test")
        self.assertEqual(first_predefined_filter.get("json_logic"), """{"key":1}""")

        response = self.client.delete(path=f"{BASE_URL}{id}/")
        self.assertJSONResponse(response, 204)

        response = self.client.get(
            path=BASE_URL,
            data={"form_id": self.form1.id},
            format="json",
        )
        self.assertJSONResponse(response, 200)
        self.assertValidFiltersListData(response.json(), 0)

    def assertValidFiltersListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        super().assertValidListData(
            list_data=list_data,
            expected_length=expected_length,
            results_key="form_predefined_filters",
            paginated=paginated,
        )

        for data in list_data["form_predefined_filters"]:
            self.assertHasField(data, "id", int)
            self.assertHasField(data, "form_id", int)
            self.assertHasField(data, "name", str)
            self.assertHasField(data, "short_name", str)
            self.assertHasField(data, "json_logic", str)
            self.assertHasField(data, "created_at", float)
            self.assertHasField(data, "updated_at", float)
