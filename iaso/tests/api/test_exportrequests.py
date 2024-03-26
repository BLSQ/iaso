from unittest.mock import patch

from django.contrib.gis.geos import Point
from django.core.files.uploadedfile import UploadedFile

from iaso import models as m
from iaso.dhis2.datavalue_exporter import DataValueExporter, InstanceExportError
from iaso.dhis2.export_request_builder import ExportRequestBuilder
from iaso.test import APITestCase


class ExportRequestsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.maxDiff = None
        account = m.Account(name="Zelda")

        source = m.DataSource.objects.create(name="Korogu")
        version = m.SourceVersion.objects.create(data_source=source, number=1)
        account.default_version = version
        account.save()

        cls.project = m.Project(name="Hyrule", app_id="magic.countries.hyrule.collect", account=account)
        cls.project.save()

        source.projects.add(cls.project)

        unit_type = m.OrgUnitType(name="Village", short_name="Vil")
        unit_type.save()
        cls.project.unit_types.add(unit_type)
        cls.village_unit_type = unit_type

        user = m.User.objects.create(username="link")
        user.set_password("tiredofplayingthesameagain")
        user.save()
        p = m.Profile(user=user, account=account)
        p.save()
        cls.user = user

        cls.village_1 = m.OrgUnit.objects.create(name="Akkala", org_unit_type=unit_type, version=version)
        cls.village_2 = m.OrgUnit.objects.create(name="Kakariko", org_unit_type=unit_type, version=version)
        form = m.Form(name="Quantity FORM")
        form.period_type = "monthly"
        form.single_per_period = True
        form.save()
        cls.form = form

        form_version = m.FormVersion.objects.create(form=form, version_id=1)
        cls.form_version = form_version

        mapping = m.Mapping.objects.create(form=form, data_source=source, mapping_type="AGGREGATE")
        m.MappingVersion.objects.create(name="aggregate", form_version=form_version, mapping=mapping, json={})

    def build_instance(self, org_unit, instance_uuid, period):
        instance = m.Instance()
        instance.uuid = instance_uuid
        instance.export_id = "EVENT_DHIS2_UID"
        instance.org_unit = org_unit
        instance.json = {"question1": "1"}
        instance.location = Point(1.5, 7.3, 0)
        instance.period = period
        instance.form = self.form
        instance.project = self.project
        instance.file = UploadedFile(open("iaso/tests/fixtures/hydroponics_test_upload.xml"))
        instance.json = {"question_1": "answer1", "_version": 1}
        instance.save()
        return instance

    def uuid(self, number):
        return str(number) + "b7c3954-f69a-4b99-83b1-db73957b32b" + str(number)

    def test_exportrequests_list_without_auth(self):
        """GET /exportrequests/ without auth should result in a 401"""

        response = self.client.get("/api/exportrequests/")
        self.assertEqual(401, response.status_code)
        self.assertEqual("application/json", response["Content-Type"])

    def test_exportrequests_list(self):
        """GET /exportrequests/ should return counts"""

        self.build_instance(self.village_1, self.uuid(1), "201901")
        self.build_instance(self.village_1, self.uuid(2), "201901")
        self.build_instance(self.village_1, self.uuid(3), "201902")
        self.build_instance(self.village_1, self.uuid(4), "201903")

        self.build_instance(self.village_2, self.uuid(5), "201901")
        self.build_instance(self.village_2, self.uuid(6), "201902")

        ExportRequestBuilder().build_export_request(filters={"period_ids": "201901,201902"}, launcher=self.user)
        ExportRequestBuilder().build_export_request(filters={"period_ids": "201903"}, launcher=self.user)

        self.client.force_authenticate(self.user)

        response = self.client.get("/api/exportrequests/")
        self.assertEqual(200, response.status_code)
        self.assertEqual("application/json", response["Content-Type"])
        response_data = response.json()

        self.assertEqual(response_data["export_requests"][0]["stats"]["instance_count"], 1)
        self.assertEqual(response_data["export_requests"][0]["params"]["filters"]["period_ids"], "201903")
        self.assertEqual(response_data["export_requests"][1]["stats"]["instance_count"], 3)
        self.assertEqual(response_data["export_requests"][1]["params"]["filters"]["period_ids"], "201901,201902")

    def test_exportrequests_create_works(self):
        self.build_instance(self.village_1, self.uuid(1), "201901")
        self.build_instance(self.village_1, self.uuid(2), "201901")
        self.build_instance(self.village_1, self.uuid(3), "201902")
        self.build_instance(self.village_1, self.uuid(4), "201903")

        self.build_instance(self.village_2, self.uuid(5), "201901")
        self.build_instance(self.village_2, self.uuid(6), "201902")

        self.client.force_authenticate(self.user)

        response = self.client.post(f"/api/exportrequests/", data={"period_ids": "201901,201902"})

        self.assertEqual(201, response.status_code)
        self.assertEqual("application/json", response["Content-Type"])

    def test_exportrequests_create_ko_when_bad_filter(self):
        self.build_instance(self.village_1, self.uuid(1), "201901")
        self.client.force_authenticate(self.user)

        response = self.client.post(f"/api/exportrequests/", data={"period_ids": "204112"})

        self.assertEqual(400, response.status_code)
        self.assertEqual("application/json", response["Content-Type"])
        response_data = response.json()
        self.assertEqual(response_data["code"], "NothingToExportError")

    def test_exportrequests_create_ko_when_no_version(self):
        instance = self.build_instance(self.village_1, self.uuid(1), "201901")
        instance.json = {"demo": "noversion"}
        instance.save()

        self.client.force_authenticate(self.user)

        response = self.client.post(f"/api/exportrequests/", data={"period_ids": "201901"})

        self.assertEqual(400, response.status_code)
        self.assertEqual("application/json", response["Content-Type"])
        response_data = response.json()
        self.assertEqual(
            response_data,
            {
                "code": "NoVersionError",
                "message": "No version specified (_version or version) in instance json : "
                + str(instance.id)
                + " {'demo': 'noversion'}",
            },
        )

    def test_udpate(self):
        self.client.force_authenticate(self.user)

        self.build_instance(self.village_1, self.uuid(1), "201901")
        self.build_instance(self.village_2, self.uuid(2), "201901")
        ExportRequestBuilder().build_export_request(filters={"period_ids": "201901,201902"}, launcher=self.user)
        export_request = m.ExportRequest.objects.first()

        with patch.object(DataValueExporter, "export_instances", return_value=None):
            response = self.client.put(f"/api/exportrequests/{export_request.pk}/", format="json")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data["id"], export_request.pk)

        error = InstanceExportError("Error", {}, ["Error"])
        with patch.object(DataValueExporter, "export_instances", side_effect=error):
            response = self.client.put(f"/api/exportrequests/{export_request.pk}/", format="json")
            self.assertEqual(response.status_code, 409)
            self.assertEqual(response.data["code"], "InstanceExportError")
            self.assertEqual(response.data["message"], "InstanceExportError, Error : Error ")
