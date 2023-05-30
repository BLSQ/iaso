import json
import logging

import responses

logger = logging.getLogger(__name__)
from django.core.files.uploadedfile import UploadedFile
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
    EVENT,
    ERRORED,
    EXPORTED,
)

import os
from datetime import datetime
from iaso.dhis2.datavalue_exporter import DataValueExporter, InstanceExportError, EventHandler
from ..dhis2.export_request_builder import ExportRequestBuilder


def load_dhis2_fixture(mapping_file):
    with open("./iaso/tests/fixtures/dhis2/" + mapping_file) as json_file:
        return json.load(json_file)


def build_form_mapping():
    return {
        "program_id": "PROGRAM_DHIS2_ID",
        "question_mappings": {
            "question1": {"id": "DE_DHIS2_ID", "valueType": "INTEGER"},
            "question2": {
                "type": "multiple",
                "values": {
                    "1": {"id": "DE_DHIS2_ID_BOOL1", "valueType": "BOOLEAN"},
                    "2": {"id": "DE_DHIS2_ID_BOOL2", "valueType": "BOOLEAN"},
                    "3": {"id": "DE_DHIS2_ID_BOOL3", "valueType": "BOOLEAN"},
                },
            },
            "question3": {"type": MappingVersion.QUESTION_MAPPING_NEVER_MAPPED},
        },
    }


def dump_attributes(obj):
    logger.debug("----- " + str(obj.__class__))
    for k in obj.__dict__:
        logger.debug("\t" + k + str(obj.__dict__[k]))


class DataValueExporterTests(TestCase):
    def build_instance(self, form):
        instance = Instance()
        instance.export_id = "EVENT_DHIS2_UID"

        instance.created_at = datetime.strptime("2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p")
        instance.org_unit = self.org_unit
        if form == self.form:
            instance.period = "201801"
            instance.json = {"question1": "1", "version": self.form_version.version_id}
        else:
            instance.period = "2018Q1"
            instance.json = {"question1": "1", "version": self.form_quality_version.version_id}

        instance.location = Point(1.5, 7.3, 0)

        instance.file = UploadedFile(open("iaso/tests/fixtures/hydroponics_test_upload.xml"))
        instance.form = form
        instance.project = self.project
        instance.save()
        # force to past creation date
        # looks the the first save don't take it
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

        form_version, created = FormVersion.objects.get_or_create(form=form, version_id="1")

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
        org_unit.validated = True
        org_unit.source_ref = "OU_DHIS2_ID"
        org_unit.version = source_version
        org_unit.save()

        self.org_unit = org_unit

        mapping = Mapping(form=form, data_source=datasource, mapping_type=EVENT)
        mapping.save()
        self.mapping = mapping

    def test_error_handling_support_various_versions(self):
        versions = ("229", "230", "231", "232", "233")
        testcases = ["event-create-error-" + version + ".json" for version in versions]

        for testcase in testcases:
            exception = EventHandler().handle_exception(load_dhis2_fixture(testcase), "error")
            self.assertIsNotNone(exception)

    def test_event_mapping_works(self):
        event, errors = EventHandler().map_to_values(self.build_instance(self.form), build_form_mapping())

        self.assertEquals(
            {
                "dataValues": [{"dataElement": "DE_DHIS2_ID", "value": 1}],
                "event": "EVENT_DHIS2_UID",
                "coordinate": {"latitude": 7.3, "longitude": 1.5},
                "eventDate": "2018-02-16",
                "orgUnit": "OU_DHIS2_ID",
                "program": "PROGRAM_DHIS2_ID",
                "status": "COMPLETED",
            },
            event,
        )

    def test_event_mapping_works_for_none(self):
        instance = self.build_instance(self.form)
        instance.json = {"question1": None}
        instance.save()

        event, errors = EventHandler().map_to_values(instance, build_form_mapping())
        self.assertEquals(
            {
                "dataValues": [{"dataElement": "DE_DHIS2_ID", "value": None}],
                "event": "EVENT_DHIS2_UID",
                "coordinate": {"latitude": 7.3, "longitude": 1.5},
                "eventDate": "2018-02-16",
                "orgUnit": "OU_DHIS2_ID",
                "program": "PROGRAM_DHIS2_ID",
                "status": "COMPLETED",
            },
            event,
        )

    def test_event_maps_multi_select(self):
        instance = self.build_instance(self.form)
        instance.json = {"question2": "1 2"}
        instance.save()

        event, errors = EventHandler().map_to_values(instance, build_form_mapping())

        self.assertEquals(
            event,
            {
                "program": "PROGRAM_DHIS2_ID",
                "event": "EVENT_DHIS2_UID",
                "orgUnit": "OU_DHIS2_ID",
                "eventDate": "2018-02-16",
                "status": "COMPLETED",
                "dataValues": [
                    {"dataElement": "DE_DHIS2_ID_BOOL1", "value": True},
                    {"dataElement": "DE_DHIS2_ID_BOOL2", "value": True},
                    {"dataElement": "DE_DHIS2_ID_BOOL3", "value": False},
                ],
                "coordinate": {"latitude": 7.3, "longitude": 1.5},
            },
        )

    @responses.activate
    def test_event_export_works(self):
        mapping_version = MappingVersion(
            name="event", json=build_form_mapping(), form_version=self.form_version, mapping=self.mapping
        )
        mapping_version.save()
        # setup
        # persist an instance
        instance = self.build_instance(self.form)

        export_request = ExportRequestBuilder().build_export_request(
            filters={"period_ids": "201801", "form_id": self.form.id, "org_unit_id": instance.org_unit.id},
            launcher=self.user,
        )
        # mock expected calls

        responses.add(
            responses.POST, "https://dhis2.com/api/events", json=load_dhis2_fixture("datavalues-ok.json"), status=200
        )

        DataValueExporter().export_instances(export_request)
        self.expect_logs(EXPORTED)

        instance.refresh_from_db()
        self.assertIsNotNone(instance.last_export_success_at)

    @responses.activate
    def test_event_export_handle_errors(self):
        mapping_version = MappingVersion(
            name="event", json=build_form_mapping(), form_version=self.form_version, mapping=self.mapping
        )
        mapping_version.save()
        # setup
        # persist an instance
        instance = self.build_instance(self.form)

        export_request = ExportRequestBuilder().build_export_request(
            filters={"period_ids": "201801", "form_id": self.form.id, "org_unit_id": instance.org_unit.id},
            launcher=self.user,
        )
        # mock expected calls

        responses.add(
            responses.POST,
            "https://dhis2.com/api/events",
            json=load_dhis2_fixture("event-create-error-230-notassigned.json"),
            status=200,
        )

        with self.assertRaises(InstanceExportError) as context:
            DataValueExporter().export_instances(export_request)
            self.expect_logs("exported")

            instance.refresh_from_db()
            self.assertIsNotNone(instance.last_export_success_at)

        self.expect_logs(ERRORED)

        self.assertEquals(
            "ERROR while processing page 1/1 : Program is not assigned to this organisation unit: YuQRtpLP10I",
            context.exception.message,
        )
        instance.refresh_from_db()
        self.assertIsNone(instance.last_export_success_at)
