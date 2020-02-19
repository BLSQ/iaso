import typing

from django.test import tag

from iaso import models as m
from iaso.test import APITestCase


class FormsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        marvel = m.Account.objects.create(name="Marvel")

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars)
        cls.raccoon = cls.create_user_with_profile(username="raccoon", account=marvel)
        project = m.Project.objects.create(name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics",
                                           account=star_wars)
        cls.form_1 = project.forms.create(name="Hydroponics study")
        cls.form_2 = project.forms.create(name="New Land Speeder concept")

    @tag("iaso_only")
    def test_forms_list_without_auth(self):
        """GET /forms/ without auth: 0 result"""

        response = self.client.get('/api/forms/')
        self.assertApiResponse(response, 200)

        self.assertValidFormListData(response.json(), 0)

    @tag("iaso_only")
    def test_forms_list_empty_for_user(self):
        """GET /forms/ with a user that has no access to any form"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.get('/api/forms/')
        self.assertApiResponse(response, 200)

        self.assertValidFormListData(response.json(), 0)

    @tag("iaso_only")
    def test_forms_list_ok(self):
        """GET /forms/ happy path: we expect two results"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get('/api/forms/', headers={'Content-Type': 'application/json'})
        self.assertApiResponse(response, 200)

        self.assertValidFormListData(response.json(), 2)

    @tag("iaso_only")
    def test_forms_list_paginated(self):
        """GET /forms/ paginated happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get('/api/forms/?limit=1&page=1', headers={'Content-Type': 'application/json'})
        self.assertApiResponse(response, 200)

        response_data = response.json()
        self.assertValidFormListData(response_data, 1, True)
        self.assertEqual(response_data["page"], 1)
        self.assertEqual(response_data["pages"], 2)
        self.assertEqual(response_data["limit"], 1)
        self.assertEqual(response_data["count"], 2)

    @tag("iaso_only")
    def test_forms_retrieve_without_auth(self):
        """GET /forms/<form_id> without auth should result in a 403"""

        response = self.client.get(f'/api/forms/{self.form_1.id}/')
        self.assertApiResponse(response, 403)

    @tag("iaso_only")
    def test_forms_retrieve_wrong_auth(self):
        """GET /forms/<form_id> with auth of unrelated user should result in a 403"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.get(f'/api/forms/{self.form_1.id}/')
        self.assertApiResponse(response, 403)

    @tag("iaso_only")
    def test_forms_retrieve_not_found(self):
        """GET /forms/<form_id>: id does not exist"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f'/api/forms/292003030/')
        self.assertApiResponse(response, 404)

    @tag("iaso_only")
    def test_forms_retrieve_ok(self):
        """GET /forms/<form_id> happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f'/api/forms/{self.form_1.id}/')
        self.assertApiResponse(response, 200)

        self.assertValidFormData(response.json())

    def assertValidFormListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertValidListData(list_data=list_data, expected_length=expected_length, results_key="forms",
                                 paginated=paginated)

        for form_data in list_data["forms"]:
            self.assertValidFormData(form_data)

    def assertValidFormData(self, form_data: typing.Mapping):  # TODO: check for other fields
        self.assertIn("id", form_data)
        self.assertIsInstance(form_data["id"], int)
        self.assertIn("name", form_data)
        self.assertIsInstance(form_data["name"], str)
