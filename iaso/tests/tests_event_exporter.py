import json
import responses

from django.test import TestCase
from iaso.models import Instance, OrgUnit
from django.contrib.gis.geos import Point
from dhis2 import Api
from datetime import datetime, date

from ..dhis2.event_exporter import handle_exception, map_to_event, EventExporter


def load_dhis2_fixture(mapping_file):
    with open("./iaso/tests/fixtures/dhis2/" + mapping_file) as json_file:
        return json.load(json_file)


def build_instance():
    org_unit = OrgUnit()
    org_unit.validated = True
    org_unit.source_ref = "OU_DHIS2_ID"
    org_unit.save()
    instance = Instance()
    instance.export_id = "EVENT_DHIS2_UID"
    instance.created_at = datetime.strptime("2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p")
    instance.org_unit = org_unit
    instance.json = {"question1": "1"}
    instance.location = Point(1.5, 7.3)
    instance.save()
    # force to past creation date
    # looks the the first save don't take it
    instance.created_at = datetime.strptime("2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p")
    instance.save()
    return instance


def build_form_mapping():
    return {
        "program_id": "PROGRAM_DHIS2_ID",
        "question_mappings": {
            "question1": {"id": "DE_DHIS2_ID", "valueType": "INTEGER"}
        },
    }


def build_api():
    return Api("https://dhis2.com", "admin", "whocares")


class EventExporterTests(TestCase):
    def test_error_handling_support_various_versions(self):
        versions = ("229", "230", "231", "232", "233")
        testcases = ["event-create-error-" + version + ".json" for version in versions]

        for testcase in testcases:

            handle_exception(load_dhis2_fixture(testcase), "error")

    def test_event_mapping_works(self):

        event, errors = map_to_event(build_instance(), build_form_mapping())

        self.assertEquals(
            event,
            {
                "dataValues": [
                    {"dataElement": "DE_DHIS2_ID", "debug": "1 question1", "value": 1}
                ],
                "event": "EVENT_DHIS2_UID",
                "coordinate": {"latitude": 7.3, "longitude": 1.5},
                "eventDate": "2018-02-16",
                "orgUnit": "OU_DHIS2_ID",
                "program": "PROGRAM_DHIS2_ID",
                "status": "COMPLETED",
            },
        )

    @responses.activate
    def test_event_export_works(self):
        # setup
        # persist an instance
        instance = build_instance()    

        # mock expected calls

        responses.add(
            responses.POST, "https://dhis2.com/api/events", json={}, status=200
        )

        # excercice
        instances_qs = Instance.objects.order_by("id").all()

        EventExporter().export_events(
            build_api(), instances_qs, build_form_mapping(), True
        )

    @responses.activate
    def test_event_export_handle_dhis2_errors(self):
        # setup
        # persist an instance
        instance = build_instance()
        # mock expected calls

        responses.add(
            responses.POST,
            "https://dhis2.com/api/events",
            json=load_dhis2_fixture("event-create-error-230.json"),
            status=409,
        )

        # exercice
        instances_qs = Instance.objects.prefetch_related("org_unit").order_by("id").all()

        EventExporter().export_events(
            build_api(), instances_qs, build_form_mapping(), True
        )

    @responses.activate
    def test_event_export_handle_mapping_errors(self):
        # setup
        # persist an instance
        instance = build_instance()
        instance.json = {"question1": "badvalue"}
        instance.save()
       

        # exercice
        instances_qs = Instance.objects.prefetch_related("org_unit").order_by("id").all()

        EventExporter().export_events(
            build_api(), instances_qs, build_form_mapping(), True
        )
