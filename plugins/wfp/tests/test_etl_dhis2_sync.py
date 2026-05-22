import json

from datetime import datetime

import responses

from django.test import TestCase

from plugins.wfp.models import *


def load_fixture(mapping_file):
    with open("./plugins/wfp/tests/fixtures/" + mapping_file) as json_file:
        return json.load(json_file)


class Dhis2ETLSyncTestCase(TestCase):
    def test_dhis2_sync_results(self):
        account, account_created = Account.objects.get_or_create(name="Test account")
        org_unit, created = OrgUnit.objects.get_or_create(
            name="TEST CHC-CHP", source_ref="OU_DHIS2_ID", created_at=datetime.utcnow()
        )

        data_values_sets = load_fixture("data-values-set.json")
        response_ok = load_fixture("data-valueset-response-ok.json")
        response_error = load_fixture("data-valueset-response-error.json")
        response_warning = load_fixture("data-valueset-response-warning.json")

        result_with_ok = Dhis2SyncResults.objects.create(
            account=account,
            org_unit_id=org_unit.id,
            org_unit_dhis2_id=data_values_sets[0]["orgUnit"],
            data_set_id=data_values_sets[0]["dataSet"],
            period=data_values_sets[0]["period"],
            status=data_values_sets[0]["status"],
            response=response_ok,
        )
        self.assertEqual(result_with_ok.response, response_ok)

        response_with_error = Dhis2SyncResults.objects.create(
            account=account,
            org_unit_id=org_unit.id,
            org_unit_dhis2_id=data_values_sets[2]["orgUnit"],
            data_set_id=data_values_sets[2]["dataSet"],
            period=data_values_sets[2]["period"],
            status=data_values_sets[2]["status"],
            response=response_error,
        )
        self.assertEqual(response_with_error.response, response_error)

        response_with_warning = Dhis2SyncResults.objects.create(
            account=account,
            org_unit_id=org_unit.id,
            org_unit_dhis2_id=data_values_sets[3]["orgUnit"],
            data_set_id=data_values_sets[3]["dataSet"],
            period=data_values_sets[3]["period"],
            status=data_values_sets[3]["status"],
            response=response_warning,
        )
        self.assertEqual(response_with_warning.response, response_warning)

    def test_push_data_to_dhis2_success(self):
        responses.add(
            responses.POST,
            "https://dhis2.com/api/dataValueSets",
            json=load_fixture("data-valueset-response-ok.json"),
            status=200,
        )

    def test_push_data_handle_dhis2_errors(self):
        responses.add(
            responses.POST,
            "https://dhis2.com/api/dataValueSets",
            json=load_fixture("data-valueset-response-error.json"),
            status=409,
        )

    def test_push_data_handle_dhis2_warning(self):
        responses.add(
            responses.POST,
            "https://dhis2.com/api/dataValueSets",
            json=load_fixture("data-valueset-response-warning.json"),
            status=409,
        )
