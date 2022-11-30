import typing

from django.utils.timezone import now

from iaso import models as m
from iaso.api.common import CONTENT_TYPE_XLSX
from iaso.models import Form
from iaso.test import APITestCase


class FormsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()

        star_wars = m.Account.objects.create(name="Star Wars")
        marvel = m.Account.objects.create(name="Marvel")

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_forms"])
        cls.raccoon = cls.create_user_with_profile(username="raccoon", account=marvel, permissions=["iaso_forms"])
        cls.iron_man = cls.create_user_with_profile(username="iron_man", account=marvel)

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.jedi_academy = m.OrgUnitType.objects.create(name="Jedi Academy", short_name="Aca")
        cls.sith_guild = m.OrgUnitType.objects.create(name="Sith guild", short_name="Sith")

        cls.project_1 = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        cls.project_2 = m.Project.objects.create(
            name="New Land Speeder concept", app_id="stars.empire.agriculture.land_speeder", account=star_wars
        )

        cls.form_1 = m.Form.objects.create(name="Hydroponics study", created_at=cls.now)

        cls.form_2 = m.Form.objects.create(
            name="Hydroponic public survey",
            form_id="sample2",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=True,
            created_at=cls.now,
        )
        cls.form_2.form_versions.create(file=cls.create_file_mock(name="testf1.xml"), version_id="2020022401")
        cls.form_2.org_unit_types.add(cls.jedi_council)
        cls.form_2.org_unit_types.add(cls.jedi_academy)

        cls.form_2.instances.create(file=cls.create_file_mock(name="testi1.xml"))
        cls.form_2.instances.create(
            file=cls.create_file_mock(name="testi2.xml"), device=m.Device.objects.create(test_device=True)
        )
        cls.form_2.save()

        cls.project_1.unit_types.add(cls.jedi_council)
        cls.project_1.unit_types.add(cls.jedi_academy)
        cls.project_1.forms.add(cls.form_1)
        cls.project_1.forms.add(cls.form_2)
        cls.project_1.save()


    def test_user_without_auth(self):

    def test_user_with_auth_no_access_to_entity_type(self):

    def test_user_with_auth_access_entity_ok_no_access_to_reference_form(self):

    def test_user_with_auth_access_entity_ok_no_access_to_follow_ups_form(self):

    def test_user_with_auth_access_entity_ok_no_access_to_changes_forms(self):

    def test_user_all_access_ok(self):

    def test_view_all_versions(self):

    def test_view_specific_version(self):

    def test_new_version_empty(self):

    def test_new_version_from_copy(self):

    def test_mobile_api(self):

    def test_forms_list_empty_for_user(self):
        """GET /forms/ with a user that has no access to any form"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.get("/api/forms/")
        self.assertJSONResponse(response, 200)

        self.assertValidFormListData(response.json(), 0)

    def assertValidFormListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertValidListData(
            list_data=list_data, expected_length=expected_length, results_key="forms", paginated=paginated
        )

        for form_data in list_data["forms"]:
            self.assertValidFormData(form_data)

    # noinspection DuplicatedCode
    def assertValidFormData(self, form_data: typing.Mapping):
        self.assertHasField(form_data, "id", int)
        self.assertHasField(form_data, "name", str)
        self.assertHasField(form_data, "periods_before_allowed", int)
        self.assertHasField(form_data, "periods_after_allowed", int)
        self.assertHasField(form_data, "created_at", float)
        self.assertHasField(form_data, "updated_at", float)
