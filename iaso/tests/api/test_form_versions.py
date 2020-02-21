import typing

from django.test import tag
from django.core.files import File
from unittest import mock

from iaso import models as m
from iaso.test import APITestCase


class FormsVersionAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        dc = m.Account.objects.create(name="DC Comics")

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars)
        cls.batman = cls.create_user_with_profile(username="batman", account=dc)
        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.project = m.Project.objects.create(name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics",
                                               account=star_wars)

        cls.form = m.Form.objects.create(name="New Land Speeder concept", form_id="land_speeder_1",
                                         period_type="QUARTER", single_per_period=True)
        cls.form.org_unit_types.add(cls.jedi_council)
        cls.form.save()
        form_file_mock = mock.MagicMock(spec=File)
        form_file_mock.name = 'test.xml'

        cls.project.unit_types.add(cls.jedi_council)
        cls.project.forms.add(cls.form)
        cls.project.save()

    @tag("iaso_only")
    def test_form_versions_list(self):
        """GET /formversions/: not authorized for now"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get('/api/formversions/')
        self.assertJSONResponse(response, 405)

    @tag("iaso_only")
    def test_form_versions_retrieve(self):
        """GET /formversions/<form_id>: not authorized for now"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f'/api/formversions/33/')
        self.assertJSONResponse(response, 405)

    @tag("iaso_only")
    def test_form_versions_update(self):
        """PUT /formversions/<form_id>: not authorized for now"""

        self.client.force_authenticate(self.yoda)
        response = self.client.put(f'/api/formversions/33/', data={})
        self.assertJSONResponse(response, 405)

    @tag("iaso_only")
    def test_form_versions_destroy(self):
        """DELETE /formversions/<form_id>: not authorized for now"""

        self.client.force_authenticate(self.yoda)
        response = self.client.delete(f'/api/formversions/33/')
        self.assertJSONResponse(response, 405)

    def test_form_versions_create_ok(self):
        """POST /form-versions/ happy path"""

        self.client.force_authenticate(self.yoda)
        form_file_mock = mock.MagicMock(spec=File)
        form_file_mock.name = 'test_yoda.xml'
        response = self.client.post(f'/api/formversions/', data={
            "form_id": self.form.id,
            "version_id": "february_2020",
            "file": form_file_mock,
        }, format='multipart')
        self.assertJSONResponse(response, 201)
        self.assertValidFormVersionData(response.json())

    def test_form_versions_create_wrong_form(self):
        """POST /form-versions/ - user has no access to the underlying form"""

        self.client.force_authenticate(self.batman)
        form_file_mock = mock.MagicMock(spec=File)
        form_file_mock.name = 'test_batman.xml'
        response = self.client.post(f'/api/formversions/', data={
            "form_id": self.form.id,
            "version_id": "february_2020",
            "file": form_file_mock,
        }, format='multipart')
        self.assertJSONResponse(response, 400)

    def assertValidFormVersionData(self, form_version_data: typing.Mapping):  # TODO: check for other fields
        self.assertHasField(form_version_data, "id", int)
        self.assertHasField(form_version_data, "file", str)
        self.assertHasField(form_version_data, "version_id", str)
        self.assertHasField(form_version_data, "created_at", float)
        self.assertHasField(form_version_data, "updated_at", float)
