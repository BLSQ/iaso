from django.contrib.gis.geos import Point

from iaso import models as m
from iaso.gpkg.import_gpkg import import_gpkg_file
from iaso.test import TestCase


class GPKGImport(TestCase):
    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="a")
        cls.project = m.Project.objects.create(name="Project 1", account=account, app_id="test_app_id")

    def test_minimal_import(self):
        import_gpkg_file(
            "./iaso/tests/fixtures/gpkg/minimal.gpkg",
            project_id=self.project.id,
            source_name="test",
            version_number=1,
            validation_status="new",
        )
        self.assertEqual(m.OrgUnit.objects.all().count(), 3)
        self.assertEqual(m.Group.objects.all().count(), 2)

        root = m.OrgUnit.objects.get(parent=None)
        self.assertEqual(root.name, "District Betare Oya")
        self.assertEqual(root.source_ref, "cdd3e94c-3c2a-4ab1-8900-be97f82347de")
        self.assertEqual(root.org_unit_type.name, "DS")
        self.assertEqual(root.groups.all().count(), 0)

        self.assertEqual(root.orgunit_set.all().count(), 1)
        self.assertEqual(str(root.path), f"{root.pk}")

        self.assertEqual(root.location, None)
        self.assertEqual(root.geom.geom_type, "MultiPolygon")

        self.assertEqual(len(root.geom.coords[0][0]), 3999)

        c = root.orgunit_set.first()
        self.assertEqual(c.name, "AS Tongo Gadima")
        self.assertEqual(c.org_unit_type.name, "AS")
        self.assertEqual(c.parent, root)
        self.assertEqual(c.orgunit_set.all().count(), 1)
        self.assertEqual(str(c.path), f"{root.pk}.{c.pk}")
        self.assertEqual(c.location, None)
        self.assertEqual(c.geom.geom_type, "MultiPolygon")
        self.assertEqual(len(c.geom.coords[0][0]), 2108)

        self.assertEqual(c.groups.all().count(), 0)

        c2 = c.orgunit_set.first()
        self.assertEqual(c2.name, "CSI de Garga-Sarali")
        self.assertEqual(c2.org_unit_type.name, "FOSA")
        self.assertEqual(c2.parent, c)
        self.assertEqual(str(c2.path), f"{root.pk}.{c.pk}.{c2.pk}")
        self.assertEqual(c2.geom, None)
        self.assertEqual(c2.location, Point(13.9993, 5.1795, 0.0, srid=4326))
        self.assertQuerysetEqual(
            c2.groups.all().order_by("source_ref"), ["<Group: Group A | test  1 >", "<Group: Group B | test  1 >"]
        )

        self.assertEqual(m.OrgUnitType.objects.count(), 3)
        self.assertEqual(m.DataSource.objects.count(), 1)
        self.assertEqual(root.version.data_source.name, "test")
        self.assertEqual(root.version.number, 1)

    def test_minimal_import_modify_existing(self):
        version_number = 2
        source_name = "hey"
        source = m.DataSource.objects.create(name=source_name)
        version = m.SourceVersion.objects.create(number=version_number, data_source=source)
        ou = m.OrgUnit.objects.create(name="bla", source_ref="cdd3e94c-3c2a-4ab1-8900-be97f82347de", version=version)
        g = m.Group.objects.create(source_version=version, source_ref="group_b", name="Previous name of group B")
        ou.groups.set([g])
        self.assertQuerysetEqual(ou.groups.all(), ["<Group: Previous name of group B | hey  2 >"])
        ou2 = m.OrgUnit.objects.create(name="bla2", source_ref="3c24c6ca-3012-4d38-abe8-6d620fe1deb8", version=version)
        ou2.groups.set([g])
        self.assertQuerysetEqual(ou2.groups.all(), ["<Group: Previous name of group B | hey  2 >"])

        import_gpkg_file(
            "./iaso/tests/fixtures/gpkg/minimal.gpkg",
            project_id=self.project.id,
            source_name=source_name,
            version_number=version_number,
            validation_status="new",
        )
        self.assertEqual(m.OrgUnit.objects.all().count(), 3)
        self.assertEqual(m.Group.objects.all().count(), 2)

        ou.refresh_from_db()
        self.assertEqual(ou.name, "District Betare Oya")
        self.assertEqual(ou.source_ref, "cdd3e94c-3c2a-4ab1-8900-be97f82347de")
        self.assertEqual(ou.org_unit_type.name, "DS")
        self.assertEqual(ou.geom.geom_type, "MultiPolygon")
        self.assertQuerysetEqual(ou.groups.all(), [])

        g.refresh_from_db()
        self.assertEqual(g.name, "Group B")

        ou2.refresh_from_db()
        self.assertQuerysetEqual(
            ou2.groups.all().order_by("source_ref"), ["<Group: Group A | hey  2 >", "<Group: Group B | hey  2 >"]
        )

    def test_minimal_import_dont_modify_if_diff_source(self):
        version_number = 1
        source_name = "hey"
        source = m.DataSource.objects.create(name=source_name)
        version = m.SourceVersion.objects.create(number=2, data_source=source)  # same source different version number
        ou = m.OrgUnit.objects.create(name="bla", source_ref="cdd3e94c-3c2a-4ab1-8900-be97f82347de", version=version)
        source2 = m.DataSource.objects.create(name="different_source")
        other_version = m.SourceVersion.objects.create(number=version_number, data_source=source2)
        ou2 = m.OrgUnit.objects.create(
            name="bla2", source_ref="cdd3e94c-3c2a-4ab1-8900-be97f82347de", version=other_version
        )
        g = m.Group.objects.create(source_version=version, source_ref="group_b", name="Group B")
        g2 = m.Group.objects.create(source_version=other_version, source_ref="group_b", name="Group B")
        import_gpkg_file(
            "./iaso/tests/fixtures/gpkg/minimal.gpkg",
            project_id=self.project.id,
            source_name="source_name",
            version_number=version_number,
            validation_status="new",
        )

        self.assertEqual(m.OrgUnit.objects.all().count(), 5)
        self.assertEqual(m.Group.objects.all().count(), 4)

        ou.refresh_from_db()
        self.assertEqual(ou.name, "bla")
        self.assertEqual(ou.source_ref, "cdd3e94c-3c2a-4ab1-8900-be97f82347de")
        self.assertEqual(ou.org_unit_type, None)

        ou2.refresh_from_db()
        self.assertEqual(ou2.name, "bla2")
        self.assertEqual(ou2.source_ref, "cdd3e94c-3c2a-4ab1-8900-be97f82347de")
        self.assertEqual(ou2.org_unit_type, None)

    def test_import_orgunit_with_nogeo(self):
        import_gpkg_file(
            "./iaso/tests/fixtures/gpkg/minimal_simplified.gpkg",
            project_id=self.project.id,
            source_name="test",
            version_number=1,
            validation_status="new",
        )
        self.assertEqual(m.OrgUnit.objects.all().count(), 4)
        self.assertEqual(m.Group.objects.all().count(), 2)
        ou = m.OrgUnit.objects.get(source_ref="empty_geom")
        self.assertEqual(ou.name, "empty_geom")
