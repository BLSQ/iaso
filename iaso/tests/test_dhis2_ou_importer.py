from io import StringIO

from django.test import TestCase
from django.core import management
from os import environ
import responses
import json

from iaso.models import OrgUnit, Group, GroupSet


class CommandTests(TestCase):
    def fixture_json(self, name):
        with open("./iaso/tests/fixtures/dhis2/" + name + ".json") as json_file:
            return json.load(json_file)

    @responses.activate
    def test_command(self):
        out = StringIO()

        # fixture file based on https://play.dhis2.org/2.30/api/organisationUnits.json?fields=id%2Cname%2Cpath%2Ccoordinates%2Cgeometry%2Cparent%2CorganisationUnitGroups%5Bid%2Cname%5D&filter=id:in:[ImspTQPwCqd,kJq2mPyFEHo,KXSqt7jv6DU,LOpWauwwghf]

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

        if environ.get("DEBUG_TEST") is not None:
            print(out.getvalue())

        created_orgunits_qs = OrgUnit.objects.order_by("id")
        created_orgunits = [entry for entry in created_orgunits_qs.values("source_ref", "name")]

        # assert the pyramid imported seem okish
        self.assertEquals(
            created_orgunits,
            [
                {"name": "Sierra Leone", "source_ref": "ImspTQPwCqd"},
                {"name": "Kenema", "source_ref": "kJq2mPyFEHo"},
                {"name": "Gorama Mende", "source_ref": "KXSqt7jv6DU"},
                {"name": "Bambara Kaima CHP", "source_ref": "LOpWauwwghf"},
            ],
        )

        # assert location and geometry and parent relationships
        healthcenter = created_orgunits_qs.get(name="Bambara Kaima CHP")
        self.assertEquals(healthcenter.location.wkt, "POINT Z (-11.3596 8.531700000000001 0)")
        self.assertEquals(healthcenter.parent.name, "Gorama Mende")

        # assert has a simplified geometry
        zone = created_orgunits_qs.get(name="Gorama Mende")
        self.assertIn("MULTIPOLYGON (((-11.3596 8.5317", zone.simplified_geom.wkt)

        # assert groups are created and assigned to orgunits
        group = Group.objects.get(name="CHP")
        self.assertEquals([entry for entry in group.org_units.values("name")], [{"name": "Bambara Kaima CHP"}])

        groupsets_qs = GroupSet.objects.order_by("id")
        created_groupsets = [entry for entry in groupsets_qs.values("source_ref", "name")]
        self.assertEquals(
            created_groupsets,
            [
                {"name": "Area", "source_ref": "uIuxlbV1vRT"},
                {"name": "Facility Ownership", "source_ref": "Bpx0589u8y0"},
                {"name": "Facility Type", "source_ref": "J5jldMd8OHv"},
                {"name": "Location Rural/Urban", "source_ref": "Cbuj0VCyDjL"},
            ],
        )
        facility_type = groupsets_qs.get(name="Facility Type")
        self.assertEquals([x.name for x in facility_type.groups.all()], ["CHP", "MCHP", "Clinic", "Hospital", "CHC"])

        # assert that path has been generated for all org units
        self.assertEquals(0, OrgUnit.objects.filter(path=None).count())

    @responses.activate
    def test_stranges_geom(self):
        """Testfile with Shape with hole and with multi polygon"""
        out = StringIO()

        responses.add(
            responses.GET,
            "https://play.dhis2.org/2.36/api/organisationUnits.json"
            "?fields=id,name,path,coordinates,geometry,parent,organisationUnitGroups[id,name]"
            "&pageSize=500&page=1&totalPages=True",
            json=self.fixture_json("orgunits_strange_geom"),
            status=200,
        )

        responses.add(
            responses.GET,
            "https://play.dhis2.org/2.36/api/organisationUnitGroupSets.json"
            "?paging=false&fields=id,name,organisationUnitGroups[id,name]",
            json={"organisationUnitGroupSets": []},
            status=200,
        )

        management.call_command(
            "dhis2_ou_importer",
            stdout=out,
            dhis2_url="https://play.dhis2.org/2.36",
            dhis2_user="admin",
            dhis2_password="district",
            source_name="play",
            version_number=1,
            org_unit_type_csv_file="./iaso/tests/fixtures/empty_unit_types.csv",
        )

        if environ.get("DEBUG_TEST") is not None:
            print(out.getvalue())

        created_orgunits_qs = OrgUnit.objects.order_by("id")

        ou_a = created_orgunits_qs.get(source_ref="a")
        self.assertEqual(ou_a.name, "Simple square")
        self.assertEqual(ou_a.geom.area, 1)

        ou_b = created_orgunits_qs.get(source_ref="b")
        self.assertEqual(ou_b.name, "Simple square with a hole")
        self.assertAlmostEqual(ou_b.geom.area, 0.6400000000000033)

        ou_d = created_orgunits_qs.get(source_ref="d")
        self.assertEqual(ou_d.name, "Two polygon of area 1 each")
        self.assertAlmostEqual(ou_d.geom.area, 2)
        self.assertEqual(len(ou_d.geom.coords), 2)
        self.assertEqual(len(ou_d.geom.coords[0]), 1)
        self.assertEqual(len(ou_d.geom.coords[1]), 1)

        ou_c = created_orgunits_qs.get(source_ref="c")
        self.assertAlmostEqual(ou_c.geom.area, 0.019948936631078506)
        self.assertEqual(ou_c.name, "Multi 2 polygon with one hole each")
        self.assertEqual(len(ou_c.geom.coords), 2)
        self.assertEqual(len(ou_c.geom.coords[0]), 2)
        self.assertEqual(len(ou_c.geom.coords[1]), 2)
