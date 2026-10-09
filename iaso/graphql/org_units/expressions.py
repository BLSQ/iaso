"""ORM expressions behind the computed `OrgUnit` fields - each one only reaches the SQL when its field is
selected (`strawberry_django.field(annotate=...)`)."""

from django.contrib.gis.db.models import GeometryField
from django.db.models import (
    BooleanField,
    Exists,
    ExpressionWrapper,
    F,
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
    """The org unit columns are PostGIS `geography`: cast to a planar lon/lat `geometry` for bbox tests."""
    return Func(F(column), function="geometry", output_field=GeometryField(srid=4326))


def has_geo_json() -> ExpressionWrapper:
    return ExpressionWrapper(Q(geom__isnull=False) | Q(simplified_geom__isnull=False), output_field=BooleanField())


def has_children() -> Exists:
    return Exists(OrgUnit.objects.filter(parent_id=OuterRef("pk")))


def instance_count() -> Coalesce:
    """Same instances as the legacy `/api/orgunits/` `instances_count`: not deleted, with a file, not from a
    test device. A correlated subquery rather than a `Count` aggregate: no `GROUP BY` over every selected
    column, and it can't multiply rows joined for other fields."""
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


#: the `OrgUnitSummary` columns, as `ancestors_json` returns them (the keys are `OrgUnit` field names)
ANCESTOR_COLUMNS = ("id", "name", "source_ref", "validation_status", "org_unit_type_id", "parent_id")


class AncestorsJson(Func):
    """The org unit's ancestors, root first, as a JSON array of `ANCESTOR_COLUMNS` objects (`NULL` for a root).

    One correlated subquery on the ltree `@>` operator (GiST-indexed `path`), rather than `OrgUnit.ancestors()`
    per row: the whole page and its ancestors in a single query."""

    output_field = JSONField()

    def __init__(self):
        super().__init__(F("path"))

    def as_sql(self, compiler, connection, **extra_context):
        path_sql, path_params = compiler.compile(self.source_expressions[0])
        columns = ", ".join(f"'{column}', a.{column}" for column in ANCESTOR_COLUMNS)
        sql = f"""(SELECT jsonb_agg(jsonb_build_object({columns}) ORDER BY nlevel(a.path))
                   FROM iaso_orgunit a WHERE a.path @> {path_sql} AND a.path <> {path_sql})"""
        return sql, [*path_params, *path_params]


def ancestors_json() -> AncestorsJson:
    return AncestorsJson()
