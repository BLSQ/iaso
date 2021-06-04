import os

from django.contrib.gis.geos import Point, Polygon, MultiPolygon

from iaso.gpkg.export_gpkg import export_source_gpkg
from iaso.gpkg.import_gpkg import import_gpkg_file
from iaso.test import TestCase
from iaso import models as m


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
        ou3 = m.OrgUnit.objects.create(name="ou3", version=cls.version, parent=ou2)  # no orgunit type and no geom
        group1 = m.Group.objects.create(name="group1", source_version=cls.version)
        group2 = m.Group.objects.create(name="group2", source_ref="my_group_ref", source_version=cls.version)
        ou.groups.add(group1)
        ou2.groups.set([group1, group2])

    def test_export_import(self):
        from pathlib import Path

        p = Path("/tmp/temporary_test.gpkg")
        if p.exists():
            p.unlink()

        export_source_gpkg("/tmp/temporary_test.gpkg", self.version)
        # import in a new version and project
        new_project = m.Project.objects.create(name="Project 2", account=self.account, app_id="test_app_id")
        import_gpkg_file(
            "/tmp/temporary_test.gpkg",
            project_id=new_project.id,
            source_name=self.source_name,
            version_number=2,
            validation_status="new",
        )
        print(m.SourceVersion.objects.all())

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
        self.assertQuerysetEqual(root.groups.all(), ["<Group: group1 | test_import  2 >"])
        c1 = root.orgunit_set.first()
        self.assertEqual(c1.name, "ou2")
        self.assertEqual(c1.org_unit_type.name, "type2")
        self.assertQuerysetEqual(
            c1.groups.all().order_by("name"), ["<Group: group1 | test_import  2 >", "<Group: group2 | test_import  2 >"]
        )
        self.assertEqual(c1.geom, c1.simplified_geom)
        self.assertEqual(c1.geom, self.polygon)
        c2 = c1.orgunit_set.first()
        self.assertEqual(c2.name, "ou3")
        self.assertEqual(c2.org_unit_type.name, "Unknown")
        self.assertQuerysetEqual(c2.groups.all(), [])
