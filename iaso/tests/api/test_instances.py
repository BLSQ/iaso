import typing

from django.test import tag
from django.core.files import File
from unittest import mock

from iaso import models as m
from iaso.test import APITestCase

import hat.vector_control.models as hatmodels


class InstancesAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")

        sw_source = m.DataSource.objects.create(name="Evil Empire")
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()

        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=star_wars, permissions=["iaso_forms"]
        )

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
            form=cls.form_1,
            period="202001",
            org_unit=cls.jedi_council_corruscant,
            project=cls.project,
        )
        cls.create_form_instance(
            form=cls.form_1,
            period="202002",
            org_unit=cls.jedi_council_corruscant,
            project=cls.project,
        )
        cls.create_form_instance(
            form=cls.form_1,
            period="202002",
            org_unit=cls.jedi_council_corruscant,
            project=cls.project,
        )
        cls.create_form_instance(
            form=cls.form_1,
            period="202003",
            org_unit=cls.jedi_council_corruscant,
            project=cls.project,
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
    def test_instance_list_by_form_id_permission_denied_when_anonymous(self):
        """GET /instances/?form_id=form_id"""
        instance = self.form_1.instances.first()
        response = self.client.get(f"/api/instances/{instance.pk}/")
        self.assertJSONResponse(response, 403)

    @tag("iaso_only")
    def test_instance_details_permission_denied_when_anonymous(self):
        """GET /instances/?form_id=form_id"""
        response = self.client.get(f"/api/instances/?form_id={self.form_1.pk}")
        self.assertJSONResponse(response, 403)

    @tag("iaso_only")
    def test_instance_create_works_when_anonymous(self):
        """CREATE /instances/"""

        body = [
            {
                "id": "uuid",
                "latitude": 4.4,
                "created_at": 1565258153704,
                "updated_at": 1565258153704,
                "orgUnitId": self.jedi_council_corruscant.id,
                "formId": self.form_1.id,
                "longitude": 4.4,
                "accuracy": 10,
                # passing the altitude parameter here, as the mobile app seems to send it - we will ignore it
                "altitude": 100,
                "file": "\/storage\/emulated\/0\/odk\/instances\/RDC Collecte Data DPS_2_2019-08-08_11-54-46\/RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml",
                "name": "1",
            }
        ]
        response = self.client.post(f"/api/instances/", data=body, format="json")
        self.assertEqual(response.status_code, 200)

        last_import = hatmodels.APIImport.objects.all().last()
        self.assertEquals(last_import.import_type, "instance")
        self.assertEquals(last_import.has_problem, False)
        self.assertEquals(last_import.json_body, body)
        self.assertEquals(last_import.user, None)

        last_instance = m.Instance.objects.last()

        self.assertEquals(
            "RDC Collecte Data DPS_2_2019-08-08_11-54-46.xml", last_instance.file_name
        )
        self.assertEquals(None, last_instance.project)

    @tag("iaso_only")
    def test_instance_list_by_form_id_ok(self):
        """GET /instances/?form_id=form_id"""

        self.client.force_authenticate(self.yoda)

        response = self.client.get(f"/api/instances/?form_id={self.form_1.pk}")
        self.assertJSONResponse(response, 200)

        self.assertValidInstanceListData(response.json(), 4)

    @tag("iaso_only")
    def test_instance_list_by_form_id_ok_soft_deleted(self):
        """GET /instances/?form_id=form_id"""

        self.client.force_authenticate(self.yoda)

        response = self.client.get(f"/api/instances/?form_id={self.form_1.pk}")
        self.assertJSONResponse(response, 200)
        self.assertValidInstanceListData(response.json(), 4)

        soft_deleted_instance = self.form_1.instances.first()
        soft_deleted_instance.deleted = True
        soft_deleted_instance.save()

        response = self.client.get(f"/api/instances/?form_id={self.form_1.pk}")
        self.assertJSONResponse(response, 200)
        self.assertValidInstanceListData(response.json(), 3)

    @tag("iaso_only")
    def test_instance_details_by_id_ok_soft_deleted(self):
        """GET /instances/{instanceid}/"""

        soft_deleted_instance = self.form_1.instances.first()
        soft_deleted_instance.deleted = True
        soft_deleted_instance.save()

        self.client.force_authenticate(self.yoda)

        response = self.client.get(f"/api/instances/{soft_deleted_instance.id}/")
        self.assertJSONResponse(response, 200)

    @tag("iaso_only")
    def test_instance_list_by_form_id_and_status_ok(self):
        """GET /instances/?form_id=form_id&status="""
        self.client.force_authenticate(self.yoda)

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
