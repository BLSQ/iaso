from django.test import TestCase
from ..dhis2.event_exporter import handle_exception, map_to_event
import json
from iaso.models import Instance, OrgUnit
from datetime import datetime, date


def load_dhis2_fixture(mapping_file):
    with open("./iaso/tests/fixtures/dhis2/" + mapping_file) as json_file:
        return json.load(json_file)


class EventExporterTests(TestCase):
    def test_error_handling_support_various_versions(self):
        versions = ("229", "230", "231", "232", "233")
        testcases = ["event-create-error-" + version + ".json" for version in versions]

        for testcase in testcases:

            handle_exception(load_dhis2_fixture(testcase), "error")

    def test_event_mapping_works(self):

        org_unit = OrgUnit()
        org_unit.validated = True
        org_unit.source_ref = "OU_DHIS2_ID"
        instance = Instance()
        instance.export_id = "EVENT_DHIS2_UID"
        instance.created_at = datetime.strptime(
            "2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p"
        )
        instance.org_unit = org_unit
        instance.json = {"question1": "1"}
        form_mapping = {
            "program_id": "PROGRAM_DHIS2_ID",
            "question_mappings": {
                "question1": {"id": "DE_DHIS2_ID", "valueType": "TEXT"}
            },
        }
        event, errors = map_to_event(instance, form_mapping)

        self.assertEquals(
            event,
            {
                "dataValues": [
                    {"dataElement": "DE_DHIS2_ID", "debug": "1 question1", "value": "1"}
                ],
                "event": "EVENT_DHIS2_UID",
                "eventDate": "2018-02-16",
                "orgUnit": "Rp268JB6Ne4",
                "program": "PROGRAM_DHIS2_ID",
                "status": "COMPLETED",
            },
        )
