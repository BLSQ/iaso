from pathlib import Path

from django.contrib.gis.geos import MultiPolygon, Point, Polygon

from iaso import models as m
from iaso.gpkg.export_gpkg import org_units_to_gpkg_bytes, source_to_gpkg
from iaso.gpkg.import_gpkg import import_gpkg_file
from iaso.test import TestCase


class GPKGExport(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.source_name = "test_import"
        cls.account = m.Account.objects.create(name="a")
        cls.project = m.Project.objects.create(name="Project 1", account=cls.account, app_id="test_app_id")
        cls.source = m.DataSource.objects.create(name=cls.source_name)
        cls.version = m.SourceVersion.objects.create(number=1, data_source=cls.source)
        out = m.OrgUnitType.objects.create(name="type1", depth=2)
        out2 = m.OrgUnitType.objects.create(name="type2", depth=4)
        out.projects.add(cls.project)
        p = Point(x=1, y=1.5, z=3)
        ou = m.OrgUnit.objects.create(
            name="ou1",
            source_ref="cdd3e94c-3c2a-4ab1-8900-be97f82347de",
            version=cls.version,
            org_unit_type=out,
            location=p,
        )
        polygon = MultiPolygon([Polygon([(0, 0), (0, 1), (2, 1), (1, 0), (0, 0)])])
        cls.polygon = polygon
        ou2 = m.OrgUnit.objects.create(
            name="ou2", version=cls.version, org_unit_type=out2, parent=ou, geom=polygon, simplified_geom=polygon
        )
        m.OrgUnit.objects.create(name="ou3", version=cls.version, parent=ou2)  # no orgunit type and no geom
        group1 = m.Group.objects.create(name="group1", source_version=cls.version)
        group2 = m.Group.objects.create(name="group2", source_ref="my_group_ref", source_version=cls.version)
        ou.groups.add(group1)
        ou2.groups.set([group1, group2])

    def setUp(self):
        """Make sure we have a fresh client at the beginning of each test"""
        p = Path("/tmp/temporary_test.gpkg")
        if p.exists():
            p.unlink()
        self.filename = str(p)

    def test_export_import(self):
        source_to_gpkg(self.filename, self.version)
        # import in a new version and project
        new_project = m.Project.objects.create(name="Project 2", account=self.account, app_id="test_app_id")
        import_gpkg_file(
            "/tmp/temporary_test.gpkg",
            project_id=new_project.id,
            source_name=self.source_name,
            version_number=2,
            validation_status="new",
            description="",
        )

        v2 = m.SourceVersion.objects.get(data_source__name=self.source_name, number=2)
        self.assertEqual(v2.orgunit_set.all().count(), 3)

        self.assertEqual(
            m.OrgUnitType.objects.filter(projects=new_project).count(), 3
        )  # The unknown type created because ou3 don't have one
        self.assertEqual(v2.group_set.count(), 2)

        root = v2.orgunit_set.get(parent=None)
        root.orgunit_set.all()

        self.assertEqual(root.name, "ou1")
        self.assertEqual(root.org_unit_type.name, "type1")
        self.assertEqual(root.orgunit_set.count(), 1)
        self.assertQuerySetEqual(root.groups.all(), ["<Group: group1 | test_import  2 >"], transform=repr)
        c1 = root.orgunit_set.first()
        self.assertEqual(c1.name, "ou2")
        self.assertEqual(c1.org_unit_type.name, "type2")
        self.assertQuerySetEqual(
            c1.groups.all().order_by("name"),
            ["<Group: group1 | test_import  2 >", "<Group: group2 | test_import  2 >"],
            transform=repr,
        )
        self.assertEqual(c1.geom, c1.simplified_geom)
        self.assertEqual(c1.geom, self.polygon)
        c2 = c1.orgunit_set.first()
        self.assertEqual(c2.name, "ou3")
        self.assertEqual(c2.org_unit_type.name, "Unknown")
        self.assertQuerySetEqual(c2.groups.all(), [])

    def test_export_mixed(self):
        # new type with two orgunit of mixed type geography
        out3 = m.OrgUnitType.objects.create(name="type3", depth=3)

        polygon = MultiPolygon([Polygon([(0, 0), (0, 1), (2, 1), (1, 0), (0, 0)])])
        m.OrgUnit.objects.create(name="ou4", version=self.version, org_unit_type=out3, geom=polygon)
        p = Point(x=1, y=3, z=3)
        m.OrgUnit.objects.create(name="ou5", version=self.version, org_unit_type=out3, location=p)
        source_to_gpkg(self.filename, self.version)
        new_project = m.Project.objects.create(name="Project 2", account=self.account, app_id="test_app_id")

        import_gpkg_file(
            "/tmp/temporary_test.gpkg",
            project_id=new_project.id,
            source_name=self.source_name,
            version_number=2,
            validation_status="new",
            description="",
        )
        v2 = m.SourceVersion.objects.get(data_source__name=self.source_name, number=2)
        self.assertEqual(v2.orgunit_set.all().count(), 5)

        # The unknown type created because ou3 don't have one
        self.assertEqual(m.OrgUnitType.objects.filter(projects=new_project).count(), 4)
        self.assertEqual(v2.group_set.count(), 2)

    def test_export_one(self):
        """We hit a strange Pandas crash when exporting a single orgunit without parent"""
        orgs = m.OrgUnit.objects.filter(name="ou1")
        self.assertEqual(orgs.count(), 1)
        org_units_to_gpkg_bytes(orgs)

    def test_export_no_parent(self):
        """Idem all ou without parent"""
        out = m.OrgUnitType.objects.create(name="type2", depth=2)
        m.OrgUnit.objects.create(name="bla", org_unit_type=out)
        m.OrgUnit.objects.create(name="bla2", org_unit_type=out)
        orgs = m.OrgUnit.objects.filter(org_unit_type=out)

        self.assertEqual(orgs.count(), 2)
        org_units_to_gpkg_bytes(orgs)
