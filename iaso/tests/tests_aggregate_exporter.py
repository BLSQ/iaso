import json
import logging
from collections import namedtuple

import responses
from django.core.files.uploadedfile import UploadedFile
from django.test import TestCase

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
    AGGREGATE,
    ERRORED,
    EXPORTED,
)

logger = logging.getLogger(__name__)
import os
from datetime import datetime
from iaso.dhis2.datavalue_exporter import AggregateHandler, DataValueExporter, InstanceExportError
from ..dhis2.export_request_builder import ExportRequestBuilder


def load_dhis2_fixture(mapping_file):
    with open("./iaso/tests/fixtures/dhis2/" + mapping_file) as json_file:
        return json.load(json_file)


def build_form_mapping():
    return {
        "data_set_id": "DATASET_DHIS2_ID",
        "question_mappings": {
            "question1": {"id": "DE_DHIS2_ID", "valueType": "INTEGER"},
            "question3": {"type": MappingVersion.QUESTION_MAPPING_NEVER_MAPPED},
        },
    }


def build_form_mapping_quality():
    return {
        "data_set_id": "DATASET_QUALITY_DHIS2_ID",
        "question_mappings": {
            "question1_quality": {"id": "DE_QUALITY_DHIS2_ID", "valueType": "NUMBER"},
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
        instance.created_at = datetime.strptime("2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p")
        instance.org_unit = self.org_unit
        if form == self.form:
            instance.period = "201801"
            instance.json = {"question1": "1", "version": self.form_version.version_id}
        else:
            instance.period = "2018Q1"
            instance.json = {"question1_quality": "1", "version": self.form_quality_version.version_id}

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
            form_id="quantity_pca", name="Quantity PCA form", period_type="month", single_per_period=True
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

        mapping = Mapping(form=form, data_source=datasource, mapping_type=AGGREGATE)
        mapping.save()
        self.mapping = mapping

    def setUpFormQuality(self):
        form_quality, created = Form.objects.get_or_create(
            form_id="quality_pca", name="Quality PCA form", period_type="quarter", single_per_period=True
        )
        self.form_quality = form_quality

        form_quality_version, created = FormVersion.objects.get_or_create(form=form_quality, version_id="1")

        self.form_quality_version = form_quality_version
        mapping_quality = Mapping(form=form_quality, data_source=self.datasource, mapping_type=AGGREGATE)
        mapping_quality.save()
        self.mapping_quality = mapping_quality

    def test_error_handling_support_various_versions(self):
        ErrorTestCase = namedtuple("ErrorTestCase", "fixture expected_counts expected_messages")
        testcases = [
            ErrorTestCase(
                "datavalues-error-assigned.json",
                {},
                ["Data element: FC3nR54yGUx must be assigned through data sets to organisation unit: t3kZ5ksd8IR"],
            ),
            ErrorTestCase(
                "datavalues-error-bad-coc.json",
                {"imported": 0, "updated": 0, "deleted": 0, "ignored": 1},
                ["Category option combo not found or not accessible"],
            ),
            ErrorTestCase(
                "datavalues-error-coc.json",
                {"imported": 1, "updated": 0, "deleted": 0, "ignored": 0},
                [
                    "Value is zero and not significant, must match data element: lXpDI2bRPCF",
                    "Category option combo is required but is not specified",
                ],
            ),
            ErrorTestCase(
                "datavalues-error-element-type.json",
                {"imported": 0, "updated": 0, "deleted": 0, "ignored": 1},
                ["Data value is not numeric, must match data element type: M62VHgYT2n0"],
            ),
            ErrorTestCase(
                "datavalues-error-element-type-percent.json",
                {},
                ["Data value is not a percentage, must match data element type: wTFkuSU2MsH"],
            ),
            ErrorTestCase(
                "datavalues-error-open-periods.json",
                {"imported": 0, "updated": 0, "deleted": 0, "ignored": 1},
                ["Period: 203001 is after latest open future period: 202001 for data element: M62VHgYT2n0"],
            ),
            ErrorTestCase(
                "datavalues-error-technical.json", {}, ["The import process failed: Failed to flush BatchHandler"]
            ),
            ErrorTestCase(
                "datavalues-error-unknown-dataelement.json",
                {"imported": 0, "updated": 0, "deleted": 0, "ignored": 1},
                ["Data element not found or not accessible"],
            ),
        ]

        for testcase in testcases:
            error = AggregateHandler().handle_exception(load_dhis2_fixture(testcase.fixture), "error")
            self.assertEquals(testcase.expected_counts, error.counts)
            self.assertEquals(testcase.expected_messages, error.descriptions)

    def test_handle_exception_internal_server_error(self):
        resp = {
            "response": {
                "httpStatus": "Internal Server Error",
                "httpStatusCode": 500,
                "status": "ERROR",
                "message": "JDBC begin transaction failed: ",
            }
        }
        error = AggregateHandler().handle_exception(resp, "error")
        self.assertEquals(error.message, "error : JDBC begin transaction failed: ")

    def test_handle_exception_real_life_error(self):
        resp = {
            "response": {
                "responseType": "ImportSummary",
                "status": "WARNING",
                "importOptions": {
                    "idSchemes": {},
                    "dryRun": False,
                    "async": False,
                    "importStrategy": "CREATE_AND_UPDATE",
                    "mergeMode": "REPLACE",
                    "reportMode": "FULL",
                    "skipExistingCheck": False,
                    "sharing": False,
                    "skipNotifications": False,
                    "skipAudit": False,
                    "datasetAllowsPeriods": False,
                    "strictPeriods": False,
                    "strictDataElements": False,
                    "strictCategoryOptionCombos": False,
                    "strictAttributeOptionCombos": False,
                    "strictOrganisationUnits": False,
                    "requireCategoryOptionCombo": False,
                    "requireAttributeOptionCombo": False,
                    "skipPatternValidation": False,
                    "ignoreEmptyCollection": False,
                    "force": False,
                    "skipLastUpdated": False,
                },
                "description": "Import process completed successfully",
                "importCount": {"imported": 93, "updated": 0, "ignored": 191, "deleted": 0},
                "conflicts": [
                    {"object": "GuJESuyOCMW", "value": "Category option combo not found or not accessible"},
                    {"object": "uX9yDetTdOp", "value": "Category option combo not found or not accessible"},
                    {"object": "LbeIlyHEhKr", "value": "Category option combo not found or not accessible"},
                    {"object": "qNCMOhkoQju", "value": "Category option combo not found or not accessible"},
                    {"object": "rCMUTmcreqP", "value": "Category option combo not found or not accessible"},
                    {"object": "TkDhg29x18A", "value": "Category option combo not found or not accessible"},
                    {"object": "qa0VqgYlgtN", "value": "Category option combo not found or not accessible"},
                    {"object": "zPpvbvpmkxN", "value": "Category option combo not found or not accessible"},
                ],
            }
        }
        error = AggregateHandler().handle_exception(resp, "error")
        self.assertEquals(error.message, "error : Category option combo not found or not accessible")

    def test_aggregate_mapping_works(self):
        instance = self.build_instance(self.form)
        event, errors = AggregateHandler().map_to_values(instance, build_form_mapping())
        self.assertIsNone(errors)
        self.assertEquals(
            event,
            {
                "completeDate": "2018-02-16",
                "dataSet": "DATASET_DHIS2_ID",
                "period": "201801",
                "orgUnit": "OU_DHIS2_ID",
                "dataValues": [
                    {"dataElement": "DE_DHIS2_ID", "comment": str(instance.id) + " 1 question1", "value": 1}
                ],
            },
        )

    def test_aggregate_mapping_with_coc_works(self):
        mapping = build_form_mapping()
        mapping["question_mappings"]["question1"]["categoryOptionCombo"] = "DHIS2_COC_ID"
        instance = self.build_instance(self.form)

        event, errors = AggregateHandler().map_to_values(instance, mapping)

        self.assertEquals(
            event,
            {
                "completeDate": "2018-02-16",
                "dataSet": "DATASET_DHIS2_ID",
                "period": "201801",
                "orgUnit": "OU_DHIS2_ID",
                "dataValues": [
                    {
                        "dataElement": "DE_DHIS2_ID",
                        "categoryOptionCombo": "DHIS2_COC_ID",
                        "comment": str(instance.id) + " 1 question1",
                        "value": 1,
                    }
                ],
            },
        )

    @responses.activate
    def test_aggregate_export_works(self):
        mapping_version = MappingVersion(
            name="aggregate", json=build_form_mapping(), form_version=self.form_version, mapping=self.mapping
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
            "https://dhis2.com/api/dataValueSets",
            json=load_dhis2_fixture("datavalues-ok.json"),
            status=200,
        )

        responses.add(responses.POST, "https://dhis2.com/api/completeDataSetRegistrations", json={}, status=200)

        DataValueExporter().export_instances(export_request)
        self.expect_logs(EXPORTED)

        instance.refresh_from_db()
        self.assertIsNotNone(instance.last_export_success_at)

    @responses.activate
    def test_aggregate_export_works_with_2_forms(self):
        self.setUpFormQuality()
        # setup
        # persist an instance
        mapping_version = MappingVersion(
            name="aggregate", json=build_form_mapping(), form_version=self.form_version, mapping=self.mapping
        )
        mapping_version.save()

        instance = self.build_instance(self.form)

        mapping_quality_version = MappingVersion(
            name="aggregate",
            json=build_form_mapping_quality(),
            form_version=self.form_quality_version,
            mapping=self.mapping_quality,
        )
        mapping_quality_version.save()

        instance_quality = self.build_instance(self.form_quality)

        export_request = ExportRequestBuilder().build_export_request(
            filters={
                "period_ids": ",".join(["201801", "2018Q1"]),
                "form_ids": ",".join([str(self.form.id), str(self.form_quality.id)]),
                "org_unit_id": instance.org_unit.id,
            },
            launcher=self.user,
        )

        # mock expected calls

        responses.add(
            responses.POST,
            "https://dhis2.com/api/dataValueSets",
            json=load_dhis2_fixture("datavalues-ok.json"),
            status=200,
        )

        responses.add(responses.POST, "https://dhis2.com/api/completeDataSetRegistrations", json={}, status=200)

        # excercice

        DataValueExporter().export_instances(export_request)

        self.expect_logs(EXPORTED)

        instance.refresh_from_db()
        self.assertIsNotNone(instance.last_export_success_at)

        instance_quality.refresh_from_db()
        self.assertIsNotNone(instance_quality.last_export_success_at)

    @responses.activate
    def test_aggregate_export_handle_dhis2_errors(self):
        instance = self.build_instance(self.form)

        with self.assertRaises(InstanceExportError) as context:
            mapping_version = MappingVersion(
                name="aggregate", json=build_form_mapping(), form_version=self.form_version, mapping=self.mapping
            )
            mapping_version.save()

            responses.add(
                responses.POST,
                "https://dhis2.com/api/dataValueSets",
                json=load_dhis2_fixture("datavalues-error-assigned.json")["response"],
                status=200,
            )

            export_request = ExportRequestBuilder().build_export_request(
                filters={
                    "period_ids": ",".join(["201801"]),
                    "form_id": self.form.id,
                    "org_unit_id": instance.org_unit.id,
                },
                launcher=self.user,
            )
            DataValueExporter().export_instances(export_request)

        self.expect_logs(ERRORED)

        self.assertEquals(
            "ERROR while processing page 1/1 : Data element: FC3nR54yGUx must be assigned through data sets to organisation unit: t3kZ5ksd8IR",
            context.exception.message,
        )
        instance.refresh_from_db()
        self.assertIsNone(instance.last_export_success_at)

    @responses.activate
    def test_aggregate_export_handle_dhis2_errors_238_and_higher(self):
        instance = self.build_instance(self.form)

        with self.assertRaises(InstanceExportError) as context:
            mapping_version = MappingVersion(
                name="aggregate", json=build_form_mapping(), form_version=self.form_version, mapping=self.mapping
            )
            mapping_version.save()

            # dhis2 2.38 now return a bad request (vs 200 previously)
            # the payload is wrapped in "response" field
            responses.add(
                responses.POST,
                "https://dhis2.com/api/dataValueSets",
                json=load_dhis2_fixture("datavalues-error-bad-type.json"),
                status=409,
            )

            export_request = ExportRequestBuilder().build_export_request(
                filters={
                    "period_ids": ",".join(["201801"]),
                    "form_id": self.form.id,
                    "org_unit_id": instance.org_unit.id,
                },
                launcher=self.user,
            )
            DataValueExporter().export_instances(export_request)

        self.expect_logs(ERRORED)

        self.assertEquals(
            "ERROR while processing page 1/1 : Value must match data element's `nymNRxmnj4z` type constraints: Data value is not an integer",
            context.exception.message,
        )
        instance.refresh_from_db()
        self.assertIsNone(instance.last_export_success_at)

    @responses.activate
    def test_aggregate_export_continue_on_dhis2_errors(self):
        self.setUpFormQuality()
        # setup
        # persist an instance
        mapping_version = MappingVersion(
            name="aggregate", json=build_form_mapping(), form_version=self.form_version, mapping=self.mapping
        )
        mapping_version.save()

        instance = self.build_instance(self.form)

        mapping_quality_version = MappingVersion(
            name="aggregate",
            json=build_form_mapping_quality(),
            form_version=self.form_quality_version,
            mapping=self.mapping_quality,
        )
        mapping_quality_version.save()

        instance_quality = self.build_instance(self.form_quality)

        export_request = ExportRequestBuilder().build_export_request(
            filters={
                "period_ids": ",".join(["201801", "2018Q1"]),
                "form_ids": ",".join([str(self.form.id), str(self.form_quality.id)]),
                "org_unit_id": instance.org_unit.id,
            },
            launcher=self.user,
        )

        # mock expected calls

        responses.add(
            responses.POST,
            "https://dhis2.com/api/dataValueSets",
            json=load_dhis2_fixture("datavalues-ok.json"),
            status=200,
        )

        responses.add(responses.POST, "https://dhis2.com/api/completeDataSetRegistrations", json={}, status=200)
        responses.add(
            responses.POST,
            "https://dhis2.com/api/dataValueSets",
            json=load_dhis2_fixture("datavalues-error-assigned.json")["response"],
            status=200,
        )

        DataValueExporter().export_instances(export_request, continue_on_error=True, page_size=1)

        self.assertTrue(responses.assert_call_count("https://dhis2.com/api/dataValueSets", 2))

        instance.refresh_from_db()
        self.assertIsNotNone(instance.last_export_success_at)

        instance_quality.refresh_from_db()
        self.assertIsNone(instance_quality.last_export_success_at)

    @responses.activate
    def test_aggregate_export_handle_mapping_errors(self):
        # setup
        # persist an instance
        instance = self.build_instance(self.form)
        instance.json = {"question1": "badvalue", "version": "1"}
        instance.save()

        mapping_version = MappingVersion(
            name="aggregate", json=build_form_mapping(), form_version=self.form_version, mapping=self.mapping
        )
        mapping_version.save()

        # exercice

        with self.assertRaises(InstanceExportError) as context:
            export_request = ExportRequestBuilder().build_export_request(
                filters={
                    "period_ids": ",".join(["201801"]),
                    "form_id": self.form.id,
                    "org_unit_id": instance.org_unit.id,
                },
                launcher=self.user,
            )

            DataValueExporter().export_instances(export_request)

        self.expect_logs(ERRORED)

        self.assertEquals(
            "ERROR while processing page 1/1, instance_id "
            + str(instance.id)
            + " : question1 (\"Bad value for int 'badvalue'\", {'id': 'DE_DHIS2_ID', 'valueType': 'INTEGER', 'question_key': 'question1'})",
            context.exception.message,
        )

    @responses.activate
    def test_aggregate_export_handle_dhis2_nginx_errors(self):
        instance = self.build_instance(self.form)

        with self.assertRaises(InstanceExportError) as context:
            mapping_version = MappingVersion(
                name="aggregate", json=build_form_mapping(), form_version=self.form_version, mapping=self.mapping
            )
            mapping_version.save()

            responses.add(
                responses.POST,
                "https://dhis2.com/api/dataValueSets",
                body="<html><body>nginx timeout</body></html>",
                status=509,
            )

            export_request = ExportRequestBuilder().build_export_request(
                filters={
                    "period_ids": ",".join(["201801"]),
                    "form_id": self.form.id,
                    "org_unit_id": instance.org_unit.id,
                },
                launcher=self.user,
            )
            DataValueExporter().export_instances(export_request)

        self.expect_logs(ERRORED)

        self.assertEquals(
            "ERROR while processing page 1/1 : non json response return by server", context.exception.message
        )
        instance.refresh_from_db()
        self.assertIsNone(instance.last_export_success_at)
