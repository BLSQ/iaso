import typing

from iaso import models as m
from iaso.api.query_params import APP_ID, FORM_ID
from iaso.test import APITestCase


BASE_URL = "/api/formpredefinedfilters/"


class FormPredefinedFilterViewsTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = account = m.Account.objects.create(name="Account")

        cls.user_with_rights = cls.create_user_with_profile(
            username="Authorized",
            account=account,
            permissions=["iaso_forms"],
        )
        cls.user_without_rights = cls.create_user_with_profile(
            username="Unauthorized",
            account=account,
            permissions=[],
        )

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
        cls.form1 = form1 = m.Form.objects.create(name="Form1", legend_threshold=10)
        cls.form2 = form2 = m.Form.objects.create(name="Form2", legend_threshold=10)

        unauthenticated_project.forms.add(form1)
        unauthenticated_project.forms.add(form2)
        unauthenticated_project.save()

        authenticated_project.forms.add(form1)
        authenticated_project.forms.add(form2)
        authenticated_project.save()

    def test_formpredefinedfilters_list_without_auth(self):
        f"""GET {BASE_URL} without auth: 0 result"""

        response = self.client.get(BASE_URL)
        self.assertJSONResponse(response, 200)
        self.assertValidFiltersListData(response.json(), 0)

    def test_formpredefinedfilters_list_without_auth_for_project_requiring_auth(self):
        f"""GET {BASE_URL} without auth for project which requires it: 401"""

        response = self.client.get(BASE_URL, {APP_ID: self.authenticated_project.app_id})
        self.assertJSONResponse(response, 401)

    def test_formpredefinedfilters_list_without_auth_for_project_not_requiring_auth(self):
        f"""GET {BASE_URL} without auth for project which doesn't requires it: 200"""

        response = self.client.get(BASE_URL, {APP_ID: self.unauthenticated_project.app_id})
        self.assertJSONResponse(response, 200)
        self.assertValidFiltersListData(response.json(), 0)

    def test_formpredefinedfilters_list_with_wrong_form_id(self):
        f"""GET {BASE_URL} with invalid form id: 404"""

        self.client.force_authenticate(user=self.user_with_rights)
        response = self.client.get(BASE_URL, {FORM_ID: 1000})
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

        response = self.client.get(
            path=BASE_URL,
            data={"form_id": self.form1.id},
            format="json",
        )
        self.assertJSONResponse(response, 200)
        self.assertValidFiltersListData(response.json(), 1)
        self.assertEqual(response.json().get("form_predefined_filters")[0].get("name"), "test")
        id = response.json().get("form_predefined_filters")[0].get("id")

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
        self.assertEqual(response.json().get("form_predefined_filters")[0].get("name"), "test2")

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
