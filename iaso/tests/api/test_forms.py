import typing

from django.test import tag
from django.core.files import File
from unittest import mock

from iaso import models as m
from iaso.test import APITestCase


class FormsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        marvel = m.Account.objects.create(name="Marvel")

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars)
        cls.raccoon = cls.create_user_with_profile(username="raccoon", account=marvel)

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.jedi_academy = m.OrgUnitType.objects.create(name="Jedi Academy", short_name="Aca")
        cls.sith_guild = m.OrgUnitType.objects.create(name="Sith guild", short_name="Sith")

        cls.project = m.Project.objects.create(name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics",
                                               account=star_wars)

        cls.form_1 = m.Form.objects.create(name="Hydroponics study")
        cls.form_2 = m.Form.objects.create(name="New Land Speeder concept", form_id="land_speeder_1",
                                           period_type="QUARTER", single_per_period=True)
        form_2_file_mock = mock.MagicMock(spec=File)
        form_2_file_mock.name = 'test.xml'
        cls.form_2.form_versions.create(file=form_2_file_mock, version_id="v3")
        cls.form_2.org_unit_types.add(cls.jedi_council)
        cls.form_2.org_unit_types.add(cls.jedi_academy)
        cls.form_2.instances.create()
        cls.form_2.save()

        cls.project.unit_types.add(cls.jedi_council)
        cls.project.unit_types.add(cls.jedi_academy)
        cls.project.forms.add(cls.form_1)
        cls.project.forms.add(cls.form_2)
        cls.project.save()

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
        response_data = response.json()
        self.assertValidFormListData(response_data, 2)

        form_2_data = next(form_data for form_data in response_data["forms"] if form_data["id"] == self.form_2.id)
        self.assertValidFullFormData(form_2_data)

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
        self.assertValidFullFormData(form_data)

    def test_forms_create_without_auth(self):
        """POST /forms/ without auth: 403"""

        response = self.client.post(f'/api/forms/', data={
            "name": "test form",
        }, format='json')
        self.assertJSONResponse(response, 403)

    def test_forms_create_ok(self):
        """POST /forms/ happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(f'/api/forms/', data={
            "name": "test form",
            "form_id": "test_001",
            "period_type": "MONTH",
            "single_per_period": False,
            "project_ids": [self.project.id],
            "org_unit_type_ids": [self.jedi_council.id, self.jedi_academy.id]
        }, format='json')
        self.assertJSONResponse(response, 201)
        response_data = response.json()

        self.assertValidFormData(response_data)
        form = m.Form.objects.get(pk=response_data["id"])
        self.assertEqual(1, form.projects.count())
        self.assertEqual(2, form.org_unit_types.count())

    def test_forms_create_wrong_project(self):
        """POST /forms/ - user has no access to the project"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.post(f'/api/forms/', data={
            "name": "test form",
            "form_id": "test_001",
            "period_type": "MONTH",
            "single_per_period": False,
            "project_ids": [self.project.id],
            "org_unit_type_ids": [self.jedi_council.id]
        }, format='json')
        self.assertJSONResponse(response, 400)
        self.assertHasError(response.json(), "project_ids", "Invalid project ids")

    def test_forms_create_wrong_org_unit_types(self):
        """POST /forms/ - mismatch between project and org unit types"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(f'/api/forms/', data={
            "name": "another test form",
            "form_id": "test_002",
            "period_type": "MONTH",
            "single_per_period": False,
            "project_ids": [self.project.id],
            "org_unit_type_ids": [self.sith_guild.id]
        }, format='json')
        self.assertJSONResponse(response, 400)
        self.assertHasError(response.json(), "org_unit_type_ids", "Invalid org unit type ids")

    @tag("iaso_only")
    def test_forms_update(self):
        """PUT /forms/<form_id>: not authorized for now"""

        self.client.force_authenticate(self.yoda)
        response = self.client.put(f'/api/forms/{self.form_1.id}/', data={}, format='json')
        self.assertJSONResponse(response, 405)

    @tag("iaso_only")
    def test_forms_destroy(self):
        """DELETE /forms/<form_id>: not authorized for now"""

        self.client.force_authenticate(self.yoda)
        response = self.client.delete(f'/api/forms/{self.form_1.id}/', format='json')
        self.assertJSONResponse(response, 405)

    def assertValidFormListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertValidListData(list_data=list_data, expected_length=expected_length, results_key="forms",
                                 paginated=paginated)

        for form_data in list_data["forms"]:
            self.assertValidFormData(form_data)

    def assertValidFormData(self, form_data: typing.Mapping):
        self.assertHasField(form_data, "id", int)
        self.assertHasField(form_data, "name", str)
        self.assertHasField(form_data, "created_at", float)
        self.assertHasField(form_data, "updated_at", float)

    def assertValidFullFormData(self, form_data: typing.Mapping):
        self.assertValidFormData(form_data)

        self.assertHasField(form_data, "form_id", str)
        self.assertHasField(form_data, "period_type", str)
        self.assertHasField(form_data, "single_per_period", bool)
        self.assertHasField(form_data, "org_unit_types", list)
        self.assertHasField(form_data, "instances_count", int)
        self.assertHasField(form_data, "instance_updated_at", float)

        for org_unit_type_data in form_data["org_unit_types"]:
            self.assertIsInstance(org_unit_type_data, dict)
            self.assertHasField(org_unit_type_data, "id", int)

        self.assertHasField(form_data, "instance_updated_at", float)
        self.assertHasField(form_data, "instances_count", int)
        self.assertHasField(form_data, "latest_form_version", dict)
        self.assertHasField(form_data["latest_form_version"], "id", int)
        self.assertHasField(form_data["latest_form_version"], "version_id", str)
        self.assertHasField(form_data["latest_form_version"], "file", str)
        self.assertHasField(form_data["latest_form_version"], "created_at", float)
        self.assertHasField(form_data["latest_form_version"], "updated_at", float)
