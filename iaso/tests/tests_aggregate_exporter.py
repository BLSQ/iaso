import json
import responses
from collections import namedtuple
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
)
from django.contrib.gis.geos import Point
from dhis2 import Api
import os
from datetime import datetime, date
from ..dhis2.aggregate_exporter import (
    handle_exception,
    map_to_aggregate,
    AggregateExporter,
    InstanceExportError,
)
from ..dhis2.export_request_builder import ExportRequestBuilder


def load_dhis2_fixture(mapping_file):
    with open("./iaso/tests/fixtures/dhis2/" + mapping_file) as json_file:
        return json.load(json_file)


def build_form_mapping():
    return {
        "data_set_id": "DATASET_DHIS2_ID",
        "question_mappings": {
            "question1": {"id": "DE_DHIS2_ID", "valueType": "INTEGER"}
        },
    }


def dump_attributes(obj):
    print("----- ", obj.__class__)
    for k in obj.__dict__:
        print("\t", k, obj.__dict__[k])


class AggregateExporterTests(TestCase):
    def build_instance(self):

        instance = Instance()
        instance.created_at = datetime.strptime(
            "2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p"
        )
        instance.org_unit = self.org_unit
        instance.period = "2018Q1"
        instance.json = {"question1": "1"}
        instance.form = self.form
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
            form_id="quality_pca",
            name="Quality PCA form",
            period_type="month",
            single_per_period=True,
        )
        self.form = form

        form_version, created = FormVersion.objects.get_or_create(
            form=form, version_id=1
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
        source_version, _created = SourceVersion.objects.get_or_create(
            number=1, data_source=datasource
        )
        org_unit = OrgUnit()
        org_unit.validated = True
        org_unit.source_ref = "OU_DHIS2_ID"
        org_unit.version = source_version
        org_unit.save()

        self.org_unit = org_unit

        mapping = Mapping(form=form, data_source=datasource)
        mapping.save()
        self.mapping = mapping

    def test_error_handling_support_various_versions(self):

        ErrorTestCase = namedtuple(
            "ErrorTestCase", "fixture expected_counts expected_messages"
        )
        testcases = [
            ErrorTestCase(
                "datavalues-error-assigned.json",
                {},
                [
                    "Data element: FC3nR54yGUx must be assigned through data sets to organisation unit: t3kZ5ksd8IR"
                ],
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
                [
                    "Data value is not numeric, must match data element type: M62VHgYT2n0"
                ],
            ),
            ErrorTestCase(
                "datavalues-error-element-type-percent.json",
                {},
                [
                    "Data value is not a percentage, must match data element type: wTFkuSU2MsH"
                ],
            ),
            ErrorTestCase(
                "datavalues-error-open-periods.json",
                {"imported": 0, "updated": 0, "deleted": 0, "ignored": 1},
                [
                    "Period: 203001 is after latest open future period: 202001 for data element: M62VHgYT2n0"
                ],
            ),
            ErrorTestCase(
                "datavalues-error-technical.json",
                {},
                ["The import process failed: Failed to flush BatchHandler"],
            ),
            ErrorTestCase(
                "datavalues-error-unknown-dataelement.json",
                {"imported": 0, "updated": 0, "deleted": 0, "ignored": 1},
                ["Data element not found or not accessible"],
            ),
        ]

        for testcase in testcases:
            error = handle_exception(load_dhis2_fixture(testcase.fixture), "error")
            self.assertEquals(testcase.expected_counts, error.counts)
            self.assertEquals(testcase.expected_messages, error.descriptions)

    def test_aggregate_mapping_works(self):

        event, errors = map_to_aggregate(self.build_instance(), build_form_mapping())

        self.assertEquals(
            event,
            {
                "completeDate": "2018-02-16",
                "dataSet": "DATASET_DHIS2_ID",
                "period": "2018Q1",
                "orgUnit": "OU_DHIS2_ID",
                "dataValues": [
                    {"dataElement": "DE_DHIS2_ID", "debug": "1 question1", "value": 1}
                ],
            },
        )

    def test_aggregate_mapping_with_coc_works(self):
        mapping = build_form_mapping()
        mapping["question_mappings"]["question1"][
            "categoryOptionCombo"
        ] = "DHIS2_COC_ID"

        event, errors = map_to_aggregate(self.build_instance(), mapping)

        self.assertEquals(
            event,
            {
                "completeDate": "2018-02-16",
                "dataSet": "DATASET_DHIS2_ID",
                "period": "2018Q1",
                "orgUnit": "OU_DHIS2_ID",
                "dataValues": [
                    {
                        "dataElement": "DE_DHIS2_ID",
                        "categoryOptionCombo": "DHIS2_COC_ID",
                        "debug": "1 question1",
                        "value": 1,
                    }
                ],
            },
        )

    @responses.activate
    def test_aggregate_export_works(self):

        mapping_version = MappingVersion(
            name="aggregate",
            json=build_form_mapping(),
            form_version=self.form_version,
            mapping=self.mapping,
        )
        mapping_version.save()
        # setup
        # persist an instance
        instance = self.build_instance()

        export_request = ExportRequestBuilder().build_export_request(
            ["2018Q1"], [self.form.id], [instance.org_unit.id], self.user
        )
        # mock expected calls

        responses.add(
            responses.POST,
            "https://dhis2.com/api/dataValueSets",
            json={"message": "Good boy"},
            status=200,
        )

        # excercice
        instances_qs = Instance.objects.order_by("id").all()

        AggregateExporter().export_instances(export_request, True)
        self.expect_logs("exported")

    @responses.activate
    def test_aggregate_export_handle_dhis2_errors(self):
        with self.assertRaises(InstanceExportError) as context:
            mapping_version = MappingVersion(
                name="aggregate",
                json=build_form_mapping(),
                form_version=self.form_version,
                mapping=self.mapping,
            )
            mapping_version.save()
            instance = self.build_instance()

            responses.add(
                responses.POST,
                "https://dhis2.com/api/dataValueSets",
                json=load_dhis2_fixture("datavalues-error-assigned.json")["response"],
                status=409,
            )

            export_request = ExportRequestBuilder().build_export_request(
                ["2018Q1"], [self.form.id], [instance.org_unit.id], self.user
            )
            AggregateExporter().export_instances(export_request, True)

        self.expect_logs("errored")

        self.assertEquals(
            "ERROR while processing page 1/1, instance_id "
            + str(instance.id)
            + " : Data element: FC3nR54yGUx must be assigned through data sets to organisation unit: t3kZ5ksd8IR",
            context.exception.message,
        )

    @responses.activate
    def test_aggregate_export_handle_mapping_errors(self):
        # setup
        # persist an instance
        instance = self.build_instance()
        instance.json = {"question1": "badvalue"}
        instance.save()

        mapping_version = MappingVersion(
            name="aggregate",
            json=build_form_mapping(),
            form_version=self.form_version,
            mapping=self.mapping,
        )
        mapping_version.save()

        # exercice

        with self.assertRaises(InstanceExportError) as context:
            export_request = ExportRequestBuilder().build_export_request(
                ["2018Q1"], [self.form.id], [instance.org_unit.id], self.user
            )

            AggregateExporter().export_instances(export_request, True)

        self.expect_logs("errored")

        self.assertEquals(
            "ERROR while processing page 1/1, instance_id "
            + str(instance.id)
            + " : question1 (\"Bad value for int 'badvalue'\", {'id': 'DE_DHIS2_ID', 'valueType': 'INTEGER', 'question_key': 'question1'})",
            context.exception.message,
        )
