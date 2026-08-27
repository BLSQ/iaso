import tempfile

from iaso.exports import parquet
from iaso.exports.pyramid import _safe_group_name, build_group_annotations
from iaso.models import DataSource, Group, OrgUnit, SourceVersion
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


class GroupsExplodedCollisionTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        source = DataSource.objects.create(name="Test source")
        version = SourceVersion.objects.create(data_source=source, number=1)
        cls.org_unit = OrgUnit.objects.create(name="Test OU", version=version)
        cls.group_sante = Group.objects.create(name="Santé", source_version=version)
        cls.group_sante_plain = Group.objects.create(name="Sante", source_version=version)
        cls.org_unit.groups.add(cls.group_sante, cls.group_sante_plain)

    def test_groups_exploded_code_raises_on_collision(self):
        qs = OrgUnit.objects.filter(pk=self.org_unit.pk)
        with self.assertRaises(ValueError) as ctx:
            build_group_annotations(qs, ["groups_exploded_code"])
        self.assertIn("sante", str(ctx.exception))

    def test_groups_exploded_no_collision_because_of_id(self):
        qs = OrgUnit.objects.filter(pk=self.org_unit.pk)
        # Should not raise — column names include the group id
        annotations = build_group_annotations(qs, ["groups_exploded"])
        expected_keys = {
            f"group_{self.group_sante.id}_sante",
            f"group_{self.group_sante_plain.id}_sante",
        }
        self.assertEqual(set(annotations.keys()), expected_keys)


class GroupsJsonTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        source = DataSource.objects.create(name="Test source")
        version = SourceVersion.objects.create(data_source=source, number=1)
        cls.ou_no_groups = OrgUnit.objects.create(name="No groups", version=version)
        cls.ou_with_groups = OrgUnit.objects.create(name="With groups", version=version)
        cls.group_a = Group.objects.create(name="Alpha", source_version=version)
        cls.group_b = Group.objects.create(name="Beta", source_version=version)
        cls.ou_with_groups.groups.add(cls.group_a, cls.group_b)

    def _annotated(self, ou):
        annotations = build_group_annotations(OrgUnit.objects.filter(pk=ou.pk), ["groups_json"])
        return OrgUnit.objects.filter(pk=ou.pk).annotate(**annotations).get()

    def test_no_groups_returns_empty_list(self):
        ou = self._annotated(self.ou_no_groups)
        self.assertEqual(ou.org_unit_groups, [])

    def test_with_groups_returns_sorted_list(self):
        ou = self._annotated(self.ou_with_groups)
        expected = sorted(
            [{"id": self.group_a.id, "name": "Alpha"}, {"id": self.group_b.id, "name": "Beta"}],
            key=lambda g: g["id"],
        )
        self.assertEqual(ou.org_unit_groups, expected)


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
