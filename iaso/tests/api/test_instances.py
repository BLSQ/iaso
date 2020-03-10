import typing

from django.test import tag
from django.core.files import File
from django.utils.timezone import now
from unittest import mock

from iaso import models as m
from iaso.test import APITestCase


class InstancesAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):  # TODO: cleanup setup
        cls.now = now()

        star_wars = m.Account.objects.create(name="Star Wars")
        marvel = m.Account.objects.create(name="Marvel")

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars)
        cls.raccoon = cls.create_user_with_profile(username="raccoon", account=marvel)

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.jedi_academy = m.OrgUnitType.objects.create(name="Jedi Academy", short_name="Aca")
        cls.sith_guild = m.OrgUnitType.objects.create(name="Sith guild", short_name="Sith")

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(name="Corruscant Jedi Council")

        cls.project_1 = m.Project.objects.create(name="Hydroponic gardens",
                                                 app_id="stars.empire.agriculture.hydroponics",
                                                 account=star_wars)

        cls.form_1 = m.Form.objects.create(name="Hydroponics study", period_type=m.MONTH, single_per_period=True)
        cls.create_form_instance(form=cls.form_1, period="202001", org_unit=cls.jedi_council_corruscant)
        cls.create_form_instance(form=cls.form_1, period="202002", org_unit=cls.jedi_council_corruscant)
        cls.create_form_instance(form=cls.form_1, period="202002", org_unit=cls.jedi_council_corruscant)
        cls.create_form_instance(form=cls.form_1, period="202003", org_unit=cls.jedi_council_corruscant)

        cls.form_2 = m.Form.objects.create(name="Hydroponic public survey", form_id="sample2",
                                           device_field="deviceid", location_field="geoloc", period_type="QUARTER",
                                           single_per_period=True, created_at=cls.now)
        form_2_file_mock = mock.MagicMock(spec=File)
        form_2_file_mock.name = 'test.xml'
        cls.form_2.form_versions.create(file=form_2_file_mock, version_id="2020022401")
        cls.form_2.org_unit_types.add(cls.jedi_council)
        cls.form_2.org_unit_types.add(cls.jedi_academy)
        cls.form_2.instances.create()
        cls.form_2.save()

        cls.project_1.unit_types.add(cls.jedi_council)
        cls.project_1.unit_types.add(cls.jedi_academy)
        cls.project_1.forms.add(cls.form_1)
        cls.project_1.forms.add(cls.form_2)
        cls.project_1.save()

    @tag("iaso_only")
    def test_instance_list_by_form_id_ok(self):
        """GET /instances/?form_id=form_id"""

        response = self.client.get(f'/api/instances/?form_id={self.form_1.pk}')
        self.assertJSONResponse(response, 200)

        self.assertValidInstanceListData(response.json(), 4)

    def assertValidInstanceListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertValidListData(list_data=list_data, expected_length=expected_length, results_key="instances",
                                 paginated=paginated)

        for instance_data in list_data["instances"]:
            self.assertValidInstanceData(instance_data)

    def assertValidInstanceData(self, instance_data: typing.Mapping):
        self.assertHasField(instance_data, "id", int)
        self.assertHasField(instance_data, "status", str)
