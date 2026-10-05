import json
import tempfile

from unittest import mock

from django.conf import settings

from iaso import models as m
from iaso.tests.api.v3.org_units.base import BASE_URL, OrgUnitV3TestCase
from iaso.tests.utils_parquet import BaseAPITransactionTestCase, parquet_to_df, write_response_to_file


class OrgUnitV3CsvXlsxExportTestCase(OrgUnitV3TestCase):
    def test_csv_columns_follow_the_fields_order(self):
        header, _ = self.get_csv({"fields": "name,id,code"})
        self.assertEqual(header, ["name", "id", "code"])

    def test_csv_exports_every_matching_org_unit_without_pagination(self):
        _, rows = self.get_csv({"fields": "id,name", "page_size": 1})
        self.assertCountEqual(rows, [org_unit.name for org_unit in self.star_wars_org_units])
        self.assertEqual(rows[self.region.name]["id"], str(self.region.id))

    def test_csv_respects_filters(self):
        _, rows = self.get_csv({"fields": "id,name", "ancestor_id": self.country.id})
        self.assertCountEqual(rows, [self.region.name, self.district.name])

    def test_csv_filename(self):
        with mock.patch("iaso.api.v3.org_units.views.strftime", return_value="2026-01-02-03-04"):
            response = self.client.get(BASE_URL, {"format": "csv", "fields": "id"})
        self.assertCsvFileResponse(
            response,
            expected_name=f"{settings.ENVIRONMENT}-{self.star_wars.name}-org_units-2026-01-02-03-04.csv",
            streaming=True,
        )

    def test_xlsx(self):
        response = self.client.get(BASE_URL, {"format": "xlsx", "fields": "id,name,parent(name)"})
        columns, data = self.assertXlsxFileResponse(response)
        self.assertEqual(columns, ["id", "name", "parent.id", "parent.name"])
        rows = {data["name"][i]: {column: data[column][i] for column in columns} for i in data["name"]}
        self.assertCountEqual(rows, [org_unit.name for org_unit in self.star_wars_org_units])
        self.assertEqual(rows[self.region.name]["parent.name"], self.country.name)
        self.assertIsNone(rows[self.country.name]["parent.id"])

    # -- flattening --

    def test_lists_of_values_are_joined(self):
        m.OrgUnit.objects.filter(id=self.cote.id).update(aliases=["CIV", "Ivory Coast"])
        _, rows = self.get_csv({"fields": "name,aliases,group_ids"})
        self.assertEqual(rows[self.cote.name]["aliases"], "CIV;Ivory Coast")
        self.assertEqual(rows[self.region.name]["group_ids"], str(self.elite_group.id))
        self.assertEqual(rows[self.country.name]["aliases"], "")

    def test_geometry_is_written_as_geojson(self):
        _, rows = self.get_csv({"fields": "id,name,geom"})
        self.assertEqual(json.loads(rows[self.country.name]["geom"])["type"], "MultiPolygon")
        self.assertEqual(rows[self.region.name]["geom"], "")  # no geom -> empty cell

    def test_ancestors_are_spread_over_indexed_columns_root_first(self):
        header, rows = self.get_csv({"fields": "id,name,ancestors(id,name,validation_status)"})
        self.assertEqual(
            header,
            [
                "id",
                "name",
                "ancestors[0].id",
                "ancestors[0].name",
                "ancestors[0].validation_status",
                "ancestors[1].id",
                "ancestors[1].name",
                "ancestors[1].validation_status",
            ],
        )
        district = rows[self.district.name]
        self.assertEqual(district["ancestors[0].name"], self.country.name)
        self.assertEqual(district["ancestors[1].name"], self.region.name)
        region = rows[self.region.name]
        self.assertEqual(region["ancestors[0].id"], str(self.country.id))
        self.assertEqual(region["ancestors[1].id"], "")  # shallower than the deepest row -> empty cells

    def test_ancestor_columns_are_sized_on_the_filtered_rows(self):
        header, rows = self.get_csv({"fields": "name,depth,ancestors(name),simplified_geom", "depth": 2})
        self.assertEqual(header, ["name", "depth", "ancestors[0].id", "ancestors[0].name", "simplified_geom"])
        self.assertEqual(rows[self.region.name]["ancestors[0].name"], self.country.name)
        self.assertEqual(rows[self.region.name]["depth"], "2")

    def test_groups_get_one_column_set_per_distinct_group(self):
        # an unordered membership set, not a positional list like `ancestors`: "the first group" wouldn't mean
        # the same group from one row to the next, so the columns are keyed by group id
        header, rows = self.get_csv({"fields": "id,name,groups"})
        group = f"group-{self.elite_group.id}"
        self.assertEqual(header, ["id", "name", f"{group}.id", f"{group}.name"])
        self.assertEqual(rows[self.region.name][f"{group}.id"], str(self.elite_group.id))
        self.assertEqual(rows[self.region.name][f"{group}.name"], self.elite_group.name)
        self.assertEqual(rows[self.country.name][f"{group}.id"], "")  # not a member -> empty cells, not no row

    def test_nested_objects_become_dotted_columns(self):
        header, rows = self.get_csv({"fields": "id,name,org_unit_type,parent,creator"})
        self.assertEqual(
            header,
            [
                "id",
                "name",
                "org_unit_type.id",
                "org_unit_type.name",
                "org_unit_type.short_name",
                "org_unit_type.category",
                "parent.id",
                "parent.name",
                "parent.source_ref",
                "parent.org_unit_type_id",
                "creator.id",
                "creator.username",
                "creator.first_name",
                "creator.last_name",
                "creator.email",
            ],
        )
        region = rows[self.region.name]
        self.assertEqual(region["org_unit_type.id"], str(self.region_type.id))
        self.assertEqual(region["org_unit_type.short_name"], self.region_type.short_name)
        self.assertEqual(region["parent.name"], self.country.name)
        self.assertEqual(region["parent.source_ref"], self.country.source_ref)
        self.assertEqual(region["creator.username"], self.user.username)
        self.assertEqual(region["creator.email"], self.user.email)
        country = rows[self.country.name]
        self.assertEqual((country["parent.id"], country["creator.id"]), ("", ""))  # root, no recorded creator

    def test_sub_selector_narrows_the_columns(self):
        header, _ = self.get_csv({"fields": "id,name,parent(name)"})
        self.assertEqual(header, ["id", "name", "parent.id", "parent.name"])

    def test_version_with_data_source_adds_nested_columns(self):
        header, rows = self.get_csv({"fields": "id,name,version(id,number,data_source)"})
        self.assertEqual(
            header,
            ["id", "name", "version.id", "version.number", "version.data_source.id", "version.data_source.name"],
        )
        region = rows[self.region.name]
        self.assertEqual(region["version.id"], str(self.sw_version_1.id))
        self.assertEqual(region["version.number"], str(self.sw_version_1.number))
        self.assertEqual(region["version.data_source.name"], self.sw_source.name)

    # -- errors --

    def test_errors_are_json_whatever_the_export_format(self):
        for export_format in ("csv", "xlsx", "parquet"):
            with self.subTest(format=export_format):
                data = self.get_error({"format": export_format, "fields": "nope"})
                self.assertEqual(data["error"], "Unknown field(s) in fields=: nope")

    def test_unauthenticated_export_is_a_json_401(self):
        self.client.force_authenticate(None)
        self.get_error({"format": "csv"}, status_code=401)


class OrgUnitV3ParquetErrorsTestCase(OrgUnitV3TestCase):
    """Errors raised before anything reaches DuckDB - no committed data needed."""

    def test_unknown_extra_fields(self):
        data = self.get_error({"format": "parquet", "extra_fields": "geom_geojson,nope"})
        self.assertEqual(data["error"], "Unknown extra_fields for parquet exports: nope")

    def test_group_column_collision_does_not_echo_the_exception(self):
        colliding_group = m.Group.objects.create(name="elite councils!", source_version=self.sw_version_1)
        self.region.groups.add(colliding_group)
        # `iaso/tests/__init__.py` disables logging for the whole test run, hence a mock rather than `assertLogs`
        with mock.patch("iaso.api.v3.org_units.views.logger") as logger:
            data = self.get_error({"format": "parquet", "extra_fields": "groups_exploded_code"})
        logger.exception.assert_called_once()
        self.assertEqual(data["error"], "Conflicting group column names for extra_fields=groups_exploded_code")
        # the group names from the underlying `ValueError` stay in the log, not in the response
        self.assertNotIn(self.elite_group.name, json.dumps(data))


class OrgUnitV3ParquetExportTestCase(BaseAPITransactionTestCase):
    """`format=parquet` is written by DuckDB over its own connection, so the org units must be committed."""

    def setUp(self):
        account = m.Account.objects.create(name="Star Wars")
        project = m.Project.objects.create(name="Hydroponic gardens", app_id="stars.hydroponics", account=account)
        source = m.DataSource.objects.create(name="Evil Empire")
        source.projects.add(project)
        version = m.SourceVersion.objects.create(data_source=source, number=1)
        country_type = m.OrgUnitType.objects.create(name="Country", short_name="Cnt")
        country_type.projects.add(project)
        self.country = m.OrgUnit.objects.create(org_unit_type=country_type, version=version, name="Naboo")
        self.region = m.OrgUnit.objects.create(
            org_unit_type=country_type, version=version, name="Theed", parent=self.country
        )

        other_account = m.Account.objects.create(name="MCU")
        other_project = m.Project.objects.create(name="Wakanda outreach", app_id="marvel.app", account=other_account)
        other_source = m.DataSource.objects.create(name="Wakandan registry")
        other_source.projects.add(other_project)
        other_version = m.SourceVersion.objects.create(data_source=other_source, number=1)
        m.OrgUnit.objects.create(version=other_version, name="Wakanda")

        self.client.force_authenticate(self.create_user_with_profile(username="padme", account=account))

    def export(self, params):
        response = self.client.get(BASE_URL, {"format": "parquet", **params})
        self.assertEqual(response.status_code, 200)
        self.assert_parquet_content_type(response)
        with tempfile.NamedTemporaryFile(suffix=".parquet") as f:
            write_response_to_file(response, f)
            return parquet_to_df(f.name)

    def test_exports_the_users_org_units_only(self):
        df = self.export({})
        self.assertCountEqual(df["org_unit_name"], [self.country.name, self.region.name])
        self.assertCountEqual(df["org_unit_id"].astype(int), [self.country.id, self.region.id])

    def test_respects_filters(self):
        df = self.export({"ancestor_id": self.country.id})
        self.assertEqual(list(df["org_unit_name"]), [self.region.name])
