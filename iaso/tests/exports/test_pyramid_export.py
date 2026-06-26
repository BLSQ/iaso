import tempfile

from iaso.exports import parquet
from iaso.exports.pyramid import _safe_group_name
from iaso.models import OrgUnit
from iaso.test import TestCase

from .parquet_helper import get_columns_from_parquet


class GroupNameNormalizationTest(TestCase):
    def test_safe_group_name_accents(self):
        self.assertEqual(_safe_group_name("Île-de-France"), "ile_de_france")
        self.assertEqual(_safe_group_name("Santé"), "sante")

    def test_safe_group_name_straight_quote(self):
        self.assertEqual(_safe_group_name("groupe d'Afrique"), "groupe_d_afrique")

    def test_safe_group_name_smart_single_quotes(self):
        # Office/Word curly apostrophes
        self.assertEqual(_safe_group_name("groupe d'Afrique"), "groupe_d_afrique")
        self.assertEqual(_safe_group_name("groupe d'Afrique"), "groupe_d_afrique")

    def test_safe_group_name_smart_double_quotes(self):
        self.assertEqual(_safe_group_name("“Nord”"), "nord")

    def test_safe_group_name_double_quote(self):
        # space + opening quote both become "_", trailing quote is stripped
        self.assertEqual(_safe_group_name('say "hello"'), "say__hello")

    def test_safe_group_name_en_dash(self):
        self.assertEqual(_safe_group_name("Nord–Sud"), "nord_sud")

    def test_safe_group_name_non_breaking_space(self):
        self.assertEqual(_safe_group_name("Nord Sud"), "nord_sud")

    def test_safe_group_name_ellipsis(self):
        self.assertEqual(_safe_group_name("etc…end"), "etc_end")

    def test_safe_group_name_quotes_via_strip_accents(self):
        # smart quote goes through _strip_accents -> becomes "_"
        self.assertEqual(_safe_group_name("groupe d'Afrique"), "groupe_d_afrique")


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
            ["org_unit_groups", "VARCHAR"],
        ]
        self.assertEqual(actual_columns, expected)
