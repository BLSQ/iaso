import json
from io import StringIO
from os import environ

import responses  # type: ignore
from django.core import management

from hat.audit.models import Modification
from iaso import models as m
from iaso.models import OrgUnit, Group, GroupSet, Task, Account, DataSource, SUCCESS, Project
from iaso.tasks.dhis2_ou_importer import dhis2_ou_importer
from iaso.test import TestCase


class DHIS2TestMixin:
    old_counts: dict  # To be implemented in the class I'm being mixed into

    def fixture_json(self, name):
        with open("./iaso/tests/fixtures/dhis2/" + name + ".json") as json_file:
            return json.load(json_file)

    def setup_responses(self, orgunit_fixture_name, groupsets_fixture_name):
        """Assume @responses.activate in the calling test function"""
        orgunit_response_content = self.fixture_json(orgunit_fixture_name)

        responses.add(
            responses.GET,
            "https://play.dhis2.org/2.30/api/organisationUnits.json"
            "?fields=id,name,path,coordinates,geometry,parent,organisationUnitGroups[id,name],level"
            "&pageSize=500&page=1&totalPages=True",
            json=orgunit_response_content,
            status=200,
        )

        empty_groupset_response = {"organisationUnitGroupSets": []}
        if groupsets_fixture_name:
            groupsets_response_content = self.fixture_json(groupsets_fixture_name)
        else:
            groupsets_response_content = empty_groupset_response

        responses.add(
            responses.GET,
            "https://play.dhis2.org/2.30/api/organisationUnitGroupSets.json"
            "?paging=false&fields=id,name,organisationUnitGroups[id,name]",
            json=groupsets_response_content,
            status=200,
        )
        responses.add(
            responses.GET,
            "https://play.dhis2.org/2.30/api/organisationUnitLevels.json"
            "?fields=displayName&fields=id&fields=level&fields=name&pageSize=50&page=1&totalPages=True",
            json=self.fixture_json("organisationUnitLevels"),
            status=200,
        )

    # copy from orgunit api test, can refactor
    def counts(self) -> dict:
        return {
            m.OrgUnit: m.OrgUnit.objects.count(),
            m.OrgUnitType: m.OrgUnitType.objects.count(),
            m.Group: m.Group.objects.count(),
            m.GroupSet: m.GroupSet.objects.count(),
            Modification: Modification.objects.count(),
        }

    def assertNoCreation(self):
        self.assertEqual(self.old_counts, self.counts())

    def assertCreated(self, createds: dict) -> None:
        new_counts = self.counts()
        diff = {}

        for model in new_counts.keys():
            diff[model] = new_counts[model] - self.old_counts[model]
            if model not in createds and diff[model] == 0:
                del diff[model]

        self.assertDictEqual(createds, diff, diff)  # type: ignore


class CommandTests(TestCase, DHIS2TestMixin):
    @responses.activate
    def test_command(self):
        # fixture files based on
        # https://play.dhis2.org/2.30/api/organisationUnits.json?
        # fields=id%2Cname%2Cpath%2Ccoordinates%2Cgeometry%2Cparent%2CorganisationUnitGroups%5Bid%2Cname%5D
        # &filter=id:in:[ImspTQPwCqd,kJq2mPyFEHo,KXSqt7jv6DU,LOpWauwwghf]
        # if it 404 replace 2.30 with the latest dhis2 versions
        self.setup_responses(orgunit_fixture_name="orgunits", groupsets_fixture_name="groupsets")
        self.old_counts = self.counts()

        out = StringIO()
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

        self.assertCreated(
            {
                m.OrgUnit: 4,
                m.OrgUnitType: 5,
                m.Group: 18,
                m.GroupSet: 4,
            }
        )

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

        location_coords = healthcenter.location.coords
        self.assertAlmostEqual(location_coords[0], -11.3596)
        self.assertAlmostEqual(location_coords[1], 8.5317)
        self.assertEqual(location_coords[2], 0)
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
        self.assertQuerysetEqual(
            facility_type.groups.all().order_by("name"),
            ["CHC", "CHP", "Clinic", "Hospital", "MCHP"],
            transform=lambda x: x.name,
        )

        # assert that path has been generated for all org units
        self.assertEquals(0, OrgUnit.objects.filter(path=None).count())

    @responses.activate
    def test_stranges_geom(self):
        """Testfile with Shape with hole and with multi polygon"""
        out = StringIO()
        self.setup_responses(orgunit_fixture_name="orgunits_strange_geom", groupsets_fixture_name=None)
        self.old_counts = self.counts()

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
        self.assertCreated(
            {
                m.OrgUnit: 4,
                m.OrgUnitType: 4,
                m.Group: 2,  # there is 2 group on OrgUnit C
            }
        )

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


class TaskTests(TestCase, DHIS2TestMixin):
    """FIXME this is a copy of the CommandTest adapted for task, we have to keep them in sync"""

    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="a")
        cls.user = cls.create_user_with_profile(username="link", account=cls.account)
        project = Project.objects.create(name="project", account=cls.account)
        cls.source = DataSource.objects.create(name="play")
        cls.source.projects.set([project])

    def setUp(self):
        self.old_counts = self.counts()

    @responses.activate
    def test_import(self):
        self.setup_responses(orgunit_fixture_name="orgunits", groupsets_fixture_name="groupsets")

        task = Task.objects.create(name="dhis2_ou_importer", launcher=self.user, account=self.account)
        dhis2_ou_importer(
            source_id=self.source.id,
            source_version_number=1,
            force=False,
            validate=False,
            continue_on_error=False,
            url="https://play.dhis2.org/2.30",
            login="admin",
            password="district",
            task=task,
            _immediate=True,
        )

        task.refresh_from_db()
        self.assertEquals(task.status, SUCCESS, task.result)

        self.assertCreated(
            {
                m.OrgUnit: 4,
                m.OrgUnitType: 5,
                m.Group: 18,
                m.GroupSet: 4,
            }
        )

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
        location_coords = healthcenter.location.coords
        self.assertAlmostEqual(location_coords[0], -11.3596)
        self.assertAlmostEqual(location_coords[1], 8.5317)
        self.assertEqual(location_coords[2], 0)
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
        self.assertQuerysetEqual(
            facility_type.groups.all(),
            ["CHP", "MCHP", "Clinic", "Hospital", "CHC"],
            transform=lambda x: x.name,
            ordered=False,
        )

        # assert that path has been generated for all org units
        self.assertEquals(0, OrgUnit.objects.filter(path=None).count())

    @responses.activate
    def test_update(self):
        """Testfile with Shape with hole and with multi polygon"""
        self.setup_responses(orgunit_fixture_name="orgunits_strange_geom", groupsets_fixture_name=None)

        # Existing version with data
        version = m.SourceVersion.objects.create(data_source=self.source, number=1)

        OrgUnit.objects.create(name="original c", source_ref="c", version=version)
        OrgUnit.objects.create(name="original d", source_ref="d", version=version)

        self.old_counts = self.counts()

        task = Task.objects.create(name="dhis2_ou_importer", launcher=self.user, account=self.account)
        dhis2_ou_importer(
            source_id=self.source.id,
            source_version_number=1,
            force=False,
            validate=False,
            continue_on_error=False,
            url="https://play.dhis2.org/2.30",
            login="admin",
            password="district",
            update_mode=True,
            task=task,
            _immediate=True,
        )

        task.refresh_from_db()
        self.assertEqual(task.status, "SUCCESS", task.result)
        self.assertCreated(
            {
                m.OrgUnit: 2,
                m.OrgUnitType: 5,
                m.Group: 1,  # there is 2 group on OrgUnit C, they are skipped since we skipped C
            }
        )

        g = m.Group.objects.latest("id")
        self.assertEqual(g.org_units.count(), 2)
        self.assertTrue(g.name.startswith("Imported on"))

        ou_a = OrgUnit.objects.get(source_ref="a")
        self.assertEqual(ou_a.name, "Simple square")
        self.assertEqual(ou_a.geom.area, 1)

        ou_b = OrgUnit.objects.get(source_ref="b")
        self.assertEqual(ou_b.name, "Simple square with a hole")
        self.assertAlmostEqual(ou_b.geom.area, 0.6400000000000033)

        # didn't touch the existing
        ou_d = OrgUnit.objects.get(source_ref="d")
        self.assertEqual(ou_d.name, "original d")
        self.assertEqual(ou_d.geom, None)

        ou_c = OrgUnit.objects.get(source_ref="c")
        self.assertEqual(ou_c.geom, None)
        self.assertEqual(ou_c.name, "original c")

        self.assertEqual(OrgUnit.objects.count(), 4)

    @responses.activate
    def test_update_non_existing(self):
        """Testfile with Shape with hole and with multi polygon"""
        self.setup_responses(orgunit_fixture_name="orgunits_strange_geom", groupsets_fixture_name=None)

        task = Task.objects.create(name="dhis2_ou_importer", launcher=self.user, account=self.account)
        dhis2_ou_importer(
            source_id=self.source.id,
            source_version_number=1,
            force=False,
            validate=False,
            continue_on_error=False,
            url="https://play.dhis2.org/2.30",
            login="admin",
            password="district",
            update_mode=True,
            task=task,
            _immediate=True,
        )

        task.refresh_from_db()
        self.assertEqual(task.status, "SUCCESS", task.result)
        self.assertCreated(
            {
                m.OrgUnit: 4,
                m.OrgUnitType: 4,
                m.Group: 3,  # there are 2 groups on OrgUnit C
            }
        )

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

        g = m.Group.objects.latest("id")
        self.assertEqual(g.org_units.count(), 4)
        self.assertTrue(g.name.startswith("Imported on"))

    @responses.activate
    def test_update_no_new(self):
        self.setup_responses(orgunit_fixture_name="orgunits_strange_geom", groupsets_fixture_name=None)

        # Existing version with data
        version = m.SourceVersion.objects.create(data_source=self.source, number=1)

        OrgUnit.objects.create(name="original a", source_ref="a", version=version)
        OrgUnit.objects.create(name="original b", source_ref="b", version=version)
        OrgUnit.objects.create(name="original c", source_ref="c", version=version)
        OrgUnit.objects.create(name="original d", source_ref="d", version=version)

        self.old_counts = self.counts()

        task = Task.objects.create(name="dhis2_ou_importer", launcher=self.user, account=self.account)
        dhis2_ou_importer(
            source_id=self.source.id,
            source_version_number=1,
            force=False,
            validate=False,
            continue_on_error=False,
            url="https://play.dhis2.org/2.30",
            login="admin",
            password="district",
            update_mode=True,
            task=task,
            _immediate=True,
        )

        task.refresh_from_db()
        self.assertEqual(task.status, "SUCCESS", task.result)
        self.assertCreated(
            {
                m.OrgUnit: 0,
                m.OrgUnitType: 4,
                m.Group: 0,  # there is 2 group on OrgUnit C, they are skipped since we skipped C
            }
        )

        # There is no 'imported on' group since we don't create new orgunits
        groups = m.Group.objects.filter(name__startswith="Imported on")
        self.assertEqual(groups.count(), 0)

        # didn't touch the existing
        ou_a = OrgUnit.objects.get(source_ref="a")
        self.assertEqual(ou_a.name, "original a")
        self.assertEqual(ou_a.geom, None)

        ou_b = OrgUnit.objects.get(source_ref="b")
        self.assertEqual(ou_b.name, "original b")
        self.assertEqual(ou_b.geom, None)

        ou_d = OrgUnit.objects.get(source_ref="d")
        self.assertEqual(ou_d.name, "original d")
        self.assertEqual(ou_d.geom, None)

        ou_c = OrgUnit.objects.get(source_ref="c")
        self.assertEqual(ou_c.geom, None)
        self.assertEqual(ou_c.name, "original c")

        self.assertEqual(OrgUnit.objects.count(), 4)
