from pathlib import Path

import fiona

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
        cls.project = m.Project.objects.create(name="Project 1", account=cls.account, app_id="project_1")
        cls.source = m.DataSource.objects.create(name=cls.source_name)
        cls.version = m.SourceVersion.objects.create(number=1, data_source=cls.source)
        out = m.OrgUnitType.objects.create(name="type1", depth=2)
        out2 = m.OrgUnitType.objects.create(name="type2", depth=4)
        out.projects.add(cls.project)
        p = Point(x=1, y=1.5, z=3)
        cls.ou_code = "code ou 1"
        ou = m.OrgUnit.objects.create(
            name="ou1",
            source_ref="cdd3e94c-3c2a-4ab1-8900-be97f82347de",
            version=cls.version,
            org_unit_type=out,
            location=p,
            opening_date="2020-01-01",
            closed_date="2021-12-31",
            code=cls.ou_code,
        )
        polygon = MultiPolygon([Polygon([(0, 0), (0, 1), (2, 1), (1, 0), (0, 0)])])
        cls.polygon = polygon
        cls.ou_code2 = "code ou 2"
        ou2 = m.OrgUnit.objects.create(
            name="ou2",
            version=cls.version,
            org_unit_type=out2,
            parent=ou,
            geom=polygon,
            simplified_geom=polygon,
            code=cls.ou_code2,
        )
        m.OrgUnit.objects.create(name="ou3", version=cls.version, parent=ou2)  # no orgunit type and no geom
        cls.group1 = m.Group.objects.create(name="group1", source_version=cls.version)
        cls.group2 = m.Group.objects.create(name="group2", source_ref="my_group_ref", source_version=cls.version)
        ou.groups.add(cls.group1)
        ou2.groups.set([cls.group1, cls.group2])

    def setUp(self):
        """Make sure we have a fresh client at the beginning of each test"""
        p = Path("/tmp/temporary_test.gpkg")
        if p.exists():
            p.unlink()
        self.filename = str(p)

    def test_export_import(self):
        source_to_gpkg(self.filename, self.version)
        # import in a new version and project
        new_project = m.Project.objects.create(name="Project 2", account=self.account, app_id="project_2")

        # Ensure the DataSource is configured with the new project
        self.source.projects.add(new_project)

        import_gpkg_file(
            "/tmp/temporary_test.gpkg",
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
        self.assertEqual(root.opening_date.strftime("%Y-%m-%d"), "2020-01-01")
        self.assertEqual(root.closed_date.strftime("%Y-%m-%d"), "2021-12-31")

        self.assertEqual(root.groups.count(), 1)
        first_group = root.groups.first()
        self.assertEqual(first_group.name, self.group1.name)
        self.assertEqual(first_group.source_version_id, v2.id)

        c1 = root.orgunit_set.first()
        self.assertEqual(c1.name, "ou2")
        self.assertEqual(c1.org_unit_type.name, "type2")

        c1_groups = c1.groups.all().order_by("name")
        self.assertEqual(c1_groups.count(), 2)
        self.assertEqual(c1_groups[0].name, self.group1.name)
        self.assertEqual(c1_groups[0].source_version_id, v2.id)
        self.assertEqual(c1_groups[1].name, self.group2.name)
        self.assertEqual(c1_groups[1].source_version_id, v2.id)

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
        new_project = m.Project.objects.create(name="Project 3", account=self.account, app_id="project_3")

        # Ensure the DataSource is configured with the new project
        self.source.projects.add(new_project)

        import_gpkg_file(
            "/tmp/temporary_test.gpkg",
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

    def test_export_codes(self):
        """Test that codes are exported"""
        gpkg_content = org_units_to_gpkg_bytes(m.OrgUnit.objects.all())
        with fiona.BytesCollection(gpkg_content) as collection:
            column_names = collection.schema["properties"].keys()
            self.assertIn("code", column_names)

        # Check if the code is present in the exported data
        self.assertIn(self.ou_code.encode("utf-8"), gpkg_content)
        self.assertIn(self.ou_code2.encode("utf-8"), gpkg_content)
