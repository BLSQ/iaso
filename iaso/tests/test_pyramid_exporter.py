from io import StringIO

from django.test import TestCase
from django.core import management
from django.core.management.base import CommandError
from django.contrib.gis.geos import Point

from os import environ
import responses
import json

from iaso.models import OrgUnit, OrgUnitType, DataSource, SourceVersion, Group, GroupSet


class CommandTests(TestCase):
    def fixture_json(self, name):
        with open("./iaso/tests/fixtures/dhis2/" + name + ".json") as json_file:
            return json.load(json_file)

    def setup(self):
        out = StringIO()
        responses.add(
            responses.GET,
            "https://play.dhis2.org/2.30/api/organisationUnits.json"
            "?fields=id,name,path,coordinates,geometry,parent,organisationUnitGroups[id,name]"
            "&pageSize=500&page=1&totalPages=True",
            json=self.fixture_json("orgunits"),
            status=200,
        )

        responses.add(
            responses.GET,
            "https://play.dhis2.org/2.30/api/organisationUnitGroupSets.json"
            "?paging=false&fields=id,name,organisationUnitGroups[id,name]",
            json=self.fixture_json("groupsets"),
            status=200,
        )

        management.call_command(
            "dhis2_ou_importer",
            stdout=out,
            dhis2_url="https://play.dhis2.org/2.30",
            dhis2_user="admin",
            dhis2_password="district",
            source_name="play",
            version_number=1,
            org_unit_type_csv_file="./iaso/tests/fixtures/empty_unit_types.csv",
        )

        management.call_command(
            "dhis2_ou_importer",
            stdout=out,
            dhis2_url="https://play.dhis2.org/2.30",
            dhis2_user="admin",
            dhis2_password="district",
            source_name="reference",
            version_number=1,
            org_unit_type_csv_file="./iaso/tests/fixtures/empty_unit_types.csv",
        )
        if environ.get("DEBUG_TEST") is not None:
            print(out.getvalue())

    @responses.activate
    def test_command(self):
        self.setup()

        source_ref = DataSource.objects.get(name="reference")
        version_ref = SourceVersion.objects.get(number="1", data_source=source_ref)

        # change name
        parent = OrgUnit.objects.get(source_ref="KXSqt7jv6DU", version=version_ref)
        parent.name = "modified Gorama Mende"
        parent.save()

        # add new orgunit
        org_unit = OrgUnit()
        org_unit.name = "new Chiefdom"
        org_unit.sub_source = source_ref
        org_unit.version = version_ref
        org_unit.source_ref = None
        org_unit.validated = False
        org_unit.parent = parent
        org_unit.save()

        group = Group.objects.get(source_ref="f25dqv3Y7Z0", source_version=version_ref)
        org_unit.group_set.add(group)

        chp = OrgUnit.objects.get(source_ref="LOpWauwwghf", version=version_ref)
        chp.location = Point(-13.3596, 9.5317)
        chp.save()

        out = StringIO()
        management.call_command(
            "pyramid_exporter",
            stdout=out,
            source_name="play",
            version_number=1,
            source_name_ref="reference",
            version_number_ref=1,
        )
        print(out.getvalue())
