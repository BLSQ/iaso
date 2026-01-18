import tempfile

from iaso.exports import parquet
from iaso.models import OrgUnit
from iaso.test import TestCase

from .parquet_helper import get_columns_from_parquet


class PyramidExportTest(TestCase):
    def test_expected_columns_all_fields_even_if_no_records(self):
        qs = parquet.build_pyramid_queryset(OrgUnit.objects, extra_fields=[":all"])
        self.maxDiff = None
        with tempfile.NamedTemporaryFile(suffix=".parquet") as tmpfile:
            parquet.export_django_query_to_parquet_via_duckdb(qs, tmpfile.name)
            actual_columns = get_columns_from_parquet(tmpfile)

        expected = [
            ["org_unit_id", "INTEGER"],
            ["org_unit_name", "VARCHAR"],
            ["org_unit_source_ref", "VARCHAR"],
            ["org_unit_code", "VARCHAR"],
            ["org_unit_created_at", "TIMESTAMP WITH TIME ZONE"],
            ["org_unit_source_created_at", "TIMESTAMP WITH TIME ZONE"],
            ["org_unit_created_by_username", "VARCHAR"],
            ["org_unit_created_by_id", "INTEGER"],
            ["org_unit_updated_at", "TIMESTAMP WITH TIME ZONE"],
            ["org_unit_opening_date", "DATE"],
            ["org_unit_closed_date", "DATE"],
            ["org_unit_validation_status", "VARCHAR"],
            ["org_unit_version_id", "INTEGER"],
            ["org_unit_path", "VARCHAR"],
            ["org_unit_type_id", "INTEGER"],
            ["org_unit_type_name", "VARCHAR"],
            ["org_unit_parent_id", "INTEGER"],
            ["org_unit_level", "INTEGER"],
            ["org_unit_longitude", "DOUBLE"],
            ["org_unit_latitude", "DOUBLE"],
            ["org_unit_altitude", "DOUBLE"],
            ["org_unit_geom_geojson", "VARCHAR"],
            ["org_unit_location_geojson", "VARCHAR"],
            ["org_unit_simplified_geom_geojson", "VARCHAR"],
            ["org_unit_biggest_polygon_geojson", "VARCHAR"],
        ]
        self.assertEqual(actual_columns, expected)
