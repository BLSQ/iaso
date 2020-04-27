import typing

from django.test import tag
from django.core.files import File
from unittest import mock

from iaso import models as m
from iaso.test import APITestCase


class InstancesAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars)

        cls.jedi_council = m.OrgUnitType.objects.create(
            name="Jedi Council", short_name="Cnc"
        )

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(
            name="Corruscant Jedi Council"
        )

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=star_wars,
        )

        cls.form_1 = m.Form.objects.create(
            name="Hydroponics study", period_type=m.MONTH, single_per_period=True
        )
        cls.create_form_instance(
            form=cls.form_1, period="202001", org_unit=cls.jedi_council_corruscant
        )
        cls.create_form_instance(
            form=cls.form_1, period="202002", org_unit=cls.jedi_council_corruscant
        )
        cls.create_form_instance(
            form=cls.form_1, period="202002", org_unit=cls.jedi_council_corruscant
        )
        cls.create_form_instance(
            form=cls.form_1, period="202003", org_unit=cls.jedi_council_corruscant
        )

        cls.form_2 = m.Form.objects.create(
            name="Hydroponic public survey",
            form_id="sample2",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=True,
        )
        form_2_file_mock = mock.MagicMock(spec=File)
        form_2_file_mock.name = "test.xml"
        cls.form_2.form_versions.create(file=form_2_file_mock, version_id="2020022401")
        cls.form_2.org_unit_types.add(cls.jedi_council)
        cls.create_form_instance(
            form=cls.form_2, period="202001", org_unit=cls.jedi_council_corruscant
        )
        cls.form_2.save()

        cls.project.unit_types.add(cls.jedi_council)
        cls.project.forms.add(cls.form_1)
        cls.project.forms.add(cls.form_2)
        cls.project.save()

    @tag("iaso_only")
    def test_instance_list_by_form_id_ok(self):
        """GET /instances/?form_id=form_id"""

        response = self.client.get(f"/api/instances/?form_id={self.form_1.pk}")
        self.assertJSONResponse(response, 200)

        self.assertValidInstanceListData(response.json(), 4)

    @tag("iaso_only")
    def test_instance_list_by_form_id_and_status_ok(self):
        """GET /instances/?form_id=form_id&status="""

        response = self.client.get(
            f"/api/instances/",
            {"form_id": self.form_1.id, "status": m.Instance.STATUS_DUPLICATED},
        )
        self.assertJSONResponse(response, 200)

        self.assertValidInstanceListData(response.json(), 2)

    def assertValidInstanceListData(
        self, list_data: typing.Mapping, expected_length: int, paginated: bool = False
    ):
        self.assertValidListData(
            list_data=list_data,
            expected_length=expected_length,
            results_key="instances",
            paginated=paginated,
        )

        for instance_data in list_data["instances"]:
            self.assertValidInstanceData(instance_data)

    def assertValidInstanceData(self, instance_data: typing.Mapping):
        self.assertHasField(instance_data, "id", int)
        self.assertHasField(instance_data, "status", str)
        self.assertHasField(instance_data, "correlation_id", str, optional=True)
