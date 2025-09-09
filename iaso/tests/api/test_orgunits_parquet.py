import tempfile

from pathlib import Path

import duckdb
import pandas as pd

from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Point, Polygon
from django.db import connection
from django.test import TransactionTestCase
from rest_framework.test import APIClient

from iaso import models as m
from iaso.test import IasoTestCaseMixin


class BaseAPITransactionTestCase(TransactionTestCase, IasoTestCaseMixin):
    client_class = APIClient


def parquet_to_df(path):
    con = duckdb.connect()
    return con.execute(f"SELECT * FROM read_parquet('{path}')").fetchdf()


def compare_or_create_snapshot(parquet_path, snapshot_path, stable_columns):
    snapshot_file = Path(snapshot_path)
    df_parquet = parquet_to_df(parquet_path)[stable_columns]

    if not snapshot_file.exists():
        # write snapshot
        if snapshot_file.suffix == ".csv":
            df_parquet.to_csv(snapshot_file, index=False)
        elif snapshot_file.suffix == ".json":
            df_parquet.to_json(snapshot_file, orient="records", lines=True)
        else:
            raise ValueError("Unsupported snapshot format")
        print(f"Snapshot created at {snapshot_file}")
    else:
        # compare
        if snapshot_file.suffix == ".csv":
            df_snapshot = pd.read_csv(snapshot_file)[stable_columns]
        elif snapshot_file.suffix == ".json":
            df_snapshot = pd.read_json(snapshot_file, orient="records", lines=True)[stable_columns]
        else:
            raise ValueError("Unsupported snapshot format")

        # sort rows for deterministic comparison
        df_parquet_sorted = df_parquet.sort_values(stable_columns).reset_index(drop=True)
        df_snapshot_sorted = df_snapshot.sort_values(stable_columns).reset_index(drop=True)

        pd.testing.assert_frame_equal(df_parquet_sorted, df_snapshot_sorted, check_dtype=False)


class OrgUnitAPITestCase(BaseAPITransactionTestCase):
    ORG_UNIT_CREATE_URL = "/api/orgunits/create_org_unit/"

    def setUp(cls):
        cls.star_wars = star_wars = m.Account.objects.create(name="Star Wars")
        marvel = m.Account.objects.create(name="MCU")
        cls.project = project = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=star_wars,
        )
        sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_source.projects.add(project)
        cls.sw_source = sw_source
        cls.sw_version_1 = sw_version_1 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        cls.sw_version_2 = sw_version_2 = m.SourceVersion.objects.create(data_source=sw_source, number=2)
        star_wars.default_version = sw_version_1
        star_wars.save()

        cls.jedi_squad = jedi_squad = m.OrgUnitType.objects.create(name="Jedi Squad", short_name="Jds")
        jedi_squad.projects.add(project)
        jedi_squad.save()
        cls.reference_form = reference_form = m.Form.objects.create(
            name="Reference form", period_type=m.MONTH, single_per_period=True
        )
        cls.not_a_reference_form = not_a_reference_form = m.Form.objects.create(
            name="Not a reference form", period_type=m.MONTH, single_per_period=True
        )
        cls.jedi_council = jedi_council = m.OrgUnitType.objects.create(
            name="Jedi Council",
            short_name="Cnc",
        )
        jedi_council.sub_unit_types.add(jedi_squad)
        cls.jedi_council.reference_forms.add(cls.reference_form)
        cls.jedi_council.save()

        cls.mock_multipolygon = mock_multipolygon = MultiPolygon(
            Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]])
        )
        cls.mock_point = mock_point = Point(x=4, y=50, z=100)
        cls.mock_multipolygon_empty = mock_multipolygon_empty = GEOSGeometry("MULTIPOLYGON EMPTY", srid=4326)

        cls.elite_group = elite_group = m.Group.objects.create(name="Elite councils", source_version=sw_version_1)
        cls.unofficial_group = m.Group.objects.create(name="Unofficial Jedi councils")
        cls.another_group = m.Group.objects.create(name="Another group")

        cls.jedi_council_corruscant = jedi_council_corruscant = m.OrgUnit.objects.create(
            org_unit_type=jedi_council,
            version=sw_version_1,
            name="Corruscant Jedi Council",
            geom=mock_multipolygon,
            catchment=mock_multipolygon,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            code="code1",
        )

        cls.instance_related_to_reference_form = cls.create_form_instance(
            form=reference_form,
            period="202003",
            org_unit=jedi_council_corruscant,
            project=project,
        )

        cls.instance_not_related_to_reference_form = cls.create_form_instance(
            form=not_a_reference_form,
            period="202003",
            org_unit=jedi_council_corruscant,
            project=project,
        )

        jedi_council_corruscant.groups.set([elite_group])

        cls.jedi_council_endor = jedi_council_endor = m.OrgUnit.objects.create(
            org_unit_type=jedi_council,
            version=sw_version_1,
            name="Endor Jedi Council",
            geom=mock_multipolygon_empty,
            simplified_geom=mock_multipolygon_empty,
            catchment=mock_multipolygon_empty,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code="code2",
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

        cls.jedi_squad_endor = m.OrgUnit.objects.create(
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
        )
        cls.jedi_squad_endor_2 = m.OrgUnit.objects.create(
            parent=jedi_council_endor,
            org_unit_type=jedi_squad,
            version=sw_version_1,
            name="Endor Jedi Squad 2",
            geom=mock_multipolygon,
            simplified_geom=mock_multipolygon,
            catchment=mock_multipolygon,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code="code4",
        )

        cls.jedi_council_brussels = m.OrgUnit.objects.create(
            org_unit_type=jedi_council,
            version=sw_version_2,
            name="Brussels Jedi Council",
            geom=mock_multipolygon,
            simplified_geom=mock_multipolygon,
            catchment=mock_multipolygon,
            location=mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            code="code5",
        )

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_org_units"])
        cls.user_read_permission = cls.create_user_with_profile(
            username="user_read_permission",
            account=star_wars,
            permissions=["iaso_org_units_read"],
        )
        cls.luke = cls.create_user_with_profile(
            username="luke",
            account=star_wars,
            permissions=["iaso_org_units"],
            org_units=[jedi_council_endor],
        )
        cls.raccoon = cls.create_user_with_profile(username="raccoon", account=marvel, permissions=["iaso_org_units"])

        cls.form_1 = form_1 = m.Form.objects.create(
            name="Hydroponics study", period_type=m.MONTH, single_per_period=True
        )

        cls.create_form_instance(
            form=form_1,
            period="202001",
            org_unit=jedi_council_corruscant,
            project=project,
        )

        cls.create_form_instance(
            form=form_1,
            period="202001",
            org_unit=jedi_council_corruscant,
            project=project,
        )

        cls.create_form_instance(
            form=form_1,
            period="202003",
            org_unit=jedi_council_corruscant,
            project=project,
        )

    def test_can_retrieve_org_units_list_in_parquet_format(self):
        """It tests the csv org unit export data"""

        self.yoda.username = "yoda"
        self.yoda.last_name = "Da"
        self.yoda.first_name = "Yo"
        self.yoda.save()

        self.jedi_council_brussels.creator = self.yoda
        self.jedi_council_brussels.save()

        self.client.force_authenticate(self.yoda)

        with self.assertNumQueries(2):
            response = self.client.get("/api/orgunits/?order=id&parquet=true")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response["Content-Type"], "application/octet-stream")
            with tempfile.NamedTemporaryFile(suffix=".parquet") as f:
                for chunk in response.streaming_content:
                    f.write(chunk)
                f.flush()
                f.seek(0)

                with duckdb.connect() as connection:
                    con = duckdb.connect()
                    result = con.execute(f"SELECT * FROM read_parquet('{f.name}')")
                    colnames = [d[0] for d in result.description]  # column names
                    tuples = result.fetchall()
                    rows = [dict(zip(colnames, row)) for row in tuples]

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
                        "./iaso/fixtures/snapshots/test_can_retrieve_org_units_list_in_parquet_format.csv",
                        stable_columns,
                    )
