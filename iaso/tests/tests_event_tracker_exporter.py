import json
import logging

import responses
from django.core.files.uploadedfile import UploadedFile

logger = logging.getLogger(__name__)
from django.test import TestCase
from django.contrib.gis.geos import Point
from iaso.models import (
    User,
    Instance,
    OrgUnit,
    Form,
    FormVersion,
    Mapping,
    MappingVersion,
    DataSource,
    SourceVersion,
    ExternalCredentials,
    Account,
    ExportLog,
    ExportRequest,
    ExportStatus,
    Profile,
    Project,
    EVENT_TRACKER,
    ERRORED,
    EXPORTED,
)
from iaso.odk import parsing
from django.core.files import File

import os
from datetime import datetime
from iaso.dhis2.datavalue_exporter import DataValueExporter, EventTrackerHandler
from ..dhis2.export_request_builder import ExportRequestBuilder


def load_dhis2_fixture(mapping_file):
    with open("./iaso/tests/fixtures/dhis2/" + mapping_file) as json_file:
        return json.load(json_file)


def load_dhis2_fixture_as_string(mapping_file):
    with open("./iaso/tests/fixtures/dhis2/" + mapping_file) as json_file:
        return json_file.read()


def build_form_mapping():
    return {
        "program_id": "PROGRAM_DHIS2_ID",
        "tracked_entity_identifier": "XPYFFrfVbAd",
        "tracked_entity_type": "54dfg45re",
        "question_mappings": {
            "tea_heure_d_enrolement": [
                {"trackedEntityAttribute": {"name": "Heure d'enrôlement", "id": "GEVwwkMbGKz", "valueType": "TIME"}}
            ],
            "tea_unique_number": [
                {
                    "trackedEntityAttribute": {
                        "code": "unique_number",
                        "name": "Numéro Unique",
                        "id": "XPYFFrfVbAd",
                        "valueType": "TEXT",
                    }
                }
            ],
            "tea_name": [
                {"trackedEntityAttribute": {"code": "name", "name": "Nom", "id": "pxSXrL4uliL", "valueType": "TEXT"}}
            ],
            "tea_zone": [
                {
                    "trackedEntityAttribute": {
                        "code": "name",
                        "name": "Nom",
                        "id": "pxSXrL4ulzone",
                        "valueType": "TEXT",
                    },
                    "iaso_field": "instance.org_unit.source_ref",
                }
            ],
            "ST01DE1": [{"program": "PROGRAM_DHIS2_ID", "programStage": "STAGE1_DHIS2_ID", "field": "eventDate"}],
            "ST01DE2": [
                {
                    "program": "PROGRAM_DHIS2_ID",
                    "programStage": "STAGE1_DHIS2_ID",
                    "compulsory": False,
                    "dataElement": {
                        "code": "C19RL02",
                        "name": "C19 - RL - Autre pathogène détecté",
                        "id": "ST01DE2_DHIS2_ID",
                        "shortName": "RL - Autre pathogène détecté",
                        "formName": "Autre pathogène détecté",
                        "valueType": "TEXT",
                    },
                }
            ],
            "ST01DE3": [
                {
                    "program": "PROGRAM_DHIS2_ID",
                    "programStage": "STAGE1_DHIS2_ID",
                    "compulsory": False,
                    "dataElement": {
                        "code": "C19RL03",
                        "name": "Zone d'enregistrement",
                        "id": "ST01DE3_DHIS2_ID",
                        "shortName": "Zone d'enregistrement",
                        "formName": "Zone d'enregistrement",
                        "valueType": "ORGANISATION_UNIT",
                    },
                    "iaso_field": "instance.org_unit.source_ref",
                }
            ],
            "ST02DE1": [{"program": "PROGRAM_DHIS2_ID", "programStage": "STAGE2_DHIS2_ID", "field": "eventDate"}],
            "ST02DE2": [
                {
                    "program": "PROGRAM_DHIS2_ID",
                    "programStage": "STAGE2_DHIS2_ID",
                    "compulsory": False,
                    "dataElement": {
                        "code": "C19RL02",
                        "name": "C19 - RL - Autre pathogène détecté",
                        "id": "ST02DE2_DHIS2_ID",
                        "shortName": "RL - Autre pathogène détecté",
                        "formName": "Autre pathogène détecté",
                        "valueType": "TEXT",
                    },
                }
            ],
            # this format ? or a complete nested "mapping"
            # "hh_repeat": [
            #    {
            #        "type": "repeat",
            #        "program_id": "related_program_id",
            #        "tracked_entity_identifier": "lZGmxYbs97q",
            #        "tracked_entity_type": "nEenWmSyUEp",
            #        "question_mappings": {
            #             "hh_unique_number": [ {...}],
            #             "hh_name": [ {...}],
            #             "hh_gender": [ {...}],
            #             "hh_weight": [ {...}],
            #     }
            #    }
            # the GOOD, coverage works, screens nearly works the same
            # the bad might interfere with main program mapping, not sure the names are "unique"
            #
            "hh_repeat": [
                {
                    "type": "repeat",
                    "program_id": "related_program_id",
                    "tracked_entity_identifier": "lZGmxYbs97q",
                    "tracked_entity_type": "nEenWmSyUEp",
                    "relationship_type": "parent-child-reltype-id",
                }
            ],
            "hh_unique_number": [
                {
                    "parent": "hh_repeat",
                    "trackedEntityAttribute": {
                        "code": "unique_number",
                        "name": "Numéro Unique",
                        "id": "XPYFFrfVbAd",
                        "valueType": "TEXT",
                    },
                }
            ],
            "hh_name": [
                {
                    "parent": "hh_repeat",
                    "trackedEntityAttribute": {
                        "code": "MMD_PER_NAM",
                        "name": "First name",
                        "id": "w75KJ2mc4zz",
                        "generated": False,
                        "valueType": "TEXT",
                    },
                }
            ],
            "hh_gender": [
                {
                    "parent": "hh_repeat",
                    "trackedEntityAttribute": {
                        "name": "Gender",
                        "id": "cejWyOfXge6",
                        "generated": False,
                        "valueType": "TEXT",
                        "optionSet": {
                            "name": "Gender",
                            "id": "pC3N9N77UmT",
                            "options": [
                                {"code": "Male", "name": "Male", "id": "rBvjJYbMCVx"},
                                {"code": "Female", "name": "Female", "id": "Mnp3oXrpAbK"},
                            ],
                        },
                    },
                }
            ],
            "hh_age": [
                {
                    "parent": "hh_repeat",
                    "program": "related_program_id",
                    "programStage": "STAGE_RELATED_DHIS2_ID",
                    "compulsory": False,
                    "dataElement": {
                        "code": "ST_REL_DE",
                        "name": "age",
                        "id": "ST_REL_DE_DHIS2_ID",
                        "shortName": "RL - Poids",
                        "formName": "Poids",
                        "valueType": "NUMBER",
                    },
                }
            ],
        },
    }


def dump_attributes(obj):
    logger.debug("----- " + str(obj.__class__))
    for k in obj.__dict__:
        logger.debug("\t" + k + str(obj.__dict__[k]))


class DataValueExporterTests(TestCase):
    def build_instance(self, form, json):

        instance = Instance()
        instance.export_id = "EVENT_DHIS2_UID"

        instance.created_at = datetime.strptime("2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p")
        instance.org_unit = self.org_unit
        instance.json = json
        instance.json["version"] = self.form_version.version_id

        instance.location = Point(1.5, 7.3, 0)

        instance.file = UploadedFile(open("iaso/tests/fixtures/hydroponics_test_upload.xml"))
        instance.form = form
        instance.project = self.project
        instance.save()
        # force to past creation date
        # looks the first save don't take it
        instance.created_at = datetime.strptime("2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p")
        instance.save()
        return instance

    def expect_logs(self, status):
        # TODO understand what is happening on setting.DEBUG ?
        if os.environ.get("DEBUG", "").lower() == "true":
            logger.debug("-*-*-*-*-*" + self._testMethodName)
            for export_log in ExportLog.objects.all():
                dump_attributes(export_log)
            for export_status in ExportStatus.objects.all():
                dump_attributes(export_status)
            for export_request in ExportRequest.objects.all():
                dump_attributes(export_request)

        for export_status in ExportStatus.objects.all():
            self.assertEquals(status, export_status.status)

        for export_request in ExportRequest.objects.all():
            self.assertIsNotNone(export_request.started_at)
            self.assertIsNotNone(export_request.ended_at)
            self.assertEquals(status, export_request.status)

    def setUp(self):
        form, created = Form.objects.get_or_create(
            form_id="patient", name="Patientform", period_type="month", single_per_period=True
        )
        self.form = form

        with open("iaso/tests/fixtures/odk_instance_repeat_group_form.xlsx", "rb") as form_version_file:
            survey = parsing.parse_xls_form(form_version_file)
            form_version = FormVersion.objects.create_for_form_and_survey(
                form=self.form, survey=survey, xls_file=File(form_version_file)
            )
            form_version.version_id = "1"  # force version to match instance files
            form_version.save()

        self.form = form
        self.form_version = form_version

        account, account_created = Account.objects.get_or_create(name="Organisation Name")

        user, user_created = User.objects.get_or_create(username="Test User Name", email="testemail@bluesquarehub.com")
        self.user = user
        p = Profile(user=user, account=account)
        p.save()
        credentials, creds_created = ExternalCredentials.objects.get_or_create(
            name="Test export api", url="https://dhis2.com", login="admin", password="whocares", account=account
        )

        datasource, _ds_created = DataSource.objects.get_or_create(name="reference", credentials=credentials)
        self.datasource = datasource
        source_version, _created = SourceVersion.objects.get_or_create(number=1, data_source=datasource)
        self.source_version = source_version

        self.project = Project(name="Hyrule", app_id="magic.countries.hyrule.collect", account=account)
        self.project.save()

        datasource.projects.add(self.project)

        org_unit = OrgUnit()
        org_unit.name = "instance orgunit"
        org_unit.validated = True
        org_unit.source_ref = "OU_DHIS2_ID"
        org_unit.version = source_version
        org_unit.save()

        self.org_unit = org_unit

        another_org_unit = OrgUnit()
        another_org_unit.name = "another_org_unit"
        another_org_unit.validated = True
        another_org_unit.source_ref = "ANOTHER_OU_DHIS2_ID"
        another_org_unit.version = source_version
        another_org_unit.save()

        self.another_org_unit = another_org_unit

        mapping = Mapping(form=form, data_source=datasource, mapping_type=EVENT_TRACKER)
        mapping.save()
        self.mapping = mapping
        self.maxDiff = None

    def test_event_mapping_works(self):
        instance = self.build_instance(
            self.form,
            {
                "tea_heure_d_enrolement": "15:17",
                "tea_unique_number": "CDLM-00001-45",
                "tea_name": "Yoda",
                "tea_zone": "1",
                "ST01DE1": "2019-12-01",
                "ST01DE2": "Bounty",
                "ST02DE1": "2019-12-02",
                "ST02DE2": "Raider",
                "ST01DE3": str(self.another_org_unit.id),
            },
        )

        trackedentity, errors = EventTrackerHandler().map_to_values(instance, build_form_mapping())

        self.assertEquals(
            {
                "orgUnit": "OU_DHIS2_ID",
                "trackedEntityType": "54dfg45re",
                "attributes": [
                    {
                        "attribute": "GEVwwkMbGKz",
                        "value": "15:17",
                        "displayName": "Heure d'enr\u00f4lement",
                        "valueType": "TIME",
                    },
                    {
                        "attribute": "XPYFFrfVbAd",
                        "value": "CDLM-00001-45",
                        "displayName": "Num\u00e9ro Unique",
                        "valueType": "TEXT",
                    },
                    {"attribute": "pxSXrL4uliL", "value": "Yoda", "displayName": "Nom", "valueType": "TEXT"},
                    {"attribute": "pxSXrL4ulzone", "displayName": "Nom", "value": "OU_DHIS2_ID", "valueType": "TEXT"},
                ],
                "enrollments": [
                    {
                        "trackedEntityType": "54dfg45re",
                        "enrollmentDate": "2018-02-16",
                        "program": "PROGRAM_DHIS2_ID",
                        "deleted": False,
                        "incidentDate": "2018-02-16",
                        "orgUnit": "OU_DHIS2_ID",
                        "events": [
                            {
                                "program": "PROGRAM_DHIS2_ID",
                                "programStage": "STAGE1_DHIS2_ID",
                                "orgUnit": "OU_DHIS2_ID",
                                "eventDate": "2018-02-16",
                                "status": "COMPLETED",
                                "dataValues": [
                                    {"dataElement": "ST01DE2_DHIS2_ID", "value": "Bounty"},
                                    {
                                        "dataElement": "ST01DE3_DHIS2_ID",
                                        "value": "OU_DHIS2_ID",  # use the invoice orgunit
                                    },
                                ],
                                "coordinate": {"latitude": 7.3, "longitude": 1.5},
                            },
                            {
                                "program": "PROGRAM_DHIS2_ID",
                                "programStage": "STAGE2_DHIS2_ID",
                                "orgUnit": "OU_DHIS2_ID",
                                "eventDate": "2018-02-16",
                                "status": "COMPLETED",
                                "dataValues": [{"dataElement": "ST02DE2_DHIS2_ID", "value": "Raider"}],
                                "coordinate": {"latitude": 7.3, "longitude": 1.5},
                            },
                        ],
                    }
                ],
            },
            trackedentity[2],
        )

    def test_event_mapping_works_event_status(self):
        instance = self.build_instance(
            self.form,
            {
                "tea_heure_d_enrolement": "15:17",
                "tea_unique_number": "CDLM-00001-45",
                "tea_name": "Yoda",
                "tea_zone": "1",
                "ST01DE1": "2019-12-01",
                "ST01DE2": "Bounty",
                "ST02DE1": "2019-12-02",
                "ST02DE2": "Raider",
                "ST01DE3": str(self.another_org_unit.id),
                "status_STAGE1_DHIS2_ID": "active",
            },
        )

        trackedentity, errors = EventTrackerHandler().map_to_values(instance, build_form_mapping())

        self.assertEquals(
            {
                "orgUnit": "OU_DHIS2_ID",
                "trackedEntityType": "54dfg45re",
                "attributes": [
                    {
                        "attribute": "GEVwwkMbGKz",
                        "value": "15:17",
                        "displayName": "Heure d'enr\u00f4lement",
                        "valueType": "TIME",
                    },
                    {
                        "attribute": "XPYFFrfVbAd",
                        "value": "CDLM-00001-45",
                        "displayName": "Num\u00e9ro Unique",
                        "valueType": "TEXT",
                    },
                    {"attribute": "pxSXrL4uliL", "value": "Yoda", "displayName": "Nom", "valueType": "TEXT"},
                    {"attribute": "pxSXrL4ulzone", "displayName": "Nom", "value": "OU_DHIS2_ID", "valueType": "TEXT"},
                ],
                "enrollments": [
                    {
                        "trackedEntityType": "54dfg45re",
                        "enrollmentDate": "2018-02-16",
                        "program": "PROGRAM_DHIS2_ID",
                        "deleted": False,
                        "incidentDate": "2018-02-16",
                        "orgUnit": "OU_DHIS2_ID",
                        "events": [
                            {
                                "program": "PROGRAM_DHIS2_ID",
                                "programStage": "STAGE1_DHIS2_ID",
                                "orgUnit": "OU_DHIS2_ID",
                                "eventDate": "2018-02-16",
                                "status": "ACTIVE",
                                "dataValues": [
                                    {"dataElement": "ST01DE2_DHIS2_ID", "value": "Bounty"},
                                    {
                                        "dataElement": "ST01DE3_DHIS2_ID",
                                        "value": "OU_DHIS2_ID",  # use the invoice orgunit
                                    },
                                ],
                                "coordinate": {"latitude": 7.3, "longitude": 1.5},
                            },
                            {
                                "program": "PROGRAM_DHIS2_ID",
                                "programStage": "STAGE2_DHIS2_ID",
                                "orgUnit": "OU_DHIS2_ID",
                                "eventDate": "2018-02-16",
                                "status": "COMPLETED",
                                "dataValues": [{"dataElement": "ST02DE2_DHIS2_ID", "value": "Raider"}],
                                "coordinate": {"latitude": 7.3, "longitude": 1.5},
                            },
                        ],
                    }
                ],
            },
            trackedentity[2],
        )

    def test_event_mapping_orgunit_intent_works(self):
        instance = self.build_instance(
            self.form,
            {
                "tea_heure_d_enrolement": "15:17",
                "tea_unique_number": "CDLM-00001-45",
                "tea_name": "Yoda",
                "tea_zone": "1",
                "ST01DE1": "2019-12-01",
                "ST01DE2": "Bounty",
                "ST02DE1": "2019-12-02",
                "ST02DE2": "Raider",
                "ST01DE3": str(self.another_org_unit.id),
            },
        )
        mapping_json = build_form_mapping()
        del mapping_json["question_mappings"]["ST01DE3"][0]["iaso_field"]

        trackedentity, errors = EventTrackerHandler().map_to_values(instance, mapping_json)

        self.assertEquals(
            {
                "orgUnit": "OU_DHIS2_ID",
                "trackedEntityType": "54dfg45re",
                "attributes": [
                    {
                        "attribute": "GEVwwkMbGKz",
                        "value": "15:17",
                        "displayName": "Heure d'enr\u00f4lement",
                        "valueType": "TIME",
                    },
                    {
                        "attribute": "XPYFFrfVbAd",
                        "value": "CDLM-00001-45",
                        "displayName": "Num\u00e9ro Unique",
                        "valueType": "TEXT",
                    },
                    {"attribute": "pxSXrL4uliL", "value": "Yoda", "displayName": "Nom", "valueType": "TEXT"},
                    {"attribute": "pxSXrL4ulzone", "displayName": "Nom", "value": "OU_DHIS2_ID", "valueType": "TEXT"},
                ],
                "enrollments": [
                    {
                        "trackedEntityType": "54dfg45re",
                        "enrollmentDate": "2018-02-16",
                        "program": "PROGRAM_DHIS2_ID",
                        "deleted": False,
                        "incidentDate": "2018-02-16",
                        "orgUnit": "OU_DHIS2_ID",
                        "events": [
                            {
                                "program": "PROGRAM_DHIS2_ID",
                                "programStage": "STAGE1_DHIS2_ID",
                                "orgUnit": "OU_DHIS2_ID",
                                "eventDate": "2018-02-16",
                                "status": "COMPLETED",
                                "dataValues": [
                                    {"dataElement": "ST01DE2_DHIS2_ID", "value": "Bounty"},
                                    {"dataElement": "ST01DE3_DHIS2_ID", "value": "ANOTHER_OU_DHIS2_ID"},
                                ],
                                "coordinate": {"latitude": 7.3, "longitude": 1.5},
                            },
                            {
                                "program": "PROGRAM_DHIS2_ID",
                                "programStage": "STAGE2_DHIS2_ID",
                                "orgUnit": "OU_DHIS2_ID",
                                "eventDate": "2018-02-16",
                                "status": "COMPLETED",
                                "dataValues": [{"dataElement": "ST02DE2_DHIS2_ID", "value": "Raider"}],
                                "coordinate": {"latitude": 7.3, "longitude": 1.5},
                            },
                        ],
                    }
                ],
            },
            trackedentity[2],
        )

    @responses.activate
    def test_event_export_works_on_existing_tracked_entity(self):

        mapping_version = MappingVersion(
            name="event tracker", json=build_form_mapping(), form_version=self.form_version, mapping=self.mapping
        )
        mapping_version.save()
        # setup
        # persist an instance
        instance = self.build_instance(
            self.form,
            {
                "tea_heure_d_enrolement": "15:17",
                "tea_unique_number": "CDLM-00001-45",
                "tea_name": "Yoda",
                "ST01DE1": "2019-12-01",
                "ST01DE2": "Bounty",
                "ST02DE1": "2019-12-02",
                "ST02DE2": "Raider",
            },
        )

        export_request = ExportRequestBuilder().build_export_request(
            filters={"form_id": self.form.id, "org_unit_id": instance.org_unit.id}, launcher=self.user
        )

        # mock expected calls
        responses.add(
            responses.GET,
            "https://dhis2.com/api/trackedEntityInstances.json?fields=%3Aall%2Cenrollments%5B%3Aall%2Cevents%5B%3Aall%5D%5D&ou=OU_DHIS2_ID&ouMode=DESCENDANTS&trackedEntityType=54dfg45re&filter=XPYFFrfVbAd%3AEQ%3ACDLM-00001-45",
            json=load_dhis2_fixture("tracked_entity_with_enrollments.json"),
            status=200,
        )

        sent_update = []

        def request_callback(request):
            sent_update.append(json.loads(request.body))
            return (200, {}, load_dhis2_fixture_as_string("tracked_entity_with_enrollments.json"))

        responses.add_callback(
            responses.PUT, "https://dhis2.com/api/trackedEntityInstances/WfMWd9YYL4d", callback=request_callback
        )

        DataValueExporter().export_instances(export_request)

        self.expect_logs(EXPORTED)

        instance.refresh_from_db()
        self.assertIsNotNone(instance.last_export_success_at)

    @responses.activate
    def test_event_export_works_on_non_existing_tracked_entity_with_related_program(
        self,
    ):

        mapping_version = MappingVersion(
            name="event tracker", json=build_form_mapping(), form_version=self.form_version, mapping=self.mapping
        )
        mapping_version.save()
        # setup
        # persist an instance
        instance = self.build_instance(
            self.form,
            {
                "tea_heure_d_enrolement": "15:17",
                "tea_name": "Yoda",
                "ST01DE1": "2019-12-01",
                "ST01DE2": "Bounty",
                "ST02DE1": "2019-12-02",
                "ST02DE2": "Raider",
                "hh_repeat": [
                    {
                        "hh_name": "household 1",
                        "hh_gender": "Male",
                        "hh_age": "42",
                        "hh_street": "streeet 1",
                        "hh_number": "44b",
                        "hh_city": "bxl",
                    },
                    {
                        "hh_name": "household 2",
                        "hh_gender": "Female",
                        "hh_age": "11",
                        "hh_street": "street b",
                        "hh_number": "45",
                        "hh_city": "Namur",
                    },
                ],
            },
        )

        export_request = ExportRequestBuilder().build_export_request(
            filters={"form_id": self.form.id, "org_unit_id": instance.org_unit.id}, launcher=self.user
        )

        # mock expected calls
        responses.add(
            responses.GET,
            "https://dhis2.com/api/organisationUnits/OU_DHIS2_ID.json?fields=id%2Cname%2Ccode",
            json=load_dhis2_fixture("tracked_entity_orgunit.json"),
            status=200,
        )

        # main event tracked entity
        responses.add(
            responses.GET,
            "https://dhis2.com/api/trackedEntityAttributes/XPYFFrfVbAd/generate.json?ORG_UNIT_CODE=47897",
            json=load_dhis2_fixture("tracked_entity_attribute_generate.json"),
            status=200,
        )

        # related program event tracked entity
        responses.add(
            responses.GET,
            "https://dhis2.com/api/trackedEntityAttributes/lZGmxYbs97q/generate.json?ORG_UNIT_CODE=47897",
            json={
                "ownerObject": "TRACKEDENTITYATTRIBUTE",
                "ownerUid": "rSudwSeXTKQ",
                "key": "787RANDOM(X####)",
                "value": "787T8701",
                "created": "2020-06-11T12:42:56.625",
                "expiryDate": "2020-06-14T12:42:56.625",
            },
            status=200,
        )

        responses.add(
            responses.GET,
            "https://dhis2.com/api/trackedEntityAttributes/lZGmxYbs97q/generate.json?ORG_UNIT_CODE=47897",
            json={
                "ownerObject": "TRACKEDENTITYATTRIBUTE",
                "ownerUid": "rSudwSeXTKQ",
                "key": "787RANDOM(X####)",
                "value": "787T8702",
                "created": "2020-06-11T12:42:56.625",
                "expiryDate": "2020-06-14T12:42:56.625",
            },
            status=200,
        )

        sent_create = []

        def request_callback(request):
            sent_create.append(json.loads(request.body))
            resp = load_dhis2_fixture("event-tracker-tei-create.json")
            resp["response"]["importSummaries"][0]["reference"] = "TEI-" + str(len(sent_create))
            return (200, {}, json.dumps(resp))

        responses.add_callback(
            responses.POST, "https://dhis2.com/api/trackedEntityInstances", callback=request_callback
        )

        sent_relation_ship_create = []

        def request_relation_ship_callback(request):
            request_payload = json.loads(request.body)
            sent_relation_ship_create.append(request_payload)
            resp = load_dhis2_fixture("event-tracker-tei-create.json")
            return (200, {}, json.dumps(resp))

        responses.add_callback(
            responses.POST, "https://dhis2.com/api/relationships", callback=request_relation_ship_callback
        )

        DataValueExporter().export_instances(export_request)

        self.expect_logs(EXPORTED)

        instance.refresh_from_db()
        self.assertIsNotNone(instance.last_export_success_at)

        self.assertEqual(
            {
                "orgUnit": "OU_DHIS2_ID",
                "trackedEntityType": "54dfg45re",
                "attributes": [
                    {"attribute": "pxSXrL4uliL", "value": "Yoda", "displayName": "Nom", "valueType": "TEXT"},
                    {
                        "attribute": "GEVwwkMbGKz",
                        "value": "15:17",
                        "displayName": "Heure d'enr\u00f4lement",
                        "valueType": "TIME",
                    },
                    {"attribute": "XPYFFrfVbAd", "value": "787T8786"},
                ],
                "enrollments": [
                    {
                        "trackedEntityType": "54dfg45re",
                        "enrollmentDate": "2018-02-16",
                        "program": "PROGRAM_DHIS2_ID",
                        "deleted": False,
                        "incidentDate": "2018-02-16",
                        "orgUnit": "OU_DHIS2_ID",
                        "events": [
                            {
                                "program": "PROGRAM_DHIS2_ID",
                                "programStage": "STAGE1_DHIS2_ID",
                                "orgUnit": "OU_DHIS2_ID",
                                "eventDate": "2018-02-16",
                                "status": "COMPLETED",
                                "dataValues": [{"dataElement": "ST01DE2_DHIS2_ID", "value": "Bounty"}],
                                "coordinate": {"latitude": 7.3, "longitude": 1.5},
                            },
                            {
                                "program": "PROGRAM_DHIS2_ID",
                                "programStage": "STAGE2_DHIS2_ID",
                                "orgUnit": "OU_DHIS2_ID",
                                "eventDate": "2018-02-16",
                                "status": "COMPLETED",
                                "dataValues": [{"dataElement": "ST02DE2_DHIS2_ID", "value": "Raider"}],
                                "coordinate": {"latitude": 7.3, "longitude": 1.5},
                            },
                        ],
                    }
                ],
            },
            sent_create[0],
        )

        self.assertEqual(len(sent_create), 3)

        print(sent_create[1])
        self.assertEqual(
            {
                "orgUnit": "OU_DHIS2_ID",
                "trackedEntityType": "nEenWmSyUEp",
                "attributes": [
                    {
                        "attribute": "w75KJ2mc4zz",
                        "value": "household 1",
                        "displayName": "First name",
                        "valueType": "TEXT",
                    },
                    {"attribute": "cejWyOfXge6", "value": "Male", "displayName": "Gender", "valueType": "TEXT"},
                    {"attribute": "lZGmxYbs97q", "value": "787T8701"},
                ],
                "enrollments": [
                    {
                        "trackedEntityType": "nEenWmSyUEp",
                        "enrollmentDate": "2018-02-16",
                        "program": "related_program_id",
                        "deleted": False,
                        "incidentDate": "2018-02-16",
                        "orgUnit": "OU_DHIS2_ID",
                        "events": [
                            {
                                "program": "related_program_id",
                                "programStage": "STAGE_RELATED_DHIS2_ID",
                                "orgUnit": "OU_DHIS2_ID",
                                "eventDate": "2018-02-16",
                                "status": "COMPLETED",
                                "dataValues": [{"dataElement": "ST_REL_DE_DHIS2_ID", "value": 42}],
                                "coordinate": {"latitude": 7.3, "longitude": 1.5},
                            }
                        ],
                    }
                ],
            },
            sent_create[1],
        )

        self.assertEqual(
            {
                "orgUnit": "OU_DHIS2_ID",
                "trackedEntityType": "nEenWmSyUEp",
                "attributes": [
                    {
                        "attribute": "w75KJ2mc4zz",
                        "value": "household 2",
                        "displayName": "First name",
                        "valueType": "TEXT",
                    },
                    {"attribute": "cejWyOfXge6", "value": "Female", "displayName": "Gender", "valueType": "TEXT"},
                    {"attribute": "lZGmxYbs97q", "value": "787T8702"},
                ],
                "enrollments": [
                    {
                        "trackedEntityType": "nEenWmSyUEp",
                        "enrollmentDate": "2018-02-16",
                        "program": "related_program_id",
                        "deleted": False,
                        "incidentDate": "2018-02-16",
                        "orgUnit": "OU_DHIS2_ID",
                        "events": [
                            {
                                "program": "related_program_id",
                                "programStage": "STAGE_RELATED_DHIS2_ID",
                                "orgUnit": "OU_DHIS2_ID",
                                "eventDate": "2018-02-16",
                                "status": "COMPLETED",
                                "dataValues": [{"dataElement": "ST_REL_DE_DHIS2_ID", "value": 11}],
                                "coordinate": {"latitude": 7.3, "longitude": 1.5},
                            }
                        ],
                    }
                ],
            },
            sent_create[2],
        )

        self.assertEqual(
            [
                {
                    "from": {"trackedEntityInstance": {"trackedEntityInstance": "TEI-1"}},
                    "relationshipType": "parent-child-reltype-id",
                    "to": {"trackedEntityInstance": {"trackedEntityInstance": "TEI-2"}},
                },
                {
                    "from": {"trackedEntityInstance": {"trackedEntityInstance": "TEI-1"}},
                    "relationshipType": "parent-child-reltype-id",
                    "to": {"trackedEntityInstance": {"trackedEntityInstance": "TEI-3"}},
                },
            ],
            sent_relation_ship_create,
        )

    @responses.activate
    def test_event_export_handle_409_error(self):

        mapping_version = MappingVersion(
            name="event tracker", json=build_form_mapping(), form_version=self.form_version, mapping=self.mapping
        )
        mapping_version.save()
        # setup
        # persist an instance
        instance = self.build_instance(
            self.form,
            {
                "tea_heure_d_enrolement": "15:17",
                "tea_name": "Yoda",
                "ST01DE1": "2019-12-01",
                "ST01DE2": "Bounty",
                "ST01DE3": str(self.another_org_unit.id),
                "ST02DE1": "2019-12-02",
                "ST02DE2": "Raider",
            },
        )

        export_request = ExportRequestBuilder().build_export_request(
            filters={"form_id": self.form.id, "org_unit_id": instance.org_unit.id}, launcher=self.user
        )

        # mock expected calls
        responses.add(
            responses.GET,
            "https://dhis2.com/api/organisationUnits/OU_DHIS2_ID.json?fields=id%2Cname%2Ccode",
            json=load_dhis2_fixture("tracked_entity_orgunit.json"),
            status=200,
        )

        responses.add(
            responses.GET,
            "https://dhis2.com/api/trackedEntityAttributes/XPYFFrfVbAd/generate.json?ORG_UNIT_CODE=47897",
            json=load_dhis2_fixture("tracked_entity_attribute_generate.json"),
            status=200,
        )

        sent_create = []

        def request_callback(request):
            sent_create.append(json.loads(request.body))
            return (409, {}, load_dhis2_fixture_as_string("tracked_entity_export_error.json"))

        responses.add_callback(
            responses.POST, "https://dhis2.com/api/trackedEntityInstances", callback=request_callback
        )

        DataValueExporter().export_instances(export_request)

        self.expect_logs(ERRORED)

        instance.refresh_from_db()
        self.assertIsNone(instance.last_export_success_at)
