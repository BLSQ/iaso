import os
import time

from logging import getLogger
from typing import Sequence

import duckdb

from django.contrib.postgres.fields import JSONField
from django.db import connection, models
from django.db.models import Exists, F, FloatField, Func, IntegerField, Max, OuterRef, QuerySet
from django.db.models.expressions import RawSQL
from django.db.models.fields.json import KeyTextTransform
from django.db.models.functions import Cast

import iaso.models as m


logger = getLogger(__name__)

ALL_OPTIONAL_ORG_UNIT_FIELDS = [
    "geom_geojson",
    "location_geojson",
    "simplified_geom_geojson",
    "biggest_polygon_geojson",
]


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
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")  # ensure cursor is open
        full_sql = cursor.mogrify(sql, params).decode()
    # initially was full_sql = sql % tuple(map(adapt_param, params)) but supporting all types is complicated
    dsn = connection.get_connection_params()

    con = duckdb.connect()
    attach_sql = f"""
        INSTALL postgres;
        LOAD postgres;
        ATTACH 'dbname={dsn["dbname"]} host={dsn["host"]} user={dsn["user"]} password={dsn["password"]}' AS pg (TYPE postgres, READ_ONLY);

    """
    con.execute(attach_sql)

    logger.info(f"exporting parquet : {output_file_path} \n\n {full_sql}")
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
    logger.warn(
        f"dumped to {output_file_path} took {duration:.3f} seconds for {row_count} records and {col_count} columns, final file size {size_mb:.2f} Mb"
    )


def build_submission_annotations():
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
        "correlation_id",
    ]
    model_prefix = "iaso_subm_"

    # TODO is ref submission

    # accuracy, attributes,
    # device, device_id, entity,
    # form_version, form_version_id,
    # last_export_success_at,
    # name,
    # orgunitchangerequest, orgunitreferenceinstance,
    # planning, planning_id, project, project_id,
    # storage_log_entries, to_export
    # Status,
    # Entité,

    prefixed_fields = {f"{model_prefix}{normalize_field_name(f)}": F(f) for f in model_fields}

    # less standard fields that needs some functions or more complex calculation
    prefixed_fields[f"{model_prefix}is_reference"] = Exists(
        m.OrgUnitReferenceInstance.objects.filter(org_unit_id=OuterRef("org_unit_id"), instance_id=OuterRef("pk"))
    )
    prefixed_fields[f"{model_prefix}form_version_id"] = KeyTextTransform("_version", "json")
    prefixed_fields[f"{model_prefix}longitude"] = ST_X(F("location"))
    prefixed_fields[f"{model_prefix}latitude"] = ST_Y(F("location"))
    prefixed_fields[f"{model_prefix}altitude"] = ST_Z(F("location"))
    prefixed_fields[f"{model_prefix}accuracy"] = F("accuracy")
    return prefixed_fields


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
    prefixed_fields = build_submission_annotations()

    qs = (
        qs.values("id")
        .annotate(**prefixed_fields)
        .annotate(**json_annotations)
        .values(*prefixed_fields.keys(), *json_annotations.keys())
    )

    return qs


def build_geojson_annotations(model_prefix: str, extra_fields: Sequence[str]):
    possible_geojson_annotations = {
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
           WHEN simplified_geom IS NULL THEN NULL
           ELSE (
             SELECT ST_AsGeoJSON((dp).geom)::json
             FROM ST_Dump(simplified_geom::geometry) AS dp
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

    default_geo_fields = [f"{model_prefix}longitude", f"{model_prefix}latitude", f"{model_prefix}altitude"]
    if ":all" in extra_fields:
        extra_fields = ALL_OPTIONAL_ORG_UNIT_FIELDS

    selected_fields = default_geo_fields + [f"{model_prefix}{f}" for f in extra_fields]
    geojson_annotations = {
        k: possible_geojson_annotations[k]
        for k in selected_fields
        if (k in possible_geojson_annotations or ":all" in extra_fields)
    }

    return geojson_annotations


def build_level_annotations(qs: QuerySet[m.OrgUnit]):
    max_ancestor_level = qs.aggregate(max_level=Max(RawSQL("array_length(string_to_array(path::text, '.'), 1)", [])))[
        "max_level"
    ]

    level_annotations = {}

    level_annotation = RawSQL(
        "array_length(string_to_array(path::text, '.'), 1)",
        (),
        output_field=IntegerField(),
    )

    level_annotations["org_unit_level"] = level_annotation

    ancestor_fields = ["id", "name", "source_ref", "closed_date", "validation_status"]

    for level in range(max_ancestor_level or 0):
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

    return level_annotations


def build_org_unit_annotations(model_prefix):
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
        "org_unit_type_id",
        "org_unit_type__name",
    ]
    # aliases, assignment, campaigns, campaigns_country, catchment,
    # countryusersgroup,
    # custom, default_image, default_image_id, destination_set, extra_fields,
    # geom, geom_ref, gps_source, groups, iaso_profile, id, instance, instance_lock,
    # jsondatastore, name,  org_unit_change_parents_set,
    # orgunit, orgunitchangerequest,
    # orgunitreferenceinstance, parent, parent_id, path, planning, polio_notifications,
    # record, reference_instances, simplified_geom,
    # source_set, storagedevice, storagelogentry, sub_source,  uuid, vaccine_stocks,
    # vaccineauthorization, validated, version

    # sad to not be aligned with submission : created_by__username, created_by_id
    # so adding aliases
    aliases = {"creator__username": "created_by__username", "creator_id": "created_by_id"}

    org_unit_annotations = {}
    for f in org_unit_fields:
        # avoid prefixing already prefix field like org_unit_type
        field = aliases.get(f) or f
        field = normalize_field_name(field)
        key = f if f.startswith(model_prefix) else normalize_field_name(f"{model_prefix}{field}")
        org_unit_annotations[normalize_field_name(key)] = F(f)

    return org_unit_annotations


def build_pyramid_queryset(qs: QuerySet[m.OrgUnit], extra_fields: Sequence[str]):
    model_prefix = "org_unit_"

    org_unit_annotations = build_org_unit_annotations(model_prefix)
    level_annotations = build_level_annotations(qs)
    geojson_annotations = build_geojson_annotations(model_prefix, extra_fields)

    all_keys = [
        *org_unit_annotations.keys(),
        *level_annotations.keys(),
        *geojson_annotations.keys(),
    ]

    return (
        qs.values("id")
        .annotate(**org_unit_annotations)
        .annotate(**level_annotations)
        .annotate(**geojson_annotations)
        .values(*all_keys)
    )
