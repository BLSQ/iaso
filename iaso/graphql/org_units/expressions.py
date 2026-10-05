"""SQL for the computed `OrgUnit` fields - each only reaches the query when its field is selected (see
`selection.py`).
"""

from typing import List

from django.contrib.gis.db.models import GeometryField
from django.db.models import (
    BooleanField,
    Exists,
    ExpressionWrapper,
    F,
    FloatField,
    Func,
    IntegerField,
    JSONField,
    OuterRef,
    Q,
    Subquery,
)
from django.db.models.functions import Coalesce

from iaso.models import Instance, OrgUnit


def as_geometry(column: str) -> Func:
    """The org unit columns are PostGIS `geography`: `geometry(<column>)` casts them to a planar lon/lat `geometry`
    (PostGIS' function rather than a typed cast, which would reject the 3D `location` column)."""
    return Func(F(column), function="geometry", output_field=GeometryField(srid=4326))


def location_coordinate(function: str) -> Func:
    """`ST_X`/`ST_Y`/`ST_Z` computed by postgres: the `location` column itself is never loaded nor parsed by GEOS."""
    return Func(as_geometry("location"), function=function, output_field=FloatField())


def depth() -> Func:
    return Func(F("path"), function="nlevel", output_field=IntegerField())


def has_geo_json() -> ExpressionWrapper:
    return ExpressionWrapper(Q(geom__isnull=False) | Q(simplified_geom__isnull=False), output_field=BooleanField())


def has_geometry() -> ExpressionWrapper:
    located = Q(location__isnull=False) | Q(simplified_geom__isnull=False) | Q(geom__isnull=False)
    return ExpressionWrapper(located, output_field=BooleanField())


def has_children() -> Exists:
    return Exists(OrgUnit.objects.filter(parent_id=OuterRef("pk")))


def submission_count() -> Coalesce:
    """Same instances as the legacy `/api/orgunits/` `instances_count`: not deleted, with a file, not from a
    test device. A correlated subquery rather than a `Count` aggregate: no `GROUP BY` over every selected column."""
    instances = (
        Instance.objects.filter(org_unit_id=OuterRef("pk"))
        .exclude(file="")
        .exclude(deleted=True)
        .filter(~Q(device__test_device=True))
        .order_by()
        .annotate(count=Func(F("id"), function="COUNT"))
        .values("count")
    )
    return Coalesce(Subquery(instances, output_field=IntegerField()), 0)


class AncestorsJson(Func):
    """The org unit's ancestors, root first, as a JSON list of objects holding only `columns`: a correlated
    `jsonb_agg` subquery, so the ancestors of a whole page come with the page.

    The labels of an org unit's `path` are its ancestors' ids (`OrgUnit.save()` builds it from them): they are
    read by primary key, rather than searched with `a.path @> path` - the GiST index doesn't know how many paths
    contain a given one, its estimate of ~1 000 per row made postgres JIT-compile the page query (~10 ms each
    time) and the search itself read ~50 index pages per row.

    `columns` come from `selection.py`, never from the request; `path`: the ORM path to the org unit's `path`
    (`org_unit__path` for the org unit of a submission)."""

    output_field = JSONField()

    def __init__(self, columns: List[str], path: str = "path"):
        super().__init__(F(path))
        self.columns = columns

    def as_sql(self, compiler, connection, **extra_context):
        path_sql, path_params = compiler.compile(self.source_expressions[0])
        ancestor = "jsonb_build_object(" + ", ".join(f"'{column}', a.{column}" for column in self.columns) + ")"
        sql = f"""COALESCE((SELECT jsonb_agg({ancestor} ORDER BY label.position)
                            FROM unnest(string_to_array(ltree2text({path_sql}), '.')::int[])
                                 WITH ORDINALITY AS label(id, position)
                            JOIN iaso_orgunit a ON a.id = label.id
                            WHERE label.position < nlevel({path_sql})), '[]'::jsonb)"""
        return sql, [*path_params, *path_params]
