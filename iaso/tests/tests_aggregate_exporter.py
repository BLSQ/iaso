import json
import responses

from django.test import TestCase
from iaso.models import (
    Instance,
    OrgUnit,
    Form,
    FormVersion,
    Mapping,
    DataSource,
    SourceVersion,
    ExternalCredentials,
    Account,
)
from django.contrib.gis.geos import Point
from dhis2 import Api
from datetime import datetime, date

from ..dhis2.aggregate_exporter import (
    handle_exception,
    map_to_aggregate,
    AggregateExporter,
)


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


def build_api():
    return Api("https://dhis2.com", "admin", "whocares")


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

    def test_error_handling_support_various_versions(self):
        versions = ("229", "230", "231", "232", "233")
        testcases = ["event-create-error-" + version + ".json" for version in versions]

        for testcase in testcases:

            handle_exception(load_dhis2_fixture(testcase), "error")

    def test_event_mapping_works(self):

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

    @responses.activate
    def test_event_export_works(self):

        mapping = Mapping(
            name="aggregate", json=build_form_mapping(), form_version=self.form_version
        )
        mapping.save()
        # setup
        # persist an instance
        instance = self.build_instance()

        # mock expected calls

        responses.add(
            responses.POST, "https://dhis2.com/api/dataValueSets", json={}, status=200
        )

        # excercice
        instances_qs = Instance.objects.order_by("id").all()

        AggregateExporter().export_aggregates(build_api(), instances_qs, True)

    @responses.activate
    def test_event_export_handle_dhis2_errors(self):
        # setup
        # persist an instance
        instance = self.build_instance()
        # mock expected calls

        responses.add(
            responses.POST,
            "https://dhis2.com/api/events",
            json=load_dhis2_fixture("event-create-error-230.json"),
            status=409,
        )

        # exercice
        instances_qs = (
            Instance.objects.prefetch_related("org_unit").order_by("id").all()
        )

        AggregateExporter().export_aggregates(build_api(), instances_qs, True)

    @responses.activate
    def test_event_export_handle_mapping_errors(self):
        # setup
        # persist an instance
        instance = self.build_instance()
        instance.json = {"question1": "badvalue"}
        instance.save()

        # exercice
        instances_qs = (
            Instance.objects.prefetch_related("org_unit").order_by("id").all()
        )
        AggregateExporter().export_aggregates(build_api(), instances_qs, True)
