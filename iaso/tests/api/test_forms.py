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

        jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        jedi_academy = m.OrgUnitType.objects.create(name="Jedi Academy", short_name="Aca")

        project = m.Project.objects.create(name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics",
                                           account=star_wars)

        form_1 = m.Form.objects.create(name="Hydroponics study")
        form_2 = m.Form.objects.create(name="New Land Speeder concept", form_id="land_speeder_1",
                                       single_per_period=True)
        form_2.org_unit_types.add(jedi_council)
        form_2.org_unit_types.add(jedi_academy)
        form_2.instances.create()
        form_2.save()

        project.unit_types.add(jedi_council)
        project.unit_types.add(jedi_academy)
        project.forms.add(form_1)
        project.forms.add(form_2)
        project.save()

        cls.project = project
        cls.form_1 = form_1
        cls.form_2 = form_2

    @tag("iaso_only")
    def test_forms_list_without_auth(self):
        """GET /forms/ without auth: 0 result"""

        response = self.client.get('/api/forms/')
        self.assertJSONResponse(response, 200)

        self.assertValidFormListData(response.json(), 0)

    @tag("iaso_only")
    def test_forms_list_empty_for_user(self):
        """GET /forms/ with a user that has no access to any form"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.get('/api/forms/')
        self.assertJSONResponse(response, 200)

        self.assertValidFormListData(response.json(), 0)

    @tag("iaso_only")
    def test_forms_list_with_app_id(self):
        """GET /forms/ mobile app happy path (no auth but with app id): 2 result"""

        response = self.client.get(f'/api/forms/?app_id={self.project.app_id}')
        self.assertJSONResponse(response, 200)
        self.assertValidFormListData(response.json(), 2)

    @tag("iaso_only")
    def test_forms_list_ok(self):
        """GET /forms/ web app happy path: we expect two results"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get('/api/forms/', headers={'Content-Type': 'application/json'})
        self.assertJSONResponse(response, 200)
        self.assertValidFormListData(response.json(), 2)

    @tag("iaso_only")
    def test_forms_list_paginated(self):
        """GET /forms/ paginated happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get('/api/forms/?limit=1&page=1', headers={'Content-Type': 'application/json'})
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidFormListData(response_data, 1, True)
        self.assertEqual(response_data["page"], 1)
        self.assertEqual(response_data["pages"], 2)
        self.assertEqual(response_data["limit"], 1)
        self.assertEqual(response_data["count"], 2)

    @tag("iaso_only")
    def test_forms_list_csv(self):
        """GET /forms/ csv happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get('/api/forms/?csv=1', headers={'Content-Type': 'application/json'})
        self.assertFileResponse(response, 200, 'text/csv', expected_attachment_filename="forms.csv", streaming=True)

    @tag("iaso_only")
    def test_forms_list_xslx(self):
        """GET /forms/ xslx happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get('/api/forms/?xlsx=1', headers={'Content-Type': 'application/json'})
        self.assertFileResponse(response, 200, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                expected_attachment_filename="forms.xlsx")

    @tag("iaso_only")
    def test_forms_retrieve_without_auth(self):
        """GET /forms/<form_id> without auth should result in a 404"""

        response = self.client.get(f'/api/forms/{self.form_1.id}/')
        self.assertJSONResponse(response, 404)

    @tag("iaso_only")
    def test_forms_retrieve_wrong_auth(self):
        """GET /forms/<form_id> with auth of unrelated user should result in a 404"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.get(f'/api/forms/{self.form_1.id}/')
        self.assertJSONResponse(response, 404)

    @tag("iaso_only")
    def test_forms_retrieve_not_found(self):
        """GET /forms/<form_id>: id does not exist"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f'/api/forms/292003030/')
        self.assertJSONResponse(response, 404)

    @tag("iaso_only")
    def test_forms_retrieve_ok_1(self):
        """GET /forms/<form_id> happy path (simple form)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f'/api/forms/{self.form_1.id}/')
        self.assertJSONResponse(response, 200)

        self.assertValidFormData(response.json())

    @tag("iaso_only")
    def test_forms_retrieve_ok_2(self):
        """GET /forms/<form_id> happy path (more complex form, additional fields)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f'/api/forms/{self.form_2.id}/')
        self.assertJSONResponse(response, 200)

        form_data = response.json()
        self.assertValidFormData(form_data)
        self.assertHasField(form_data, "form_id", str)
        self.assertHasField(form_data, "single_per_period", bool)
        self.assertHasField(form_data, "org_unit_types", list)
        self.assertHasField(form_data, "instances_count", int)
        self.assertHasField(form_data, "instance_updated_at", float)
        for org_unit_type_data in form_data["org_unit_types"]:
            self.assertIsInstance(org_unit_type_data, dict)
            self.assertHasField(org_unit_type_data, "id", int)

    def test_form_create_ok(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.post(f'/api/forms/', {
            "name": "test form",
            "form_id": "test_001",
            "period_type": "MONTH",
            "single_per_period": False
        })
        self.assertJSONResponse(response, 201)

    def assertValidFormListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertValidListData(list_data=list_data, expected_length=expected_length, results_key="forms",
                                 paginated=paginated)

        for form_data in list_data["forms"]:
            self.assertValidFormData(form_data)

    def assertValidFormData(self, form_data: typing.Mapping):  # TODO: check for other fields
        self.assertHasField(form_data, "id", int)
        self.assertHasField(form_data, "name", str)
        self.assertHasField(form_data, "created_at", float)
        self.assertHasField(form_data, "updated_at", float)
