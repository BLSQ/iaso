import json
import tempfile

from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Point, Polygon
from django.db import connection
from rest_framework import status

from iaso import models as m
from iaso.permissions.core_permissions import CORE_ORG_UNITS_PERMISSION, CORE_ORG_UNITS_READ_PERMISSION
from iaso.tests.utils_parquet import (
    BaseAPITransactionTestCase,
    compare_or_create_snapshot,
    read_parquet,
    write_response_to_file,
)


# use BaseAPITransactionTestCase to make records are visible to duckdb (committed)


class OrgUnitAPITestCase(BaseAPITransactionTestCase):
    def setUp(self):
        self.star_wars = star_wars = m.Account.objects.create(name="Star Wars")
        marvel = m.Account.objects.create(name="MCU")
        self.project = project = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=star_wars,
        )
        sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_source.projects.add(project)
        self.sw_source = sw_source
        self.sw_version_1 = sw_version_1 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        self.sw_version_2 = sw_version_2 = m.SourceVersion.objects.create(data_source=sw_source, number=2)
        star_wars.default_version = sw_version_1
        star_wars.save()

        self.jedi_squad = jedi_squad = m.OrgUnitType.objects.create(name="Jedi Squad", short_name="Jds")
        jedi_squad.projects.add(project)
        jedi_squad.save()
        self.reference_form = reference_form = m.Form.objects.create(
            name="Reference form", period_type=m.MONTH, single_per_period=True
        )
        self.not_a_reference_form = not_a_reference_form = m.Form.objects.create(
            name="Not a reference form", period_type=m.MONTH, single_per_period=True
        )
        self.jedi_council = jedi_council = m.OrgUnitType.objects.create(
            name="Jedi Council",
            short_name="Cnc",
        )
        jedi_council.sub_unit_types.add(jedi_squad)
        self.jedi_council.reference_forms.add(self.reference_form)
        self.jedi_council.save()

        self.mock_multipolygon = mock_multipolygon = MultiPolygon(
            Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]])
        )
        self.mock_point = mock_point = Point(x=4, y=50, z=100)
        self.mock_multipolygon_empty = mock_multipolygon_empty = GEOSGeometry("MULTIPOLYGON EMPTY", srid=4326)

        self.elite_group = elite_group = m.Group.objects.create(name="Elite councils", source_version=sw_version_1)
        self.unofficial_group = m.Group.objects.create(name="Unofficial Jedi councils")
        self.another_group = m.Group.objects.create(name="Another group")

        self.jedi_council_corruscant = jedi_council_corruscant = m.OrgUnit.objects.create(
            org_unit_type=jedi_council,
            version=sw_version_1,
            name="Corruscant Jedi Council",
            geom=mock_multipolygon,
            catchment=mock_multipolygon,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            opening_date="2025-12-12",
            code="code1",
        )

        self.instance_related_to_reference_form = self.create_form_instance(
            form=reference_form,
            period="202003",
            org_unit=jedi_council_corruscant,
            project=project,
        )

        self.instance_not_related_to_reference_form = self.create_form_instance(
            form=not_a_reference_form,
            period="202003",
            org_unit=jedi_council_corruscant,
            project=project,
        )

        jedi_council_corruscant.groups.set([elite_group])

        self.jedi_council_endor = jedi_council_endor = m.OrgUnit.objects.create(
            org_unit_type=jedi_council,
            version=sw_version_1,
            name="Endor Jedi Council",
            geom=mock_multipolygon_empty,
            simplified_geom=mock_multipolygon_empty,
            catchment=mock_multipolygon_empty,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code="code2",
            opening_date="2025-01-01",
        )

        # I am really sorry to have to rely on this ugly hack to set the location field to an empty point, but
        # unfortunately GEOS doesn't seem to support empty 3D geometries yet:
        # see: https://trac.osgeo.org/geos/ticket/1129, https://trac.osgeo.org/geos/ticket/1005 and
        # https://code.djangoproject.com/ticket/33787 for example
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE iaso_orgunit SET location=ST_GeomFromText('POINT Z EMPTY') WHERE id = %s",
                [jedi_council_endor.pk],
            )

        self.jedi_squad_endor = m.OrgUnit.objects.create(
            parent=jedi_council_endor,
            org_unit_type=jedi_squad,
            version=sw_version_1,
            name="Endor Jedi Squad 1",
            geom=mock_multipolygon,
            catchment=mock_multipolygon,
            location=mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="F9w3VW1cQmb",
            code="code3",
            opening_date="2025-03-03",
        )
        self.jedi_squad_endor_2 = m.OrgUnit.objects.create(
            parent=jedi_council_endor,
            org_unit_type=jedi_squad,
            version=sw_version_1,
            name="Endor Jedi Squad 2",
            geom=mock_multipolygon,
            simplified_geom=mock_multipolygon,
            catchment=mock_multipolygon,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code="code4",
            opening_date="2025-04-04",
        )

        self.jedi_council_brussels = m.OrgUnit.objects.create(
            org_unit_type=jedi_council,
            version=sw_version_2,
            name="Brussels Jedi Council",
            geom=mock_multipolygon,
            simplified_geom=mock_multipolygon,
            catchment=mock_multipolygon,
            location=mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code="code5",
            opening_date="2025-05-05",
        )

        self.yoda = self.create_user_with_profile(
            username="yoda", account=star_wars, permissions=[CORE_ORG_UNITS_PERMISSION]
        )
        self.user_read_permission = self.create_user_with_profile(
            username="user_read_permission",
            account=star_wars,
            permissions=[CORE_ORG_UNITS_READ_PERMISSION],
        )
        self.luke = self.create_user_with_profile(
            username="luke",
            account=star_wars,
            permissions=[CORE_ORG_UNITS_PERMISSION],
            org_units=[jedi_council_endor],
        )
        self.raccoon = self.create_user_with_profile(
            username="raccoon", account=marvel, permissions=[CORE_ORG_UNITS_PERMISSION]
        )

        self.form_1 = form_1 = m.Form.objects.create(
            name="Hydroponics study", period_type=m.MONTH, single_per_period=True
        )

        self.create_form_instance(
            form=form_1,
            period="202001",
            org_unit=jedi_council_corruscant,
            project=project,
        )

        self.create_form_instance(
            form=form_1,
            period="202001",
            org_unit=jedi_council_corruscant,
            project=project,
        )

        self.create_form_instance(
            form=form_1,
            period="202003",
            org_unit=jedi_council_corruscant,
            project=project,
        )

        self.yoda.username = "yoda"
        self.yoda.last_name = "Da"
        self.yoda.first_name = "Yo"
        self.yoda.save()

        self.jedi_council_brussels.creator = self.yoda
        self.jedi_council_brussels.save()

    def test_can_retrieve_org_units_list_in_parquet_format(self):
        """It tests the parquet org unit export data"""

        self.client.force_authenticate(self.yoda)

        with self.assertNumQueries(3):
            response = self.client.get("/api/orgunits/?order=id&parquet=true")

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assert_parquet_content_type(response)

            with tempfile.NamedTemporaryFile(suffix=".parquet") as f:
                write_response_to_file(response, f)

                stable_columns = [
                    "org_unit_name",
                    "org_unit_source_ref",
                    "org_unit_code",
                    "org_unit_created_by_username",
                    "org_unit_opening_date",
                    "org_unit_closed_date",
                    "org_unit_validation_status",
                    "org_unit_type_name",
                    "org_unit_level",
                    "level_1_name",
                    "level_1_source_ref",
                    "level_1_closed_date",
                    "level_1_validation_status",
                    "level_2_name",
                    "level_2_source_ref",
                    "level_2_closed_date",
                    "level_2_validation_status",
                    "org_unit_longitude",
                    "org_unit_latitude",
                    "org_unit_altitude",
                ]

                compare_or_create_snapshot(
                    f.name,
                    "./iaso/tests/fixtures/snapshots/test_can_retrieve_org_units_list_in_parquet_format.csv",
                    stable_columns,
                )

    def test_can_retrieve_org_units_list_in_parquet_format_extra_fields(self):
        """It tests the parquet org unit export data + extra_fields geojson"""

        self.client.force_authenticate(self.yoda)

        with self.assertNumQueries(4):  # +1 for the groups_exploded pre-query included in :all
            response = self.client.get("/api/orgunits/?order=id&parquet=true&extra_fields=:all")

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assert_parquet_content_type(response)

            with tempfile.NamedTemporaryFile(suffix=".parquet") as f:
                write_response_to_file(response, f)
                stable_columns = [
                    "org_unit_name",
                    "org_unit_source_ref",
                    "org_unit_code",
                    "org_unit_created_by_username",
                    "org_unit_opening_date",
                    "org_unit_closed_date",
                    "org_unit_validation_status",
                    "org_unit_type_name",
                    "org_unit_level",
                    "level_1_name",
                    "level_1_source_ref",
                    "level_1_closed_date",
                    "level_1_validation_status",
                    "level_2_name",
                    "level_2_source_ref",
                    "level_2_closed_date",
                    "level_2_validation_status",
                    "org_unit_longitude",
                    "org_unit_latitude",
                    "org_unit_altitude",
                    "org_unit_geom_geojson",
                    "org_unit_location_geojson",
                    "org_unit_simplified_geom_geojson",
                    "org_unit_biggest_polygon_geojson",
                ]

                compare_or_create_snapshot(
                    f.name,
                    "./iaso/tests/fixtures/snapshots/test_can_retrieve_org_units_list_in_parquet_format_extra_fields.csv",
                    stable_columns,
                )

    def test_can_retrieve_org_units_with_groups_exploded(self):
        """groups_exploded adds one binary column per group that has any org unit in the selection"""
        self.client.force_authenticate(self.yoda)

        response = self.client.get("/api/orgunits/?order=id&parquet=true&extra_fields=groups_exploded")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assert_parquet_content_type(response)

        with tempfile.NamedTemporaryFile(suffix=".parquet") as f:
            write_response_to_file(response, f)
            rows = read_parquet(f)

        # Only elite_group is linked to an org unit -- id + normalized name
        expected_col = f"group_{self.elite_group.id}_elite_councils"
        self.assertIn(expected_col, rows[0].keys())
        # unofficial_group and another_group have no linked org units → no column
        self.assertNotIn(f"group_{self.unofficial_group.id}_unofficial_jedi_councils", rows[0].keys())
        self.assertNotIn(f"group_{self.another_group.id}_another_group", rows[0].keys())

        corruscant_row = next(r for r in rows if r["org_unit_name"] == "Corruscant Jedi Council")
        self.assertEqual(corruscant_row[expected_col], 1)

        endor_row = next(r for r in rows if r["org_unit_name"] == "Endor Jedi Council")
        self.assertEqual(endor_row[expected_col], 0)

    def test_can_retrieve_org_units_with_groups_json(self):
        """groups_json adds a single JSON column listing all groups per org unit"""
        self.client.force_authenticate(self.yoda)

        response = self.client.get("/api/orgunits/?order=id&parquet=true&extra_fields=groups_json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assert_parquet_content_type(response)

        with tempfile.NamedTemporaryFile(suffix=".parquet") as f:
            write_response_to_file(response, f)
            rows = read_parquet(f)

        self.assertIn("org_unit_groups", rows[0].keys())

        corruscant_row = next(r for r in rows if r["org_unit_name"] == "Corruscant Jedi Council")
        groups = json.loads(corruscant_row["org_unit_groups"])
        self.assertEqual(groups, [{"id": self.elite_group.id, "name": "Elite councils"}])

        endor_row = next(r for r in rows if r["org_unit_name"] == "Endor Jedi Council")
        self.assertEqual(json.loads(endor_row["org_unit_groups"]), [])

    def test_can_retrieve_org_units_with_groups_exploded_code(self):
        """groups_exploded_code uses accent-stripped normalized names — columns are safe SQL identifiers"""
        self.client.force_authenticate(self.yoda)

        # Create a group whose name has an accent and a hyphen to exercise normalization
        accented_group = m.Group.objects.create(name="Île-de-France", source_version=self.sw_version_1)
        accented_group.org_units.add(self.jedi_council_corruscant)

        response = self.client.get("/api/orgunits/?order=id&parquet=true&extra_fields=groups_exploded_code")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assert_parquet_content_type(response)

        with tempfile.NamedTemporaryFile(suffix=".parquet") as f:
            write_response_to_file(response, f)
            rows = read_parquet(f)

        # groups_exploded_code: no id in column name, just normalized name
        elite_col = "group_elite_councils"
        accented_col = "group_ile_de_france"

        self.assertIn(elite_col, rows[0].keys())
        self.assertIn(accented_col, rows[0].keys())

        corruscant_row = next(r for r in rows if r["org_unit_name"] == "Corruscant Jedi Council")
        self.assertEqual(corruscant_row[elite_col], 1)
        self.assertEqual(corruscant_row[accented_col], 1)

        endor_row = next(r for r in rows if r["org_unit_name"] == "Endor Jedi Council")
        self.assertEqual(endor_row[elite_col], 0)
        self.assertEqual(endor_row[accented_col], 0)

    def test_bad_request_parquet_validates_unknown_extra_fields(self):
        response = self.client.get("/api/orgunits/?order=id&parquet=true&extra_fields=bad_param")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(
            response.json(),
            {
                "error": "Unknown extra_fields for parquet exports: bad_param, only supported geom_geojson, location_geojson, simplified_geom_geojson, biggest_polygon_geojson, groups_exploded, groups_exploded_code, groups_json, :all."
            },
        )

    def test_bad_request_parquet_validates_unknown_query_param(self):
        response = self.client.get("/api/orgunits/?order=id&parquet=true&unknown_unsupported_filter=bad_param")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(
            response.json(),
            {
                "error": "Unsupported query parameters for parquet exports: unknown_unsupported_filter. Allowed parameters extra_fields, order, parquet, searches"
            },
        )

    def test_groups_exploded_code_collision_returns_400(self):
        """When two group names normalize to the same safe identifier, the API returns 400."""
        self.client.force_authenticate(self.yoda)

        collision_group = m.Group.objects.create(name="Élite councils", source_version=self.sw_version_1)
        collision_group.org_units.add(self.jedi_council_corruscant)

        response = self.client.get("/api/orgunits/?order=id&parquet=true&extra_fields=groups_exploded_code")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        error = response.json()["error"]
        self.assertIn("elite_councils", error)
        self.assertIn("normalize to", error)
        self.assertIn("Use groups_exploded instead to avoid column collisions", error)
