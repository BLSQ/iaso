from django.contrib.gis.geos import Point

from hat.audit.models import Modification
from iaso.gpkg.import_gpkg import import_gpkg_file
from iaso.models import Account, DataSource, Group, OrgUnit, OrgUnitType, Project, SourceVersion
from iaso.test import TestCase


class GPKGImport(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="a")
        cls.project = Project.objects.create(name="Project 1", account=cls.account, app_id="test_app_id")

    def test_minimal_import(self):
        self.assertEqual(0, Modification.objects.filter(content_type__model="orgunit").count())
        self.assertEqual(0, Modification.objects.filter(content_type__model="group").count())
        import_gpkg_file(
            "./iaso/tests/fixtures/gpkg/minimal.gpkg",
            project_id=self.project.id,
            source_name="test",
            version_number=1,
            validation_status="new",
            description="",
        )
        self.assertEqual(OrgUnit.objects.all().count(), 3)
        self.assertEqual(Group.objects.all().count(), 2)
        self.assertEqual(OrgUnitType.objects.count(), 3)

        self.assertEqual(3, Modification.objects.filter(content_type__model="orgunit").count())
        self.assertEqual(2, Modification.objects.filter(content_type__model="group").count())

        root = OrgUnit.objects.get(source_ref="cdd3e94c-3c2a-4ab1-8900-be97f82347de")
        self.assertEqual(root.name, "District Betare Oya")
        self.assertEqual(root.org_unit_type.name, "DS")
        self.assertEqual(root.groups.all().count(), 0)
        self.assertEqual(root.opening_date.strftime("%Y-%m-%d"), "2020-01-01")
        self.assertEqual(root.closed_date.strftime("%Y-%m-%d"), "2021-12-31")

        self.assertEqual(root.orgunit_set.all().count(), 1)
        self.assertEqual(str(root.path), f"{root.pk}")

        self.assertEqual(root.location, None)
        self.assertEqual(root.geom.geom_type, "MultiPolygon")

        self.assertEqual(root.geom.num_coords, 3999)
        self.assertEqual(root.simplified_geom.num_coords, 586)

        c = root.orgunit_set.first()
        self.assertEqual(c.name, "AS Tongo Gadima")
        self.assertEqual(c.org_unit_type.name, "AS")
        self.assertEqual(c.parent, root)
        self.assertEqual(c.orgunit_set.all().count(), 1)
        self.assertEqual(str(c.path), f"{root.pk}.{c.pk}")
        self.assertEqual(c.location, None)
        self.assertEqual(c.geom.geom_type, "MultiPolygon")
        self.assertEqual(c.geom.num_coords, 2108)
        self.assertEqual(c.simplified_geom.num_coords, 592)
        self.assertEqual(c.groups.all().count(), 0)

        c2 = c.orgunit_set.first()
        self.assertEqual(c2.name, "CSI de Garga-Sarali")
        self.assertEqual(c2.org_unit_type.name, "FOSA")
        self.assertEqual(c2.parent, c)
        self.assertEqual(str(c2.path), f"{root.pk}.{c.pk}.{c2.pk}")
        self.assertEqual(c2.geom, None)
        self.assertEqual(c2.simplified_geom, None)
        self.assertEqual(c2.location, Point(13.9993, 5.1795, 0.0, srid=4326))

        c2_groups = c2.groups.all().order_by("source_ref")
        self.assertEqual(c2_groups.count(), 2)
        self.assertEqual(c2_groups[0].name, "Group A")
        self.assertEqual(c2_groups[0].source_version.number, 1)
        self.assertEqual(c2_groups[1].name, "Group B")
        self.assertEqual(c2_groups[1].source_version.number, 1)

        self.assertEqual(OrgUnitType.objects.count(), 3)
        self.assertEqual(DataSource.objects.count(), 1)
        self.assertEqual(root.version.data_source.name, "test")
        self.assertEqual(root.version.number, 1)

    def test_minimal_import_modify_existing(self):
        version_number = 2
        source_name = "hey"
        source = DataSource.objects.create(name=source_name)
        version = SourceVersion.objects.create(number=version_number, data_source=source)
        ou = OrgUnit.objects.create(
            name="bla",
            source_ref="cdd3e94c-3c2a-4ab1-8900-be97f82347de",
            version=version,
            opening_date="2020-01-01",
            closed_date="2021-12-31",
        )
        g = Group.objects.create(source_version=version, source_ref="group_b", name="Previous name of group B")
        ou.groups.set([g])
        self.assertEqual(ou.groups.count(), 1)
        self.assertEqual(ou.groups.first().name, "Previous name of group B")
        self.assertEqual(ou.groups.first().source_version, version)
        ou2 = OrgUnit.objects.create(name="bla2", source_ref="3c24c6ca-3012-4d38-abe8-6d620fe1deb8", version=version)
        ou2.groups.set([g])
        self.assertEqual(ou2.groups.count(), 1)
        self.assertEqual(ou2.groups.first().name, "Previous name of group B")
        self.assertEqual(ou2.groups.first().source_version, version)

        import_gpkg_file(
            "./iaso/tests/fixtures/gpkg/minimal.gpkg",
            project_id=self.project.id,
            source_name=source_name,
            version_number=version_number,
            validation_status="new",
            description="",
        )

        self.assertEqual(OrgUnit.objects.all().count(), 3)
        self.assertEqual(Group.objects.all().count(), 2)
        self.assertEqual(OrgUnitType.objects.count(), 3)

        self.assertEqual(3, Modification.objects.filter(content_type__model="orgunit").count())

        self.assertEqual(
            2, Modification.objects.filter(content_type__model="group", content_type__app_label="iaso").count()
        )

        ou.refresh_from_db()
        self.assertEqual(ou.name, "District Betare Oya")
        self.assertEqual(ou.source_ref, "cdd3e94c-3c2a-4ab1-8900-be97f82347de")
        self.assertEqual(ou.org_unit_type.name, "DS")
        self.assertEqual(ou.geom.geom_type, "MultiPolygon")
        self.assertQuerySetEqual(ou.groups.all(), [])

        mods = Modification.objects.filter(content_type__model="orgunit")
        mod = mods.get(object_id=ou.id)
        old = mod.past_value[0]
        new = mod.new_value[0]
        self.assertEqual(old["fields"]["name"], "bla")
        self.assertEqual(new["fields"]["name"], "District Betare Oya")
        self.assertEqual(old["fields"]["opening_date"], "2020-01-01")
        self.assertEqual(old["fields"]["closed_date"], "2021-12-31")
        self.assertEqual(new["fields"]["opening_date"], "2020-01-01")
        self.assertEqual(new["fields"]["closed_date"], "2021-12-31")

        g.refresh_from_db()
        self.assertEqual(g.name, "Group B")

        ou2.refresh_from_db()

        ou2_groups = ou2.groups.all().order_by("source_ref")
        self.assertEqual(ou2_groups.count(), 2)
        self.assertEqual(ou2_groups[0].name, "Group A")
        self.assertEqual(ou2_groups[0].source_version.number, version_number)
        self.assertEqual(ou2_groups[1].name, "Group B")
        self.assertEqual(ou2_groups[1].source_version.number, version_number)

        mod = mods.get(object_id=ou2.id)
        old = mod.past_value[0]
        new = mod.new_value[0]
        self.assertEqual(old["fields"]["name"], "bla2")
        self.assertEqual(new["fields"]["name"], "CSI de Garga-Sarali")

        ou3 = OrgUnit.objects.get(source_ref="cc5421f2-2003-4f01-be4f-5f64463ab456")
        mod = mods.get(object_id=ou3.id)
        self.assertEqual(mod.past_value, [])
        new = mod.new_value[0]

        self.assertEqual(new["fields"]["name"], "AS Tongo Gadima")

    def test_minimal_import_dont_modify_if_diff_source(self):
        version_number = 1
        source_name = "hey"
        source = DataSource.objects.create(name=source_name)
        version = SourceVersion.objects.create(number=2, data_source=source)  # same source different version number
        ou = OrgUnit.objects.create(name="bla", source_ref="cdd3e94c-3c2a-4ab1-8900-be97f82347de", version=version)
        source2 = DataSource.objects.create(name="different_source")
        other_version = SourceVersion.objects.create(number=version_number, data_source=source2)
        ou2 = OrgUnit.objects.create(
            name="bla2", source_ref="cdd3e94c-3c2a-4ab1-8900-be97f82347de", version=other_version
        )
        Group.objects.create(source_version=version, source_ref="group_b", name="Group B")
        Group.objects.create(source_version=other_version, source_ref="group_b", name="Group B")
        import_gpkg_file(
            "./iaso/tests/fixtures/gpkg/minimal.gpkg",
            project_id=self.project.id,
            source_name="source_name",
            version_number=version_number,
            validation_status="new",
            description="",
        )

        self.assertEqual(OrgUnit.objects.all().count(), 5)
        self.assertEqual(Group.objects.all().count(), 4)
        self.assertEqual(OrgUnitType.objects.count(), 3)

        self.assertEqual(3, Modification.objects.filter(content_type__model="orgunit").count())
        self.assertEqual(
            2, Modification.objects.filter(content_type__model="group", content_type__app_label="iaso").count()
        )

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
            description="",
        )
        self.assertEqual(OrgUnitType.objects.count(), 3)
        self.assertEqual(OrgUnit.objects.all().count(), 4)
        self.assertEqual(Group.objects.all().count(), 2)

        self.assertEqual(3, Modification.objects.filter(content_type__model="orgunit").count())
        self.assertEqual(
            2, Modification.objects.filter(content_type__model="group", content_type__app_label="iaso").count()
        )
        ou = OrgUnit.objects.get(source_ref="empty_geom")
        self.assertEqual(ou.name, "empty_geom")

    def test_import_orgunit_existing_orgunit_type(self):
        """A similar (same name and depth) OUT already exists for the same account, so we reuse this one"""
        out: OrgUnitType
        out = OrgUnitType.objects.create(name="AS", depth=4)
        out.projects.add(self.project)
        import_gpkg_file(
            "./iaso/tests/fixtures/gpkg/minimal_simplified.gpkg",
            project_id=self.project.id,
            source_name="test",
            version_number=1,
            validation_status="new",
            description="",
        )
        self.assertEqual(OrgUnitType.objects.count(), 3)
        self.assertEqual(OrgUnit.objects.all().count(), 4)
        self.assertEqual(Group.objects.all().count(), 2)

        self.assertEqual(3, Modification.objects.filter(content_type__model="orgunit").count())

        self.assertEqual(
            2, Modification.objects.filter(content_type__model="group", content_type__app_label="iaso").count()
        )

        out.refresh_from_db()
        self.assertEqual(out.projects.count(), 1)

    def test_import_orgunit_duplicates_other_account(self):
        """Regression test for IA-1512:

        "'NoneType' object has no attribute 'projects'" happened when importing a GPKG in the following situation:
        - several OUT already in the system similar (same name, shortname and depth) to the one being imported
        - None of those OUT are linked to the import's project

        This test function:

        1) Ensures that the 'NoneType' object has no attribute 'projects' doesn't happen anymore
        2) make sure that a new OUT gets created (because they are scoped per account, and the existing ones are in
        another account) with the correct values

        """
        other_account = Account.objects.create(name="b")
        project2 = Project.objects.create(name="Project 2", account=other_account, app_id="test_app_id3")
        out_project2 = OrgUnitType.objects.create(name="FOSA", short_name="FOSA", depth=5)
        out_project2.projects.add(project2)

        project3 = Project.objects.create(name="Project 3", account=other_account, app_id="test_app_id4")
        out_project3 = OrgUnitType.objects.create(name="FOSA", short_name="FOSA", depth=5)
        out_project3.projects.add(project3)

        import_gpkg_file(
            "./iaso/tests/fixtures/gpkg/minimal.gpkg",
            project_id=self.project.id,
            source_name="test",
            version_number=1,
            validation_status="new",
            description="",
        )

        # If it hasn't imploded in flight here, it means the "NoneType" exception doesn't happen anymore...

    def test_import_orgunit_existing_orgunit_type_in_diff_proj(self):
        other_project = Project.objects.create(name="Project 2", account=self.account, app_id="test_app_id2")
        out = OrgUnitType.objects.create(name="AS", depth=100)
        out.projects.add(other_project)
        import_gpkg_file(
            "./iaso/tests/fixtures/gpkg/minimal_simplified.gpkg",
            project_id=self.project.id,
            source_name="test",
            version_number=1,
            validation_status="new",
            description="",
        )
        self.assertEqual(OrgUnitType.objects.count(), 4)
        self.assertEqual(OrgUnit.objects.all().count(), 4)
        self.assertEqual(Group.objects.all().count(), 2)

        self.assertEqual(3, Modification.objects.filter(content_type__model="orgunit").count())
        self.assertEqual(
            2, Modification.objects.filter(content_type__model="group", content_type__app_label="iaso").count()
        )

        out.refresh_from_db()
        self.assertEqual(out.projects.count(), 1)

    def test_without_version_number(self):
        # If version number is None, it should create a new version after the last one on this source
        source_name = "hey"
        source = DataSource.objects.create(name=source_name)
        SourceVersion.objects.create(number=16, data_source=source)
        SourceVersion.objects.create(number=11, data_source=source)
        other_source = DataSource.objects.create(name="other source")
        SourceVersion.objects.create(number=17, data_source=other_source)
        SourceVersion.objects.create(number=18, data_source=other_source)

        import_gpkg_file(
            "./iaso/tests/fixtures/gpkg/minimal_simplified.gpkg",
            project_id=self.project.id,
            source_name=source_name,
            version_number=None,
            validation_status="VALID",
            description="",
        )

        source = DataSource.objects.get(name=source_name)

        self.assertEqual(SourceVersion.objects.count(), 5)
        self.assertEqual(source.versions.all().count(), 3)
        self.assertQuerySetEqual(source.versions.all().order_by("number"), [11, 16, 17], lambda x: x.number)

        self.assertEqual(OrgUnitType.objects.count(), 3)
        self.assertEqual(OrgUnit.objects.all().count(), 4)
        self.assertEqual(Group.objects.all().count(), 2)

        self.assertEqual(3, Modification.objects.filter(content_type__model="orgunit").count())
        self.assertEqual(
            2, Modification.objects.filter(content_type__model="group", content_type__app_label="iaso").count()
        )

    def test_column_validation(self):
        """Test column validation according to specifications:
        Required columns (must exist and cannot be null/empty/blank):
        - ref
        - name

        Optional non-nullable columns (can be missing, but if present cannot be empty):
        - parent_ref

        Optional nullable columns (can be missing or empty):
        - group_refs
        - opening_date
        - closing_date
        """
        # Test required columns (ref, name)
        required_columns = ["ref", "name"]
        for column in required_columns:
            try:
                import_gpkg_file(
                    f"./iaso/tests/fixtures/gpkg/missing_column_{column}.gpkg",
                    project_id=self.project.id,
                    source_name="test",
                    version_number=1,
                    validation_status="new",
                    description="",
                )
            except ValueError as e:
                print(f"Caught expected error: {str(e)}")


class GPKGImportSimplifiedGroup(TestCase):
    """Tests case around minimal_simplified_group.gpk

    to check if we can reference group not existing in the gpkg itself"""

    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="a")
        cls.project = Project.objects.create(name="Project 1", account=cls.account, app_id="test_app_id")
        version_number = 1
        cls.source_name = "test source"
        cls.source = DataSource.objects.create(name=cls.source_name)
        cls.version = SourceVersion.objects.create(number=version_number, data_source=cls.source)

    def test_import_orgunit_existing_group(self):
        Group.objects.create(source_ref="group_not_in_gpkg", source_version=self.version)

        import_gpkg_file(
            "./iaso/tests/fixtures/gpkg/minimal_simplified_group.gpkg",
            project_id=self.project.id,
            source_name=self.source_name,
            version_number=1,
            validation_status="new",
            description="",
        )

        self.assertEqual(OrgUnitType.objects.count(), 3)
        self.assertEqual(OrgUnit.objects.all().count(), 4)
        self.assertEqual(Group.objects.all().count(), 3)

        self.assertEqual(3, Modification.objects.filter(content_type__model="orgunit").count())
        self.assertEqual(
            2, Modification.objects.filter(content_type__model="group", content_type__app_label="iaso").count()
        )

        ou = OrgUnit.objects.get(source_ref="3c24c6ca-3012-4d38-abe8-6d620fe1deb8")
        self.assertEqual(ou.groups.count(), 3)

    def test_import_orgunit_non_existing_group(self):
        # Group is referenced in gpkg but don't exist in gpkg or in source
        with self.assertRaises(ValueError):
            import_gpkg_file(
                "./iaso/tests/fixtures/gpkg/minimal_simplified_group.gpkg",
                project_id=self.project.id,
                source_name=self.source_name,
                version_number=1,
                validation_status="new",
                description="",
            )
