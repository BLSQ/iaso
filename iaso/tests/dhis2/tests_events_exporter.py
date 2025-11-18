import json
import logging

import responses


logger = logging.getLogger(__name__)
import os

from datetime import datetime
from unittest import mock

from django.contrib.gis.geos import Point
from django.core.files.uploadedfile import UploadedFile
from django.test import TestCase

from iaso.dhis2.datavalue_exporter import DataValueExporter, EventHandler
from iaso.dhis2.export_request_builder import ExportRequestBuilder
from iaso.models import (
    ERRORED,
    EVENT,
    EXPORTED,
    Account,
    DataSource,
    ExportLog,
    ExportRequest,
    ExportStatus,
    ExternalCredentials,
    Form,
    FormVersion,
    Instance,
    Mapping,
    MappingVersion,
    OrgUnit,
    Profile,
    Project,
    SourceVersion,
    Task,
    User,
)


def mock_system_info_old_dhis2_version():
    responses.add(
        responses.GET,
        "https://dhis2.com/api/system/info.json",  # don't understand why this .json is necessary
        json={"version": "2.39"},
        status=200,
    )


def mock_system_info_newer_dhis2_version():
    responses.add(
        responses.GET,
        "https://dhis2.com/api/system/info.json",  # don't understand why this .json is necessary
        json={"version": "2.42"},
        status=200,
    )


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
            "question4__1": {"id": "DE_DHIS2_ID_bool4_1", "valueType": "BOOLEAN"},
            "question4__2": {"id": "DE_DHIS2_ID_bool4_2", "valueType": "BOOLEAN"},
        },
    }


def build_export_status():
    export_status = mock.MagicMock(spec=ExportStatus)
    expected_return = {
        "question4": {"type": "select all that apply", "children": [{"name": "1"}, {"name": "2"}]},
    }

    export_status.mapping_version.form_version.questions_by_name.return_value = expected_return

    return export_status


def dump_attributes(obj):
    logger.debug("----- " + str(obj.__class__))
    for k in obj.__dict__:
        logger.debug("\t" + k + str(obj.__dict__[k]))


class DataValueExporterTests(TestCase):
    def build_instance(self, form):
        instance = Instance()
        instance.export_id = "EVENT_DHIS2_UID"

        instance.source_created_at = datetime.strptime("2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p")
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
        instance.source_created_at = datetime.strptime("2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p")
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
            self.assertEqual(status, export_status.status)

        for export_request in ExportRequest.objects.all():
            self.assertIsNotNone(export_request.started_at)
            self.assertIsNotNone(export_request.ended_at)
            self.assertEqual(status, export_request.status)

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

        self.task = Task.objects.create(name="dhis2_submission_exporter_task", account=account)

    def test_error_handling_support_various_versions(self):
        versions = ("229", "230", "231", "232", "233")
        testcases = ["event-create-error-" + version + ".json" for version in versions]

        for testcase in testcases:
            exception = EventHandler().handle_exception(load_dhis2_fixture(testcase), "error")
            self.assertIsNotNone(exception)

    def test_event_mapping_works(self):
        event, errors = EventHandler().map_to_values(
            self.build_instance(self.form), build_form_mapping(), export_status=build_export_status()
        )

        self.assertEqual(
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

        event, errors = EventHandler().map_to_values(
            instance, build_form_mapping(), export_status=build_export_status()
        )
        self.assertEqual(
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

        event, errors = EventHandler().map_to_values(
            instance, build_form_mapping(), export_status=build_export_status()
        )

        self.assertEqual(
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

    def _do_test_event_maps_multi_select_new(self, answer_value, expected_event):
        instance = self.build_instance(self.form)
        instance.json = {"question4": answer_value}
        instance.save()

        event, errors = EventHandler().map_to_values(
            instance, build_form_mapping(), export_status=build_export_status()
        )

        self.assertEqual(event, expected_event)

    def test_event_maps_multi_select_new_1(self):
        self._do_test_event_maps_multi_select_new(
            "1",
            {
                "program": "PROGRAM_DHIS2_ID",
                "event": "EVENT_DHIS2_UID",
                "orgUnit": "OU_DHIS2_ID",
                "eventDate": "2018-02-16",
                "status": "COMPLETED",
                "dataValues": [
                    {"dataElement": "DE_DHIS2_ID_bool4_1", "value": True},
                    {"dataElement": "DE_DHIS2_ID_bool4_2", "value": False},
                ],
                "coordinate": {"latitude": 7.3, "longitude": 1.5},
            },
        )

    def test_event_maps_multi_select_new_1_2(self):
        self._do_test_event_maps_multi_select_new(
            "1 2",
            {
                "program": "PROGRAM_DHIS2_ID",
                "event": "EVENT_DHIS2_UID",
                "orgUnit": "OU_DHIS2_ID",
                "eventDate": "2018-02-16",
                "status": "COMPLETED",
                "dataValues": [
                    {"dataElement": "DE_DHIS2_ID_bool4_1", "value": True},
                    {"dataElement": "DE_DHIS2_ID_bool4_2", "value": True},
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
        mock_system_info_old_dhis2_version()
        responses.add(
            responses.POST, "https://dhis2.com/api/events", json=load_dhis2_fixture("datavalues-ok.json"), status=200
        )

        DataValueExporter().export_instances(export_request, self.task)
        self.expect_logs(EXPORTED)

        instance.refresh_from_db()
        self.assertIsNotNone(instance.last_export_success_at)

    @responses.activate
    def test_event_export_works_newer_tracker_api(self):
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
        mock_system_info_newer_dhis2_version()
        responses.add(
            responses.POST, "https://dhis2.com/api/tracker", json=load_dhis2_fixture("datavalues-ok.json"), status=200
        )

        DataValueExporter().export_instances(export_request, self.task)
        self.expect_logs(EXPORTED)

        instance.refresh_from_db()
        self.assertIsNotNone(instance.last_export_success_at)

    @responses.activate
    def test_event_export_works_for_period_as_event_date_source(self):
        mapping_json = build_form_mapping()
        mapping_json["event_date_source"] = MappingVersion.EVENT_DATE_SOURCE_FROM_SUBMISSION_PERIOD

        mapping_version = MappingVersion(
            name="event", json=mapping_json, form_version=self.form_version, mapping=self.mapping
        )
        mapping_version.save()
        # setup
        # persist an instance
        instance = self.build_instance(self.form)
        # put a source_created_at different then the period
        instance.source_created_at = datetime.strptime("2024-02-16 11:00 AM", "%Y-%m-%d %I:%M %p")
        instance.save()
        export_request = ExportRequestBuilder().build_export_request(
            filters={"period_ids": "201801", "form_id": self.form.id, "org_unit_id": instance.org_unit.id},
            launcher=self.user,
        )
        # mock expected calls
        mock_system_info_old_dhis2_version()
        responses.add(
            responses.POST, "https://dhis2.com/api/events", json=load_dhis2_fixture("datavalues-ok.json"), status=200
        )

        DataValueExporter().export_instances(export_request, self.task)
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
        mock_system_info_old_dhis2_version()
        responses.add(
            responses.POST,
            "https://dhis2.com/api/events",
            json=load_dhis2_fixture("event-create-error-230-notassigned.json"),
            status=200,
        )

        DataValueExporter().export_instances(export_request, self.task)

        self.expect_logs(ERRORED)

        self.assertEqual(
            "ERROR while processing page 1/1 : Program is not assigned to this organisation unit: YuQRtpLP10I",
            export_request.last_error_message,
        )
        instance.refresh_from_db()
        self.assertIsNone(instance.last_export_success_at)

    @responses.activate
    def test_event_export_handle_errors_new_payload(self):
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
        mock_system_info_old_dhis2_version()

        responses.add(
            responses.POST,
            "https://dhis2.com/api/events",
            json=load_dhis2_fixture("event-create-error-235-type.json"),
            status=200,
        )

        DataValueExporter().export_instances(export_request, self.task)
        instance.refresh_from_db()
        self.expect_logs(ERRORED)

        self.assertEqual(
            'ERROR while processing page 1/1 : [[{"object": "DkhbIf6Xm9X", "value": "value_not_positive_integer"}]]',
            export_request.last_error_message,
        )
        instance.refresh_from_db()
        self.assertIsNone(instance.last_export_success_at)

    @responses.activate
    def test_event_export_handle_errors_non_json_response(self):
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
        mock_system_info_old_dhis2_version()
        responses.add(
            responses.POST,
            "https://dhis2.com/api/events",
            body="<html><body><h1>504 Gateway Timeout</h1></body></html>",
            status=504,
            content_type="text/html",
        )

        DataValueExporter().export_instances(export_request, self.task)
        instance.refresh_from_db()
        self.expect_logs(ERRORED)

        self.assertEqual(
            "ERROR while processing page 1/1 : non json response return by server: <html><body><h1>504 Gateway Timeout</h1></body></html>",
            export_request.last_error_message,
        )
        instance.refresh_from_db()
        self.assertIsNone(instance.last_export_success_at)
