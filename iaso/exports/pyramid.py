from typing import Sequence

from django.contrib.postgres.fields import JSONField
from django.db.models import F, FloatField, Func, IntegerField, Max, QuerySet
from django.db.models.expressions import RawSQL
from django.db.models.functions import Cast

import iaso.models as m

from .utils import normalize_field_name


ALL_OPTIONAL_ORG_UNIT_FIELDS = [
    "geom_geojson",
    "location_geojson",
    "simplified_geom_geojson",
    "biggest_polygon_geojson",
]


def build_pyramid_queryset(qs: QuerySet[m.OrgUnit], extra_fields: Sequence[str]) -> QuerySet[m.OrgUnit]:
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


def build_org_unit_annotations(model_prefix: str):
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
        "parent_id",
    ]

    # sad to not be aligned with submission : created_by__username, created_by_id
    # so adding aliases
    aliases = {"creator__username": "created_by__username", "creator_id": "created_by_id"}

    org_unit_annotations = {}

    for field in org_unit_fields:
        # avoid prefixing already prefix field like org_unit_type
        aliased_field = aliases.get(field, field)
        if not aliased_field.startswith(model_prefix):
            aliased_field = f"{model_prefix}{aliased_field}"
        aliased_field = normalize_field_name(aliased_field)
        org_unit_annotations[aliased_field] = F(field)

    return org_unit_annotations


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
