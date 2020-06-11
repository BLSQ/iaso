import json
import responses
from django.core.files.uploadedfile import UploadedFile
from collections import namedtuple
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
)

import os
from datetime import datetime
from iaso.dhis2.datavalue_exporter import (
    DataValueExporter,
    InstanceExportError,
    EventTrackerHandler,
)
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
                {
                    "trackedEntityAttribute": {
                        "name": "Heure d'enrôlement",
                        "id": "GEVwwkMbGKz",
                        "valueType": "TIME",
                    }
                }
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
                {
                    "trackedEntityAttribute": {
                        "code": "name",
                        "name": "Nom",
                        "id": "pxSXrL4uliL",
                        "valueType": "TEXT",
                    }
                }
            ],
            "ST01DE1": [
                {
                    "program": "PROGRAM_DHIS2_ID",
                    "programStage": "STAGE1_DHIS2_ID",
                    "field": "eventDate",
                }
            ],
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
            "ST02DE1": [
                {
                    "program": "PROGRAM_DHIS2_ID",
                    "programStage": "STAGE2_DHIS2_ID",
                    "field": "eventDate",
                }
            ],
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
        },
    }


def dump_attributes(obj):
    print("----- ", obj.__class__)
    for k in obj.__dict__:
        print("\t", k, obj.__dict__[k])


class DataValueExporterTests(TestCase):
    def build_instance(self, form, json):

        instance = Instance()
        instance.export_id = "EVENT_DHIS2_UID"

        instance.created_at = datetime.strptime(
            "2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p"
        )
        instance.org_unit = self.org_unit
        instance.json = json
        instance.json["version"] = self.form_version.version_id

        instance.location = Point(1.5, 7.3, 0)

        instance.file = UploadedFile(
            open("iaso/tests/fixtures/hydroponics_test_upload.xml")
        )
        instance.form = form
        instance.project = self.project
        instance.save()
        # force to past creation date
        # looks the the first save don't take it
        instance.created_at = datetime.strptime(
            "2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p"
        )
        instance.save()
        return instance

    def expect_logs(self, status):
        # TODO understand what is happening on setting.DEBUG ?
        if os.environ.get("DEBUG", "").lower() == "true":
            print("-*-*-*-*-*", self._testMethodName)
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
            form_id="patient",
            name="Patientform",
            period_type="month",
            single_per_period=True,
        )
        self.form = form

        form_version, created = FormVersion.objects.get_or_create(
            form=form, version_id="1"
        )

        self.form = form
        self.form_version = form_version

        account, account_created = Account.objects.get_or_create(
            name="Organisation Name"
        )

        user, user_created = User.objects.get_or_create(
            username="Test User Name", email="testemail@bluesquarehub.com"
        )
        self.user = user
        p = Profile(user=user, account=account)
        p.save()
        credentials, creds_created = ExternalCredentials.objects.get_or_create(
            name="Test export api",
            url="https://dhis2.com",
            login="admin",
            password="whocares",
            account=account,
        )

        datasource, _ds_created = DataSource.objects.get_or_create(
            name="reference", credentials=credentials
        )
        self.datasource = datasource
        source_version, _created = SourceVersion.objects.get_or_create(
            number=1, data_source=datasource
        )
        self.source_version = source_version

        self.project = Project(
            name="Hyrule", app_id="magic.countries.hyrule.collect", account=account
        )
        self.project.save()

        datasource.projects.add(self.project)

        org_unit = OrgUnit()
        org_unit.validated = True
        org_unit.source_ref = "OU_DHIS2_ID"
        org_unit.version = source_version
        org_unit.save()

        self.org_unit = org_unit

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
                "ST01DE1": "2019-12-01",
                "ST01DE2": "Bounty",
                "ST02DE1": "2019-12-02",
                "ST02DE2": "Raider",
            },
        )

        trackedentity, errors = EventTrackerHandler().map_to_values(
            instance, build_form_mapping()
        )
        print(trackedentity)
        self.assertEquals(
            {
                "attributes": [
                    {
                        "attribute": "GEVwwkMbGKz",
                        "value": "15:17",
                        "displayName": "Heure d'enrôlement",
                        "valueType": "TIME",
                    },
                    {
                        "attribute": "XPYFFrfVbAd",
                        "value": "CDLM-00001-45",
                        "displayName": "Numéro Unique",
                        "valueType": "TEXT",
                    },
                    {
                        "attribute": "pxSXrL4uliL",
                        "value": "Yoda",
                        "displayName": "Nom",
                        "valueType": "TEXT",
                    },
                ],
                "enrollments": [
                    {
                        "events": [
                            {
                                "program": "PROGRAM_DHIS2_ID",
                                "programStage": "STAGE1_DHIS2_ID",
                                "event": "EVENT_DHIS2_UID",
                                "orgUnit": "OU_DHIS2_ID",
                                "eventDate": "2018-02-16",
                                "status": "COMPLETED",
                                "dataValues": [
                                    {
                                        "dataElement": "ST01DE2_DHIS2_ID",
                                        "value": "Bounty",
                                    }
                                ],
                                "coordinate": {"latitude": 7.3, "longitude": 1.5},
                            },
                            {
                                "program": "PROGRAM_DHIS2_ID",
                                "programStage": "STAGE2_DHIS2_ID",
                                "event": "EVENT_DHIS2_UID",
                                "orgUnit": "OU_DHIS2_ID",
                                "eventDate": "2018-02-16",
                                "status": "COMPLETED",
                                "dataValues": [
                                    {
                                        "dataElement": "ST02DE2_DHIS2_ID",
                                        "value": "Raider",
                                    }
                                ],
                                "coordinate": {"latitude": 7.3, "longitude": 1.5},
                            },
                        ]
                    }
                ],
            },
            trackedentity[2],
        )

    @responses.activate
    def test_event_export_works_on_existing_tracked_entity(self):

        mapping_version = MappingVersion(
            name="event tracker",
            json=build_form_mapping(),
            form_version=self.form_version,
            mapping=self.mapping,
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
            filters={"form_id": self.form.id, "org_unit_id": instance.org_unit.id},
            launcher=self.user,
        )

        # mock expected calls
        responses.add(
            responses.GET,
            "https://dhis2.com/api/trackedEntityInstances.json?fields=%3Aall%2Cenrollments%5B%3Aall%2Cevents%5B%3Aall%5D%5D&ou=54dfg45re&ouMode=DESCENDANTS&trackedEntityType=54dfg45re&filter=XPYFFrfVbAd%3AEQ%3ACDLM-00001-45",
            json=load_dhis2_fixture("tracked_entity_with_enrollments.json"),
            status=200,
        )

        sent_update = []

        def request_callback(request):
            sent_update.append(json.loads(request.body))
            return (
                200,
                {},
                load_dhis2_fixture_as_string("tracked_entity_with_enrollments.json"),
            )

        responses.add_callback(
            responses.PUT,
            "https://dhis2.com/api/trackedEntityInstances/WfMWd9YYL4d",
            callback=request_callback,
        )

        # excercice
        instances_qs = Instance.objects.order_by("id").all()

        DataValueExporter().export_instances(export_request, True)

        self.expect_logs("exported")

        instance.refresh_from_db()
        self.assertIsNotNone(instance.last_export_success_at)

    @responses.activate
    def test_event_export_works_on_non_existing_tracked_entity(self):

        mapping_version = MappingVersion(
            name="event tracker",
            json=build_form_mapping(),
            form_version=self.form_version,
            mapping=self.mapping,
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
            },
        )

        export_request = ExportRequestBuilder().build_export_request(
            filters={"form_id": self.form.id, "org_unit_id": instance.org_unit.id},
            launcher=self.user,
        )

        def request_callback(request):
            import pdb

            pdb.set_trace()
            pass

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
            return (
                200,
                {},
                load_dhis2_fixture_as_string("tracked_entity_with_enrollments.json"),
            )

        responses.add_callback(
            responses.POST,
            "https://dhis2.com/api/trackedEntityInstances",
            callback=request_callback,
        )

        # excercice
        instances_qs = Instance.objects.order_by("id").all()

        DataValueExporter().export_instances(export_request, True)

        self.expect_logs("exported")

        instance.refresh_from_db()
        self.assertIsNotNone(instance.last_export_success_at)

        self.assertEqual(
            {
                "attributes": [
                    {
                        "attribute": "pxSXrL4uliL",
                        "value": "Yoda",
                        "displayName": "Nom",
                        "valueType": "TEXT",
                    },
                    {
                        "attribute": "GEVwwkMbGKz",
                        "value": "15:17",
                        "displayName": "Heure d'enrôlement",
                        "valueType": "TIME",
                    },
                    {"attribute": "XPYFFrfVbAd", "value": "787T8786"},
                ],
                "enrollments": [
                    {
                        "events": [
                            {
                                "program": "PROGRAM_DHIS2_ID",
                                "programStage": "STAGE1_DHIS2_ID",
                                "event": "EVENT_DHIS2_UID",
                                "orgUnit": "OU_DHIS2_ID",
                                "eventDate": "2018-02-16",
                                "status": "COMPLETED",
                                "dataValues": [
                                    {
                                        "dataElement": "ST01DE2_DHIS2_ID",
                                        "value": "Bounty",
                                    }
                                ],
                                "coordinate": {"latitude": 7.3, "longitude": 1.5},
                            },
                            {
                                "program": "PROGRAM_DHIS2_ID",
                                "programStage": "STAGE2_DHIS2_ID",
                                "event": "EVENT_DHIS2_UID",
                                "orgUnit": "OU_DHIS2_ID",
                                "eventDate": "2018-02-16",
                                "status": "COMPLETED",
                                "dataValues": [
                                    {
                                        "dataElement": "ST02DE2_DHIS2_ID",
                                        "value": "Raider",
                                    }
                                ],
                                "coordinate": {"latitude": 7.3, "longitude": 1.5},
                            },
                        ]
                    }
                ],
            },
            sent_create[0],
        )
