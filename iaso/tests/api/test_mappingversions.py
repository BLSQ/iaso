import tempfile

from unittest import mock

from django.core.files import File
from django.test import override_settings
from rest_framework import status

from iaso import models as m
from iaso.permissions.core_permissions import CORE_MAPPINGS_PERMISSION
from iaso.test import APITestCase


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class FormsVersionAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.maxDiff = None
        star_wars = m.Account.objects.create(name="Star Wars")
        cls.star_wars = star_wars
        dc = m.Account.objects.create(name="DC Comics")
        cls.dc = dc
        dc_source = m.DataSource.objects.create(name="Batcave")
        cls.dc_source = dc_source
        dc_version = m.SourceVersion.objects.create(data_source=dc_source, number=1)
        dc.default_version = dc_version
        dc.save()

        sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        cls.sw_source = sw_source

        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=star_wars, permissions=[CORE_MAPPINGS_PERMISSION]
        )
        cls.batman = cls.create_user_with_profile(username="batman", account=dc, permissions=[CORE_MAPPINGS_PERMISSION])

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
        cls.form_2.save()
        form_2_file_mock = mock.MagicMock(spec=File)
        form_2_file_mock.name = "test.xml"
        cls.form_2.form_versions.create(file=form_2_file_mock, version_id="2020022401")
        cls.project.forms.add(cls.form_2)

        cls.project.save()

    def test_mappingversions_update(self):
        """PUT /mappingversions/<mappingversion_id>: not authorized for now"""

        self.client.force_authenticate(self.yoda)
        response = self.client.put("/api/mappingversions/33/", data={})
        self.assertJSONResponse(response, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_mappingversions_destroy(self):
        """DELETE /mappingversions/<mappingversion_id>: not authorized for now"""

        self.client.force_authenticate(self.yoda)
        response = self.client.delete("/api/mappingversions/33/")
        self.assertJSONResponse(response, status.HTTP_405_METHOD_NOT_ALLOWED)

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
            "/api/mappingversions/" + mappingversionid + "/",
            data={"question_mappings": {"question_1": data_element_1}},
            format="json",
            headers={"accept": "application/json"},
        )
        mapping_version = self.client.get(
            "/api/mappingversions/" + mappingversionid + "/?fields=:all",
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
            "/api/mappingversions/" + mappingversionid + "/",
            data={"question_mappings": {"question_2": data_element_2}},
            format="json",
            headers={"accept": "application/json"},
        )

        mapping_version = self.client.get(
            "/api/mappingversions/" + mappingversionid + "/?fields=:all",
            format="json",
            headers={"accept": "application/json"},
        )
        self.assertEqual(mapping_version.json()["question_mappings"]["question_2"], data_element_2)
        self.client.patch(
            "/api/mappingversions/" + mappingversionid + "/",
            data={"question_mappings": {"question_2": {"action": "unmap"}}},
            format="json",
            headers={"accept": "application/json"},
        )

        mapping_version = self.client.get(
            "/api/mappingversions/" + mappingversionid + "/?fields=:all",
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
            "/api/mappingversions/",
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
            "/api/mappingversions/",
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
            "/api/mappingversions/" + mappingversionid + "/",
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
            "/api/mappingversions/" + mappingversionid + "/",
            data={"question_mappings": {"question_1": data_element_1}},
            format="json",
            headers={"accept": "application/json"},
        )

        self.assertEqual(resp.json(), {"question_mappings.question_1": "should have a valueType"})

    def test_mappingversions_list_filters_mapping_types(self):
        self.client.force_authenticate(self.yoda)
        form_version = self.create_form_version()

        self.create_mapping_version(form_version, self.sw_source)

        resp = self.client.get("/api/mappingversions/")

        self.assertEqual(len(resp.json()["mapping_versions"]), 1)

        resp = self.client.get("/api/mappingversions/?mappingTypes=EVENT")
        self.assertEqual(len(resp.json()["mapping_versions"]), 0)

        resp = self.client.get("/api/mappingversions/?mappingTypes=AGGREGATE")
        self.assertEqual(len(resp.json()["mapping_versions"]), 1)

    def test_mappingversions_list_filters_form_id(self):
        self.client.force_authenticate(self.yoda)
        form_version = self.create_form_version()

        self.create_mapping_version(form_version, self.sw_source)

        resp = self.client.get("/api/mappingversions/")

        self.assertEqual(len(resp.json()["mapping_versions"]), 1)

        resp = self.client.get(f"/api/mappingversions/?formId={self.form_1.id}")
        self.assertEqual(len(resp.json()["mapping_versions"]), 0)

        resp = self.client.get(f"/api/mappingversions/?formId={self.form_2.id}")
        self.assertEqual(len(resp.json()["mapping_versions"]), 1)

    def test_mappingversions_list_filters_org_unit_type_ids(self):
        self.client.force_authenticate(self.yoda)
        form_version = self.create_form_version()

        other_org_unit_type = m.OrgUnitType.objects.create(name="Sith Council", short_name="Cnc")

        self.create_mapping_version(form_version, self.sw_source)

        resp = self.client.get("/api/mappingversions/")

        self.assertEqual(len(resp.json()["mapping_versions"]), 1)

        resp = self.client.get(f"/api/mappingversions/?orgUnitTypeIds={self.sith_council.id}")
        self.assertEqual(len(resp.json()["mapping_versions"]), 1)

        resp = self.client.get(f"/api/mappingversions/?orgUnitTypeIds={other_org_unit_type.id}")
        self.assertEqual(len(resp.json()["mapping_versions"]), 0)

        resp = self.client.get(f"/api/mappingversions/?orgUnitTypeIds={other_org_unit_type.id},{self.sith_council.id}")
        self.assertEqual(len(resp.json()["mapping_versions"]), 1)

    def test_mappingversions_list_filters_project_ids(self):
        self.client.force_authenticate(self.yoda)
        form_version = self.create_form_version()

        self.create_mapping_version(form_version, self.sw_source)

        other_project = m.Project.objects.create(
            name="Fly me to the moon", app_id="stars.empire.flymetothemoon", account=self.dc
        )

        resp = self.client.get("/api/mappingversions/")

        self.assertEqual(len(resp.json()["mapping_versions"]), 1)

        resp = self.client.get(f"/api/mappingversions/?projectsIds={self.project.id}")
        self.assertEqual(len(resp.json()["mapping_versions"]), 1)

        resp = self.client.get(f"/api/mappingversions/?projectsIds={other_project.id}")
        self.assertEqual(len(resp.json()["mapping_versions"]), 0)

        resp = self.client.get(f"/api/mappingversions/?projectsIds={other_project.id},{self.project.id}")
        self.assertEqual(len(resp.json()["mapping_versions"]), 1)

    def test_mappingversions_bulk_patch_and_undo(self):
        """PATCH /mappingversions/<id>: several question mappings at once, as the import wizard does, then the
        payload the wizard sends to undo that import"""

        self.client.force_authenticate(self.yoda)
        form_version = self.create_form_version()
        mapping_version_id = self.create_mapping_version(form_version, self.sw_source)["id"]

        original = {
            "question_1": {"id": "de1", "valueType": "NUMBER", "categoryOptionCombo": "coc1"},
            "question_2": {"id": "de2", "valueType": "NUMBER", "categoryOptionCombo": "coc1"},
            "question_6": {"type": "neverMapped"},
        }
        response = self.patch_question_mappings(mapping_version_id, original)
        self.assertJSONResponse(response, status.HTTP_200_OK)

        imported = {
            # overwrite
            "question_2": {"id": "de2bis", "valueType": "INTEGER", "categoryOptionCombo": "coc2"},
            # overwrite a never mapped marker
            "question_6": {"id": "de6", "valueType": "NUMBER"},
            # select all that apply, no data element id at the top level
            "question_3": {"type": "multiple", "values": {"a": {"id": "de3a", "valueType": "BOOLEAN"}}},
        }
        response = self.patch_question_mappings(mapping_version_id, imported)
        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(self.get_question_mappings(mapping_version_id), {**original, **imported})

        undo = {
            "question_2": original["question_2"],
            "question_6": {"type": "neverMapped"},
            "question_3": {"action": "unmap"},
        }
        response = self.patch_question_mappings(mapping_version_id, undo)
        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(self.get_question_mappings(mapping_version_id), original)

    def test_mappingversions_bulk_patch_and_undo_event_tracker(self):
        """PATCH /mappingversions/<id>: event tracker mappings are lists, repeat groups included"""

        self.client.force_authenticate(self.yoda)
        form_version = self.create_form_version()
        mapping_version_id = self.create_tracker_mapping_version(form_version, self.sw_source)
        original = {"question_1": [{"trackedEntityAttribute": {"id": "tea1"}, "iaso_field": "instance.uuid"}]}
        self.patch_question_mappings(mapping_version_id, original)

        imported = {
            # event tracker question inside a repeat group
            "question_4": [{"dataElement": {"id": "de4"}, "programStage": "stage1", "parent": "question_5"}],
            # event tracker repeat group
            "question_5": [
                {
                    "type": "repeat",
                    "program_id": "program1",
                    "tracked_entity_type": "tet1",
                    "tracked_entity_identifier": "uid",
                    "relationship_type": "rel1",
                }
            ],
        }
        response = self.patch_question_mappings(mapping_version_id, imported)
        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(self.get_question_mappings(mapping_version_id), {**original, **imported})

        response = self.patch_question_mappings(
            mapping_version_id, {"question_4": {"action": "unmap"}, "question_5": {"action": "unmap"}}
        )
        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(self.get_question_mappings(mapping_version_id), original)

    def test_mappingversions_patch_checks_shape_for_mapping_type(self):
        """PATCH /mappingversions/<id>: a question mapping must have the shape the exporter of its type reads"""

        self.client.force_authenticate(self.yoda)
        form_version = self.create_form_version()
        aggregate_id = self.create_mapping_version(form_version, self.sw_source)["id"]
        tracker_id = self.create_tracker_mapping_version(form_version, self.sw_source)
        data_element = {"id": "de1", "valueType": "NUMBER"}

        cases = [
            (aggregate_id, [{"dataElement": {"id": "de1"}}], "should not be a list for AGGREGATE mappings"),
            (
                aggregate_id,
                {"type": "multiple", "values": {"a": {"name": "no id"}}},
                "should map each choice to a data element id",
            ),
            (aggregate_id, {"type": "multiple"}, "should map each choice to a data element id"),
            (tracker_id, data_element, "should be a list for EVENT_TRACKER mappings"),
            (tracker_id, [], "should be a list for EVENT_TRACKER mappings"),
            (tracker_id, ["de1"], "should only contain objects"),
            (tracker_id, [{"foo": 1}], "should map a data element, a tracked entity attribute or a repeat group"),
            (
                tracker_id,
                [{"type": "repeat"}],
                "should map a data element, a tracked entity attribute or a repeat group",
            ),
        ]
        for mapping_version_id, question_mapping, error in cases:
            with self.subTest(question_mapping=question_mapping):
                response = self.patch_question_mappings(mapping_version_id, {"question_1": question_mapping})
                self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
                self.assertEqual(response.json(), {"question_mappings.question_1": error})

        # never mapped markers and unmapping are valid for every mapping type
        for mapping_version_id in (aggregate_id, tracker_id):
            response = self.patch_question_mappings(mapping_version_id, {"question_1": {"type": "neverMapped"}})
            self.assertJSONResponse(response, status.HTTP_200_OK)
            response = self.patch_question_mappings(mapping_version_id, {"question_1": {"action": "unmap"}})
            self.assertJSONResponse(response, status.HTTP_200_OK)
            self.assertEqual(self.get_question_mappings(mapping_version_id), {})

    def test_mappingversions_bulk_patch_invalid_entry_saves_nothing(self):
        """PATCH /mappingversions/<id>: one invalid question mapping rejects the whole import"""

        self.client.force_authenticate(self.yoda)
        form_version = self.create_form_version()
        mapping_version_id = self.create_mapping_version(form_version, self.sw_source)["id"]
        original = {"question_1": {"id": "de1", "valueType": "NUMBER"}}
        self.patch_question_mappings(mapping_version_id, original)

        response = self.patch_question_mappings(
            mapping_version_id,
            {
                "question_1": {"action": "unmap"},
                "question_2": {"id": "de2", "valueType": "NUMBER"},
                "question_3": {"id": "de3"},
            },
        )

        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json(), {"question_mappings.question_3": "should have a valueType"})
        self.assertEqual(self.get_question_mappings(mapping_version_id), original)

    def test_mappingversions_list_import_sources_fields(self):
        """GET /mappingversions/ with the fields the import wizard needs to list its sources"""

        self.client.force_authenticate(self.yoda)
        form_version = self.create_form_version()
        mapping_version_id = self.create_mapping_version(form_version, self.sw_source)["id"]
        question_mappings = {"question_1": {"id": "de1", "valueType": "NUMBER"}}
        self.patch_question_mappings(mapping_version_id, question_mappings)

        response = self.client.get(
            "/api/mappingversions/",
            {
                "mappingTypes": "AGGREGATE",
                "fields": "id,form_version,mapping,question_mappings,derivate_settings,updated_at",
            },
        )

        mapping_versions = self.assertJSONResponse(response, status.HTTP_200_OK)["mapping_versions"]
        self.assertEqual(len(mapping_versions), 1)
        mapping_version = mapping_versions[0]
        self.assertEqual(
            set(mapping_version.keys()),
            {"id", "form_version", "mapping", "question_mappings", "derivate_settings", "updated_at"},
        )
        self.assertEqual(mapping_version["question_mappings"], question_mappings)
        self.assertEqual(mapping_version["derivate_settings"]["data_set_id"], "ERTFDG")
        self.assertEqual(mapping_version["mapping"]["data_source"]["id"], self.sw_source.id)
        self.assertEqual(mapping_version["form_version"]["form"]["id"], form_version.form_id)

    def test_mappingversions_patch_checks_questions_exist(self):
        """PATCH /mappingversions/<id>: question mappings must target a question of the form version"""

        self.client.force_authenticate(self.yoda)
        form_version = self.create_form_version()
        form_version.form_descriptor = {
            "name": "data",
            "type": "survey",
            "children": [
                {"name": "weight", "type": "decimal"},
                {"name": "household", "type": "repeat", "children": [{"name": "age", "type": "integer"}]},
                {"name": "symptoms", "type": "select all that apply", "children": [{"name": "fever"}]},
                {"name": "sex", "type": "select one", "children": [{"name": "male"}]},
            ],
        }
        form_version.save()
        mapping_version_id = self.create_mapping_version(form_version, self.sw_source)["id"]
        data_element = {"id": "de1", "valueType": "NUMBER"}

        response = self.patch_question_mappings(mapping_version_id, {"unknown": data_element})
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json(), {"question_mappings.unknown": "question does not exist in this form version"})

        response = self.patch_question_mappings(mapping_version_id, {"unknown": {"type": "neverMapped"}})
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

        # choice keys only exist for select all that apply questions (one boolean data element per choice),
        # even though copy_mappings_from_previous_version still copies the select one ones
        response = self.patch_question_mappings(mapping_version_id, {"sex__male": data_element})
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json(), {"question_mappings.sex__male": "question does not exist in this form version"}
        )

        valid = {
            "weight": data_element,
            "symptoms": {"type": "multiple", "values": {"fever": data_element}},
            "symptoms__fever": data_element,
        }
        response = self.patch_question_mappings(mapping_version_id, valid)
        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(self.get_question_mappings(mapping_version_id), valid)

        tracker_id = self.create_tracker_mapping_version(form_version, self.sw_source)
        valid_tracker = {
            "household": [{"type": "repeat", "program_id": "p1"}],
            # inside the repeat group
            "age": [{"dataElement": {"id": "de2"}, "programStage": "s1", "parent": "household"}],
        }
        response = self.patch_question_mappings(tracker_id, valid_tracker)
        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(self.get_question_mappings(tracker_id), valid_tracker)

        # a mapping left over for a question removed from the form can still be unmapped
        mapping_version = m.MappingVersion.objects.get(id=mapping_version_id)
        mapping_version.json["question_mappings"]["removed_question"] = data_element
        mapping_version.save()
        response = self.patch_question_mappings(mapping_version_id, {"removed_question": {"action": "unmap"}})
        self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(self.get_question_mappings(mapping_version_id), valid)

    def patch_question_mappings(self, mapping_version_id, question_mappings):
        return self.client.patch(
            f"/api/mappingversions/{mapping_version_id}/",
            data={"question_mappings": question_mappings},
            format="json",
            headers={"accept": "application/json"},
        )

    def get_question_mappings(self, mapping_version_id):
        return self.client.get(f"/api/mappingversions/{mapping_version_id}/?fields=:all").json()["question_mappings"]

    def create_form_version(self):
        with open("iaso/tests/fixtures/odk_form_valid_sample1_2020022401.xlsx", "rb") as xls_file:
            self.client.post(
                "/api/formversions/",
                data={"form_id": self.form_1.id, "xls_file": xls_file},
                format="multipart",
                headers={"accept": "application/json"},
            )

        return m.FormVersion.objects.all()[0]

    def create_tracker_mapping_version(self, form_version, source):
        # created directly: the API names every mapping version "", and (form_version, name) is unique
        mapping, _ = m.Mapping.objects.get_or_create(
            form=form_version.form, data_source=source, mapping_type=m.EVENT_TRACKER
        )
        return m.MappingVersion.objects.create(
            mapping=mapping,
            form_version=form_version,
            name="tracker",
            json={"question_mappings": {}, "program_id": "PRGRM"},
        ).id

    def create_mapping_version(self, form_version, source):
        resp = self.client.post(
            "/api/mappingversions/",
            data={
                "form_version": {"id": form_version.id},
                "mapping": {"type": "AGGREGATE", "datasource": {"id": source.id}},
                "dataset": {"id": "ERTFDG", "name": "My dataset name"},
            },
            format="json",
            headers={"accept": "application/json"},
        )
        return self.client.get(
            "/api/mappingversions/" + str(resp.json()["id"]) + "/?fields=:all",
            format="json",
            headers={"accept": "application/json"},
        ).json()
