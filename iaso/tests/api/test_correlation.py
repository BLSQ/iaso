import typing

from django.test import tag
from django.core.files import File
from django.utils.timezone import now
from unittest import mock

from iaso import models as m
from iaso.test import APITestCase


class FormsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()

        star_wars = m.Account.objects.create(name="Star Wars")

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars)

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.jedi_academy = m.OrgUnitType.objects.create(name="Jedi Academy", short_name="Aca")
        cls.sith_guild = m.OrgUnitType.objects.create(name="Sith guild", short_name="Sith")

        cls.project_1 = m.Project.objects.create(name="Hydroponic gardens",
                                                 app_id="stars.empire.agriculture.hydroponics",
                                                 account=star_wars)

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
        cls.project_1.forms.add(cls.form_2)

        cls.project_1.save()

    @tag("iaso_only")
    def test_correlation_creation(self):
        """POST of a form with a correlation id"""

        with open("iaso/tests/fixtures/land_speeder.xml") as fp:
            self.client.post('/sync/form_upload/', {'xml_submission_file': fp})


