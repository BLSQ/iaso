"""ORM expressions shared by the org unit filters and serializers (JSON and vector tiles).

The org unit geometry columns are PostGIS `geography`; `geometry(<column>)` casts them to a planar lon/lat
`geometry` (PostGIS' function rather than a typed cast, which would reject the 3D `location` column).
"""

from django.contrib.gis.db.models import GeometryField
from django.contrib.postgres.fields import ArrayField
from django.db.models import BooleanField, Exists, F, FloatField, Func, IntegerField, OuterRef, Q, Subquery
from django.db.models.functions import Coalesce

from iaso.models import OrgUnit


#: the org unit has something to draw: a point or a shape
LOCATED = Q(location__isnull=False) | Q(simplified_geom__isnull=False) | Q(geom__isnull=False)
GEOGRAPHY_COLUMNS = ("location", "simplified_geom", "geom")


def as_geometry(column: str) -> Func:
    return Func(F(column), function="geometry", output_field=GeometryField(srid=4326))


def drawn_geometry() -> Coalesce:
    """What a map draws for an org unit: its point, else its simplified shape, else its full shape."""
    return Coalesce(*(as_geometry(column) for column in GEOGRAPHY_COLUMNS), output_field=GeometryField(srid=4326))


def extent_geometry() -> Coalesce:
    """What a map zooms to: the full shape first (the point of an org unit with a shape is just a marker)."""
    return Coalesce(
        *(as_geometry(column) for column in ("geom", "simplified_geom", "location")),
        output_field=GeometryField(srid=4326),
    )


def has_children() -> Exists:
    """Any child, located or not (the ones without geometry can be listed next to the map)."""
    return Exists(OrgUnit.objects.filter(parent_id=OuterRef("pk")))


class BoxCoordinate(Func):
    """`ST_XMin`/`ST_YMin`/`ST_XMax`/`ST_YMax` of the bounding box of a geometry."""

    output_field = FloatField()

    def __init__(self, function, geometry):
        super().__init__(Func(geometry, function="Box2D"), function=function)


def bbox_properties(prefix: str = "bbox_") -> dict:
    """The full (unclipped) extent of the org unit, as 4 scalar columns - a vector tile can't hold an array."""
    return {
        f"{prefix}{name}": BoxCoordinate(f"ST_{name.capitalize()}", extent_geometry())
        for name in ("xmin", "ymin", "xmax", "ymax")
    }


class IntArrayContains(Func):
    """`value = ANY(array)`"""

    template = "%(expressions)s)"
    arg_joiner = " = ANY("
    output_field = BooleanField()


class PathLabelsBetween(Func):
    """The org unit ids between depth `depth` (excluded) and the org unit itself (excluded) in an ltree path -
    path labels are org unit ids. `subpath(path, depth, nlevel(path) - depth - 1)` of `1.2.3.4` at depth 1 is
    `2.3`."""

    output_field = ArrayField(IntegerField())

    def __init__(self, path, depth: int):
        super().__init__(path, depth=depth)

    def as_sql(self, compiler, connection, **extra_context):
        path_sql, path_params = compiler.compile(self.source_expressions[0])
        depth = int(self.extra["depth"])
        sql = f"string_to_array(ltree2text(subpath({path_sql}, {depth}, nlevel({path_sql}) - {depth} - 1)), '.')::int[]"
        return sql, [*path_params, *path_params]


class PathLabelAt(Func):
    """The org unit id at depth `depth` (0 = root) of an ltree path."""

    output_field = IntegerField()

    def __init__(self, path, depth: int):
        super().__init__(path, depth=depth)

    def as_sql(self, compiler, connection, **extra_context):
        path_sql, path_params = compiler.compile(self.source_expressions[0])
        return f"ltree2text(subpath({path_sql}, {int(self.extra['depth'])}, 1))::int", path_params


def located_descendants_between(depth: int) -> Exists:
    """A located org unit between depth `depth` and the org unit (both excluded)."""
    return Exists(
        OrgUnit.objects.filter(LOCATED).filter(IntArrayContains(F("id"), PathLabelsBetween(OuterRef("path"), depth)))
    )


def located_descendants_count() -> Subquery:
    """How many located org units are below this one (at any depth)."""
    # `Func(COUNT)` rather than the `Count` aggregate: no GROUP BY, the subquery is always a single row
    descendants = (
        OrgUnit.objects.filter(LOCATED, path__descendants=OuterRef("path"))
        .exclude(pk=OuterRef("pk"))
        .order_by()
        .annotate(count=Func(F("id"), function="COUNT"))
        .values("count")
    )
    return Coalesce(Subquery(descendants, output_field=IntegerField()), 0)


class LocatedExtent(Func):
    """`[xmin, ymin, xmax, ymax]` of the org unit and its located descendants, `NULL` when none is located."""

    output_field = ArrayField(FloatField())

    def __init__(self):
        super().__init__(F("path"))

    def as_sql(self, compiler, connection, **extra_context):
        path_sql, path_params = compiler.compile(self.source_expressions[0])
        located = " OR ".join(f"s.{column} IS NOT NULL" for column in GEOGRAPHY_COLUMNS)
        geometry = (
            "COALESCE(" + ", ".join(f"geometry(s.{column})" for column in ("geom", "simplified_geom", "location")) + ")"
        )
        sql = f"""(SELECT CASE WHEN e.box IS NULL THEN NULL
                        ELSE ARRAY[ST_XMin(e.box), ST_YMin(e.box), ST_XMax(e.box), ST_YMax(e.box)] END
                   FROM (SELECT ST_Extent({geometry}) AS box FROM iaso_orgunit s
                         WHERE s.path <@ {path_sql} AND ({located})) e)"""
        return sql, path_params
