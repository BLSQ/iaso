import re
import unicodedata

from typing import Sequence

from django.conf import settings
from django.contrib.postgres.aggregates import JSONBAgg
from django.contrib.postgres.fields import JSONField
from django.db.models import Exists, F, FloatField, Func, IntegerField, Max, OuterRef, QuerySet, Subquery, Value
from django.db.models.expressions import RawSQL
from django.db.models.functions import Cast, Coalesce, JSONObject

import iaso.models as m

from .utils import normalize_field_name


ALL_OPTIONAL_ORG_UNIT_FIELDS = [
    "geom_geojson",
    "location_geojson",
    "simplified_geom_geojson",
    "biggest_polygon_geojson",
    "groups_exploded",
    "groups_json",
]


def build_pyramid_queryset(qs: QuerySet[m.OrgUnit], extra_fields: Sequence[str]) -> QuerySet[m.OrgUnit]:
    model_prefix = "org_unit_"

    org_unit_annotations = build_org_unit_annotations(model_prefix)
    level_annotations = build_level_annotations(qs)
    geojson_annotations = build_geojson_annotations(model_prefix, extra_fields)
    group_annotations = build_group_annotations(qs, extra_fields)

    all_keys = [
        *org_unit_annotations.keys(),
        *level_annotations.keys(),
        *geojson_annotations.keys(),
        *group_annotations.keys(),
    ]

    return (
        qs.values("id")
        .annotate(**org_unit_annotations)
        .annotate(**level_annotations)
        .annotate(**geojson_annotations)
        .annotate(**group_annotations)
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


def _strip_accents(name: str) -> str:
    """
    Convert name to ASCII:
    - accented letters -> base letter (e.g. e-acute -> e, I-circumflex -> I)
    - non-ASCII combining marks (diacritics left after NFD decomposition) -> dropped
    - all other non-ASCII (dashes, smart quotes, symbols, NBSP, ellipsis...) -> "_"
    """
    return "".join(
        c if ord(c) < 128 else ("" if unicodedata.category(c) == "Mn" else "_")
        for c in unicodedata.normalize("NFD", name)
    )


def _safe_group_name(name: str) -> str:
    """Accent-stripped, lowercase, non-alphanumeric replaced by underscores -- SQL-identifier-safe, no quoting needed."""
    return re.sub(r"[^A-Za-z0-9]", "_", _strip_accents(name)).strip("_").lower()


def _group_exists_sql(group_id: int):
    return Cast(
        Exists(m.Group.objects.filter(pk=group_id, org_units=OuterRef("pk"))),
        output_field=IntegerField(),
    )


def build_group_annotations(qs: QuerySet[m.OrgUnit], extra_fields: Sequence[str]):
    annotations = {}
    include_all = settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE in extra_fields

    need_exploded = "groups_exploded" in extra_fields or include_all
    need_exploded_code = "groups_exploded_code" in extra_fields

    if need_exploded or need_exploded_code:
        groups = m.Group.objects.filter(org_units__in=qs.all()).values("id", "name").order_by("id").distinct()
        if need_exploded_code:
            seen_safe_names: dict[str, int] = {}
            for group in groups:
                safe = _safe_group_name(group["name"])
                if safe in seen_safe_names:
                    raise ValueError(
                        f"Group names '{group['name']}' and (id={seen_safe_names[safe]}) both normalize to '{safe}'. "
                        "Use groups_exploded instead to avoid column collisions."
                    )
                seen_safe_names[safe] = group["id"]
        for group in groups:
            if need_exploded:
                annotations[f"group_{group['id']}_{_safe_group_name(group['name'])}"] = _group_exists_sql(group["id"])
            if need_exploded_code:
                annotations[f"group_{_safe_group_name(group['name'])}"] = _group_exists_sql(group["id"])

    if "groups_json" in extra_fields or include_all:
        annotations["org_unit_groups"] = Coalesce(
            Subquery(
                m.Group.objects.filter(org_units=OuterRef("pk"))
                .values("org_units")
                .annotate(j=JSONBAgg(JSONObject(id="id", name="name"), ordering="id"))
                .values("j"),
                output_field=JSONField(),
            ),
            Value([], output_field=JSONField()),
        )

    return annotations


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
