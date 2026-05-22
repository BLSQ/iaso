import os
import tempfile

from django.contrib.gis.geos import MultiPolygon, Point, Polygon

from iaso import models as m
from iaso.gpkg import org_units_to_gpkg_bytes
from iaso.gpkg.import_gpkg import import_gpkg_file
from iaso.test import TestCase


class ExportTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="a")
        cls.project = m.Project.objects.create(name="Project 1", account=cls.account, app_id="test_app_id")

        sw_source = m.DataSource.objects.create(name="Evil Empire")
        cls.sw_source = sw_source
        sw_version_1 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        sw_version_2 = m.SourceVersion.objects.create(data_source=sw_source, number=2)
        cls.sw_version_1 = sw_version_1
        cls.sw_version_2 = sw_version_2

        cls.jedi_squad = m.OrgUnitType.objects.create(name="Jedi Squad", short_name="Jds")
        cls.jedi_team = m.OrgUnitType.objects.create(name="Jedi Team", short_name="Jdt")
        cls.jedi_squad.sub_unit_types.add(cls.jedi_team)

        cls.mock_point = Point(x=4, y=50, z=100)
        cls.mock_multipolygon = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))
        cls.jedi_squad_brussels = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_squad,
            version=sw_version_1,
            name="Brussels Jedi Squad",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
        )

        cls.jedi_team_saint_gilles = m.OrgUnit.objects.create(
            parent=cls.jedi_squad_brussels,
            org_unit_type=cls.jedi_team,
            version=sw_version_2,
            name="Saint-Gilles Jedi Team",
            location=cls.mock_point,
        )

    def test_org_units_to_gpkg(self):
        gpkg_content = org_units_to_gpkg_bytes(m.OrgUnit.objects.all())
        self.assertIsInstance(gpkg_content, bytes)
        self.assertGreater(len(gpkg_content), 200)

    def test_org_units_source_ref_handling(self):
        # Create org units with different source_ref scenarios
        org_unit_none_ref = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_team,
            version=self.sw_version_1,
            name="None Ref Unit",
            source_ref=None,
        )

        org_unit_empty_ref = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_team,
            version=self.sw_version_1,
            name="Empty Ref Unit",
            source_ref="",
        )

        org_unit_with_ref = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_team,
            version=self.sw_version_1,
            name="With Ref Unit",
            source_ref="test-ref-123",
        )

        # Export to gpkg
        gpkg_content = org_units_to_gpkg_bytes(
            m.OrgUnit.objects.filter(id__in=[org_unit_none_ref.id, org_unit_empty_ref.id, org_unit_with_ref.id])
        )

        # Import the gpkg content to verify the refs
        import io

        import geopandas as gpd

        # Read the gpkg content
        gdf = gpd.read_file(io.BytesIO(gpkg_content))

        # Get the refs for our test org units
        none_ref_row = gdf[gdf["name"] == "None Ref Unit"].iloc[0]
        empty_ref_row = gdf[gdf["name"] == "Empty Ref Unit"].iloc[0]
        with_ref_row = gdf[gdf["name"] == "With Ref Unit"].iloc[0]

        # Verify the refs
        self.assertEqual(none_ref_row["ref"], f"iaso:{org_unit_none_ref.id}")
        self.assertEqual(empty_ref_row["ref"], f"iaso:{org_unit_empty_ref.id}")
        self.assertEqual(with_ref_row["ref"], "test-ref-123")

    def test_export_import_source_ref_edge_cases(self):
        """Test end-to-end export and import of org units with edge cases for source_ref"""
        # Create org units with different source_ref scenarios
        org_unit_none_ref = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_team,
            version=self.sw_version_1,
            name="None Ref Unit",
            source_ref=None,
            code="",
        )

        org_unit_empty_ref = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_team,
            version=self.sw_version_1,
            name="Empty Ref Unit",
            source_ref="",
            code="empty_ref",
        )

        org_unit_with_ref = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_team,
            version=self.sw_version_1,
            name="With Ref Unit",
            source_ref="test-ref-123",
            code="with_ref",
        )

        # Export to gpkg
        gpkg_content = org_units_to_gpkg_bytes(
            m.OrgUnit.objects.filter(id__in=[org_unit_none_ref.id, org_unit_empty_ref.id, org_unit_with_ref.id])
        )

        # Save the gpkg content to a temporary file

        with tempfile.NamedTemporaryFile(suffix=".gpkg", delete=False) as temp_file:
            temp_file.write(gpkg_content)
            temp_file_path = temp_file.name

        try:
            # Create a new version for import
            new_version = m.SourceVersion.objects.create(data_source=self.sw_source, number=3)

            # Import the gpkg file
            # Ensure the DataSource is configured with the project
            self.sw_source.projects.add(self.project)

            import_gpkg_file(
                temp_file_path,
                source_name=self.sw_source.name,
                version_number=3,
                validation_status="new",
                description="Testing source_ref edge cases",
            )

            # Verify the imported org units
            imported_none_ref = m.OrgUnit.objects.get(version=new_version, name="None Ref Unit")
            imported_empty_ref = m.OrgUnit.objects.get(version=new_version, name="Empty Ref Unit")
            imported_with_ref = m.OrgUnit.objects.get(version=new_version, name="With Ref Unit")

            # Verify source_refs
            self.assertEqual(imported_none_ref.source_ref, f"iaso:{org_unit_none_ref.id}")
            self.assertEqual(imported_empty_ref.source_ref, f"iaso:{org_unit_empty_ref.id}")
            self.assertEqual(imported_with_ref.source_ref, "test-ref-123")

        finally:
            # Clean up the temporary file
            os.unlink(temp_file_path)
