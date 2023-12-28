import tempfile
from unittest import mock

from django.core.files import File
from django.test import override_settings

from iaso import models as m
from iaso.test import APITestCase


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class FormsVersionAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.maxDiff = None
        star_wars = m.Account.objects.create(name="Star Wars")
        dc = m.Account.objects.create(name="DC Comics")
        dc_source = m.DataSource.objects.create(name="Batcave")
        cls.dc_source = dc_source
        dc_version = m.SourceVersion.objects.create(data_source=dc_source, number=1)
        dc.default_version = dc_version
        dc.save()

        sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        cls.sw_source = sw_source

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_mappings"])
        cls.batman = cls.create_user_with_profile(username="batman", account=dc, permissions=["iaso_mappings"])

        cls.sith_council = m.OrgUnitType.objects.create(name="Sith Council", short_name="Cnc")

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )
        cls.project.unit_types.add(cls.sith_council)
        sw_source.projects.add(cls.project)

        cls.form_1 = m.Form.objects.create(
            name="New Land Speeder concept",  # no form_id yet (no version)
            period_type="QUARTER",
            single_per_period=True,
        )
        cls.form_1.org_unit_types.add(cls.sith_council)
        cls.form_1.save()
        cls.project.forms.add(cls.form_1)
        cls.project.save()

        cls.form_2 = m.Form.objects.create(
            name="Death Start survey", form_id="sample2", period_type="MONTH", single_per_period=False
        )
        cls.form_2.org_unit_types.add(cls.sith_council)
        cls.form_1.save()
        form_2_file_mock = mock.MagicMock(spec=File)
        form_2_file_mock.name = "test.xml"
        cls.form_2.form_versions.create(file=form_2_file_mock, version_id="2020022401")
        cls.project.forms.add(cls.form_2)

        cls.project.save()

    def test_mappingversions_update(self):
        """PUT /mappingversions/<form_id>: not authorized for now"""

        self.client.force_authenticate(self.yoda)
        response = self.client.put(f"/api/mappingversions/33/", data={})
        self.assertJSONResponse(response, 405)

    def test_mappingversions_destroy(self):
        """DELETE /formversions/<form_id>: not authorized for now"""

        self.client.force_authenticate(self.yoda)
        response = self.client.delete(f"/api/mappingversions/33/")
        self.assertJSONResponse(response, 405)

    def test_mappingversions_create_ok_first_version(self):
        """POST /mappingversions/ happy path (first version)"""

        self.client.force_authenticate(self.yoda)
        form_version = self.create_form_version()

        mapping_version = self.create_mapping_version(form_version, self.sw_source)

        self.assertEqual(mapping_version["question_mappings"], {})

        # basic for question 1
        mappingversionid = str(mapping_version["id"])

        data_element_1 = {
            "id": "dataelementDHIS2Id",
            "valueType": "NUMBER",
            "categoryOptionCombo": "cocDHIS2Id",
            # optional
            "name": "dataelement name",
            "code": "dataelement code",
        }
        self.client.patch(
            f"/api/mappingversions/" + mappingversionid + "/",
            data={"question_mappings": {"question_1": data_element_1}},
            format="json",
            headers={"accept": "application/json"},
        )
        mapping_version = self.client.get(
            f"/api/mappingversions/" + mappingversionid + "/?fields=:all",
            format="json",
            headers={"accept": "application/json"},
        )

        self.assertEqual(mapping_version.json()["question_mappings"]["question_1"], data_element_1)
        # multi select for question 2
        data_element_2 = {
            "type": "multiple",
            "values": {
                "1": {
                    "code": "CS_441_1",
                    "comment": "1. RTNC",
                    "name": "EDL - CS - 441. Infrastructures - Connectivit\u00e9 : Quelles sont les radio pouvant \u00eatre capt\u00e9es dans l'aire de sant\u00e9?1. RTNC",
                    "id": "i8fkb1AumlZ",
                    "valueType": "BOOLEAN",
                },
                "2": {
                    "code": "CS_441_2",
                    "comment": "2. Radio communautaire",
                    "name": "EDL - CS - 441. Infrastructures - Connectivit\u00e9 : Quelles sont les radio pouvant \u00eatre capt\u00e9es dans l'aire de sant\u00e9?2. Radio communautaire ",
                    "id": "WHDyo0UjPS7",
                    "valueType": "BOOLEAN",
                },
            },
        }
        self.client.patch(
            f"/api/mappingversions/" + mappingversionid + "/",
            data={"question_mappings": {"question_2": data_element_2}},
            format="json",
            headers={"accept": "application/json"},
        )

        mapping_version = self.client.get(
            f"/api/mappingversions/" + mappingversionid + "/?fields=:all",
            format="json",
            headers={"accept": "application/json"},
        )
        self.assertEqual(mapping_version.json()["question_mappings"]["question_2"], data_element_2)
        self.client.patch(
            f"/api/mappingversions/" + mappingversionid + "/",
            data={"question_mappings": {"question_2": {"action": "unmap"}}},
            format="json",
            headers={"accept": "application/json"},
        )

        mapping_version = self.client.get(
            f"/api/mappingversions/" + mappingversionid + "/?fields=:all",
            format="json",
            headers={"accept": "application/json"},
        )

        self.assertEqual(list(mapping_version.json()["question_mappings"].keys()), ["question_1"])

    def test_mappingversions_create_ok_idempotent_version(self):
        """POST /mappingversions/ happy path (first version)"""

        self.client.force_authenticate(self.yoda)
        form_version = self.create_form_version()

        mapping_version1 = self.create_mapping_version(form_version, self.sw_source)

        mapping_version2 = self.create_mapping_version(form_version, self.sw_source)
        self.assertEqual(mapping_version2["id"], mapping_version1["id"])

    def test_mappingversions_create_ko_non_allowed_datasource(self):
        """POST /mappingversions/ mapping"""

        self.client.force_authenticate(self.yoda)
        formversion = self.create_form_version()

        create_response = self.client.post(
            f"/api/mappingversions/",
            data={
                "form_version": {"id": formversion.id},
                "mapping": {"type": "AGGREGATE", "datasource": {"id": self.dc_source.id}},
                "dataset": {"id": "ERTFDG", "name": "My dataset name"},
            },
            format="json",
            headers={"accept": "application/json"},
        )

        self.assertEqual(create_response.json(), {"mapping.datasource": ["object doesn't exist"]})

    def test_mappingversions_create_ko_non_existing_form_version(self):
        """POST /mappingversions/ mapping"""

        self.client.force_authenticate(self.yoda)

        create_response = self.client.post(
            f"/api/mappingversions/",
            data={
                "form_version": {"id": 10000},
                "mapping": {"type": "AGGREGATE", "datasource": {"id": self.dc_source.id}},
                "dataset": {"id": "ERTFDG", "name": "My dataset name"},
            },
            format="json",
            headers={"accept": "application/json"},
        )

        self.assertEqual(create_response.json(), {"form_version": ["object doesn't exist"]})

    def test_mappingversions_create_ko_data_element_id(self):
        """POST /mappingversions/ unhappy path (first version)"""

        self.client.force_authenticate(self.yoda)
        form_version = self.create_form_version()

        mapping_version = self.create_mapping_version(form_version, self.sw_source)

        self.assertEqual(mapping_version["question_mappings"], {})

        mappingversionid = str(mapping_version["id"])

        data_element_1 = {"valueType": "NUMBER", "categoryOptionCombo": "cocDHIS2Id"}
        resp = self.client.patch(
            f"/api/mappingversions/" + mappingversionid + "/",
            data={"question_mappings": {"question_1": data_element_1}},
            format="json",
            headers={"accept": "application/json"},
        )

        self.assertEqual(resp.json(), {"question_mappings.question_1": "should have a least an data element id"})

    def test_mappingversions_create_ko_data_element_value_type(self):
        """POST /mappingversions/ unhappy path (first version)"""

        self.client.force_authenticate(self.yoda)
        form_version = self.create_form_version()

        mapping_version = self.create_mapping_version(form_version, self.sw_source)

        self.assertEqual(mapping_version["question_mappings"], {})

        mappingversionid = str(mapping_version["id"])

        data_element_1 = {"id": "dhis2ID"}

        resp = self.client.patch(
            f"/api/mappingversions/" + mappingversionid + "/",
            data={"question_mappings": {"question_1": data_element_1}},
            format="json",
            headers={"accept": "application/json"},
        )

        self.assertEqual(resp.json(), {"question_mappings.question_1": "should have a valueType"})

    def create_form_version(self):
        with open("iaso/tests/fixtures/odk_form_valid_sample1_2020022401.xls", "rb") as xls_file:
            self.client.post(
                f"/api/formversions/",
                data={"form_id": self.form_1.id, "xls_file": xls_file},
                format="multipart",
                headers={"accept": "application/json"},
            )

        return m.FormVersion.objects.all()[0]

    def create_mapping_version(self, form_version, source):
        resp = self.client.post(
            f"/api/mappingversions/",
            data={
                "form_version": {"id": form_version.id},
                "mapping": {"type": "AGGREGATE", "datasource": {"id": source.id}},
                "dataset": {"id": "ERTFDG", "name": "My dataset name"},
            },
            format="json",
            headers={"accept": "application/json"},
        )
        return self.client.get(
            f"/api/mappingversions/" + str(resp.json()["id"]) + "/?fields=:all",
            format="json",
            headers={"accept": "application/json"},
        ).json()
