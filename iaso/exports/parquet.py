import os
import time

import duckdb

from django.contrib.postgres.fields import JSONField
from django.db import connection, models
from django.db.models import F, FloatField, Func, IntegerField, Max
from django.db.models.expressions import RawSQL
from django.db.models.fields.json import KeyTextTransform
from django.db.models.functions import Cast

import iaso.models as m


class ST_X(Func):
    function = "ST_X"
    output_field = models.FloatField()


class ST_Y(Func):
    function = "ST_Y"
    output_field = models.FloatField()


class ST_Z(Func):
    function = "ST_Z"
    output_field = models.FloatField()


# make field name less "django" by replacing __ with _ for ex
def normalize_field_name(field_name):
    return field_name.replace("__", "_")


def export_django_query_to_parquet_via_duckdb(qs, output_file_path):
    start = time.perf_counter()

    sql, params = qs.query.sql_with_params()
    full_sql = sql % tuple(map(repr, params))
    dsn = connection.get_connection_params()

    con = duckdb.connect()
    attach_sql = f"""
        INSTALL postgres;
        LOAD postgres;
        ATTACH 'dbname={dsn["dbname"]} host={dsn["host"]} user={dsn["user"]} password={dsn["password"]}' AS pg (TYPE postgres, READ_ONLY);

    """
    con.execute(attach_sql)

    print(f"exporting parquet : {output_file_path} \n\n {full_sql}")
    parquet_export_sql = f"""
        COPY (
            SELECT * FROM postgres_query('pg', $$ {full_sql} $$)
        ) TO '{output_file_path}' (FORMAT PARQUET)
    """

    con.execute(parquet_export_sql)

    row_count = con.execute(f"SELECT COUNT(*) FROM '{output_file_path}'").fetchone()[0]
    col_count = len(con.execute(f"DESCRIBE SELECT * FROM '{output_file_path}'").fetchall())
    con.close()
    duration = time.perf_counter() - start
    size_mb = os.path.getsize(output_file_path) / (1024 * 1024)
    print(
        f"dumped to {output_file_path} took {duration:.3f} seconds for {row_count} records and {col_count} columns, final file size {size_mb:.2f} Mb"
    )


def build_submissions_queryset(qs, form_id):
    form = m.Form.objects.get(pk=form_id)
    if form.possible_fields == None or len(form.possible_fields) == 0:
        form.update_possible_fields()

    qs = qs.filter(form_id=form_id)

    possible_fields = form.possible_fields

    json_annotations = {}
    for field in possible_fields:
        field_name = field["name"]
        json_annotations[field_name] = KeyTextTransform(field_name, "json")

    model_fields = [
        "id",
        "form_id",
        "period",
        "uuid",
        "org_unit_id",
        "org_unit__name",
        "org_unit__source_ref",
        "entity_id",
        "created_at",
        "source_created_at",
        "created_by__username",
        "created_by_id",
        "updated_at",
        "source_updated_at",
        "last_modified_by__username",
        "last_modified_by_id",
        "deleted",
        "export_id",
    ]
    model_prefix = "submission_"

    # accuracy, attributes, correlation_id, created_by, created_by_id,
    # device, device_id, entity, export_id, exportstatus, file, file_name, form,
    # form_version, form_version_id, instancefile, instancelock, json,
    # last_export_success_at, last_modified_by, last_modified_by_id,
    # location, name,
    # org_unit, orgunit, orgunitchangerequest, orgunitreferenceinstance,
    # planning, planning_id, project, project_id,
    # storage_log_entries, to_export

    # Status,
    # Entité,

    prefixed_fields = {f"{model_prefix}{normalize_field_name(f)}": F(f) for f in model_fields}

    # less standard fields that needs some functions
    prefixed_fields[f"{model_prefix}form_version_id"] = KeyTextTransform("_version", "json")
    prefixed_fields[f"{model_prefix}longitude"] = ST_X(F("location"))
    prefixed_fields[f"{model_prefix}latitude"] = ST_Y(F("location"))
    prefixed_fields[f"{model_prefix}altitude"] = ST_Z(F("location"))
    prefixed_fields[f"{model_prefix}accuracy"] = F("accuracy")

    qs = (
        qs.values("id")
        .annotate(**prefixed_fields)
        .annotate(**json_annotations)
        .values(*prefixed_fields.keys(), *json_annotations.keys())
    )

    return qs


def build_pyramid_queryset(qs):
    ancestor_fields = ["id", "name", "source_ref", "closed_date", "validation_status"]
    org_unit_fields = [
        "id",
        "name",
        "source_ref",
        "code",
        "created_at",
        "source_created_at",
        "creator__username",
        "creator_id",
        "updated_at",  # no updated_by ?
        "opening_date",
        "closed_date",
        "validation_status",
        "version_id",  # source_version_id would be a better name
        "path",
    ]
    # aliases, assignment, campaigns, campaigns_country, catchment,
    # closed_date, code, countryusersgroup, created_at, creator, creator_id,
    # custom, default_image, default_image_id, destination_set, extra_fields,
    # geom, geom_ref, gps_source, groups, iaso_profile, id, instance, instance_lock,
    # jsondatastore, location, name, opening_date, org_unit_change_parents_set,
    # orgunit, orgunitchangerequest,
    #  orgunitreferenceinstance, parent, parent_id, path, planning, polio_notifications,
    # record, reference_instances, simplified_geom, source_created_at, source_ref,
    # source_set, storagedevice, storagelogentry, sub_source, updated_at, uuid, vaccine_stocks,
    # vaccineauthorization, validated, validation_status, version, version_id

    max_ancestor_level = qs.aggregate(max_level=Max(RawSQL("array_length(string_to_array(path::text, '.'), 1)", [])))[
        "max_level"
    ]

    level_annotations = {}

    for level in range(max_ancestor_level):
        index = level  # 0-based index
        for field in ancestor_fields:
            field_alias = f"level_{level + 1}_{field}"
            sql = f"""
                (SELECT {field}
                FROM iaso_orgunit a
                WHERE a.id = (string_to_array(iaso_orgunit.path::text, '.')::int[])[{index + 1}]
                LIMIT 1)
            """
            level_annotations[field_alias] = RawSQL(sql, [])

    # sad to not be aligned with submission : created_by__username, created_by_id
    # so adding aliases
    aliases = {"creator__username": "created_by__username", "creator_id": "created_by_id"}

    model_prefix = "org_unit_"
    org_unit_annotations = {}
    for f in org_unit_fields:
        # avoid prefixing already prefix field like org_unit_type
        field = aliases.get(f) or f
        field = normalize_field_name(field)
        key = f if f.startswith(model_prefix) else normalize_field_name(f"{model_prefix}{field}")
        org_unit_annotations[key] = F(f)

    level_annotation = RawSQL(
        "array_length(string_to_array(path::text, '.'), 1)",
        (),
        output_field=IntegerField(),
    )
    geojson_annotations = {
        f"{model_prefix}geom_geojson": Cast(Func(F("geom"), function="ST_AsGeoJSON"), output_field=JSONField()),
        f"{model_prefix}location_geojson": Cast(Func(F("location"), function="ST_AsGeoJSON"), output_field=JSONField()),
        f"{model_prefix}simplified_geom_geojson": Cast(
            Func(F("simplified_geom"), function="ST_AsGeoJSON"), output_field=JSONField()
        ),
        f"{model_prefix}longitude": Func(
            F("location"),
            function="ST_X",
            template="ST_X((%(expressions)s)::geometry)",
            output_field=FloatField(),
        ),
        f"{model_prefix}latitude": Func(
            F("location"),
            function="ST_Y",
            template="ST_Y((%(expressions)s)::geometry)",
            output_field=FloatField(),
        ),
        f"{model_prefix}altitude": Func(
            F("location"),
            function="ST_Z",
            template="ST_Z((%(expressions)s)::geometry)",
            output_field=FloatField(),
        ),
        f"{model_prefix}biggest_polygon_geojson": RawSQL(
            """
        CASE
          WHEN geom IS NULL THEN NULL
          ELSE (
            SELECT ST_AsGeoJSON((dp).geom)::json
            FROM ST_Dump(geom::geometry) AS dp
            ORDER BY ST_Area((dp).geom) DESC
            LIMIT 1
          )
        END
        """,
            [],  # no parameters
            output_field=JSONField(),
        ),
    }
    # ideally since it will be used for superset, add a column with the biggest polygon to ease visualisation
    # currently superset only support polygon, not multi polygons

    all_keys = [
        *org_unit_annotations.keys(),
        *["org_unit_level", "org_unit_type_id", "org_unit_type_name"],
        *level_annotations.keys(),
        *geojson_annotations.keys(),
    ]
    all_keys.sort()

    for k in all_keys:
        print(k)

    return (
        qs.values("id")
        .annotate(**org_unit_annotations)
        .annotate(org_unit_type_name=F("org_unit_type__name"))
        .annotate(org_unit_level=level_annotation)
        .annotate(**level_annotations)
        .annotate(**geojson_annotations)
        .values(*all_keys)
    )
