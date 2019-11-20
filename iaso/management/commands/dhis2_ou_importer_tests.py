from io import StringIO

from django.test import TestCase
from django.core import management
from django.core.management.base import CommandError

import responses
import json

class CommandTests(TestCase):
    @responses.activate
    def test_command(self):
        out = StringIO()

        with open('./testdata/mocks/orgunits.json') as json_file:
            data = json.load(json_file)

            responses.add(responses.GET,
                          "https://play.dhis2.org/2.30/api/organisationUnits.json?fields=id%2Cname%2Cpath%2Ccoordinates%2Cgeometry%2Cparent%2CorganisationUnitGroups%5Bid%2Cname%5D&pageSize=500&page=1&totalPages=True",
                          json=data, status=200)

            management.call_command('dhis2_ou_importer', stdout=out,
                                    dhis2_url="https://play.dhis2.org/2.30",
                                    dhis2_user="admin",
                                    dhis2_password="district",
                                    source_name="play",
                                    version_number=1,
                                    org_unit_type_csv_file="./testdata/empty_unit_types.csv")
