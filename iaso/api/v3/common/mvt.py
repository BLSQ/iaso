"""Mapbox Vector Tiles (MVT) for v3 endpoints.

Same idea as the duckdb exports (`iaso.exports.tabular`): the endpoint builds an ordinary queryset - user
scoping, `FilterSet`, `fields=` - and only the last step leaves the ORM. The queryset is compiled to SQL and
wrapped in PostGIS' `ST_AsMVT`, so postgres encodes the whole tile and Django never instantiates a row.

A tile's properties are declared on a `DynamicFieldsMixin` serializer, like any v3 `fields=` selector: a plain
field reads the model column of its `source`, a field listed in the serializer's `annotations` reads those
annotations (one property per annotation, so an annotation can also spread a value over several properties).
MVT properties are scalars: the serializer must not declare nested fields.
"""

import math

from typing import Dict, Iterable, NamedTuple, Optional

from django.contrib.gis.db.models import GeometryField
from django.contrib.gis.db.models.functions import Transform
from django.db import connection
from django.db.models import BooleanField, Expression, F, Func, Q, Value
from rest_framework.negotiation import BaseContentNegotiation
from rest_framework.renderers import BaseRenderer

from .errors import bad_request


MVT_MEDIA_TYPE = "application/vnd.mapbox-vector-tile"
#: size of a tile's coordinate grid (ST_AsMVTGeom's default, what MapLibre expects)
EXTENT = 4096
#: geometries are clipped this many grid units beyond the tile, so lines and polygons join seamlessly
BUFFER = 64
MAX_ZOOM = 24
#: from this zoom, a tile covers few enough rows for a geography index prefilter to pay off (below, postgres
#: reads most of the scoped rows anyway and the extra test only costs time) - see `tile_queryset`
INDEX_PREFILTER_MIN_ZOOM = 11
#: column holding the MVT feature id: postgres removes it from the properties
FEATURE_ID_COLUMN = "mvt_feature_id"
GEOMETRY_COLUMN = "mvt_geom"


class MVTRenderer(BaseRenderer):
    """Only for content negotiation (like the export renderers): the tile view returns the bytes itself."""

    media_type = MVT_MEDIA_TYPE
    format = "mvt"
    charset = None
    render_style = "binary"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


class FirstRendererNegotiation(BaseContentNegotiation):
    """A tile is always a tile: map clients send all sorts of `Accept` headers (or `application/x-protobuf`),
    which would otherwise end in a 406."""

    def select_parser(self, request, parsers):
        return parsers[0] if parsers else None

    def select_renderer(self, request, renderers, format_suffix=None):
        return renderers[0], renderers[0].media_type


class Tile(NamedTuple):
    z: int
    x: int
    y: int

    @classmethod
    def validated(cls, z, x, y) -> "Tile":
        tile = cls(int(z), int(x), int(y))
        if not 0 <= tile.z <= MAX_ZOOM:
            raise bad_request(f"Invalid tile zoom {tile.z}", f"z must be between 0 and {MAX_ZOOM}")
        if not (0 <= tile.x < 2**tile.z and 0 <= tile.y < 2**tile.z):
            raise bad_request(
                f"Invalid tile {tile.z}/{tile.x}/{tile.y}",
                f"x and y must be between 0 and {2**tile.z - 1} at zoom {tile.z}",
            )
        return tile

    def lon_lat_bounds(self):
        """(west, south, east, north) in degrees."""
        n = 2**self.z

        def lat(y):
            return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))

        return self.x / n * 360 - 180, lat(self.y + 1), (self.x + 1) / n * 360 - 180, lat(self.y)


class TileEnvelope(Func):
    """The tile's square, in web mercator (EPSG:3857). Constant arguments: postgres computes it once."""

    function = "ST_TileEnvelope"
    output_field = GeometryField(srid=3857)

    def __init__(self, tile: Tile):
        super().__init__(Value(tile.z), Value(tile.x), Value(tile.y))


class _UncastGeometryField(GeometryField):
    """Selected as is: Django casts selected geometries to `::bytea` (EWKB, to read them back as GEOS objects),
    but `ST_AsMVT` needs the MVT geometry column to be a `geometry`."""

    def select_format(self, compiler, sql, params):
        return sql, params


class AsMVTGeom(Func):
    """`geometry` (EPSG:4326) in the tile's grid coordinates, clipped to the tile (+ `BUFFER`)."""

    function = "ST_AsMVTGeom"
    output_field = _UncastGeometryField(srid=0)

    def __init__(self, geometry, tile: Tile):
        super().__init__(Transform(geometry, 3857), TileEnvelope(tile), Value(EXTENT), Value(BUFFER), Value(True))


class BoxesOverlap(Func):
    """`a && b`: the bounding boxes intersect - the operator the GiST indexes serve."""

    arg_joiner = " && "
    template = "(%(expressions)s)"
    output_field = BooleanField()


class GeographyEnvelope(Func):
    """A `(west, south, east, north)` degrees box as a `geography`, to compare with `geography` columns."""

    template = "ST_MakeEnvelope(%(expressions)s, 4326)::geography"

    def __init__(self, west, south, east, north):
        super().__init__(
            Value(west), Value(south), Value(east), Value(north), output_field=GeometryField(geography=True)
        )


def geography_index_prefilter(tile: Tile, geography_columns: Iterable[str]) -> Q:
    """Rows whose `geography_columns` overlap the tile, using their GiST indexes.

    Only a prefilter: `geography` boxes follow great circles, not the tile's parallels, so the box is grown by a
    whole tile width each side (a superset whatever the curvature) and the exact test stays planar. Clamped to
    valid coordinates, which `geography` requires (the tile itself never crosses the antimeridian)."""
    west, south, east, north = tile.lon_lat_bounds()
    margin = 360 / 2**tile.z  # a tile is never taller than wide, in degrees
    box = GeographyEnvelope(
        max(west - margin, -180), max(south - margin, -90), min(east + margin, 180), min(north + margin, 90)
    )
    q = Q()
    for column in geography_columns:
        q |= Q(BoxesOverlap(F(column), box))
    return q


def tile_properties(serializer) -> Dict[str, Optional[Expression]]:
    """MVT property name -> the expression computing it, `None` for a model column read as is."""
    properties = {}
    for name, field in serializer.fields.items():
        if name in serializer.annotations:
            properties.update(serializer.annotations[name])
        elif field.source == name:
            properties[name] = None
        else:
            properties[name] = F(field.source)
    return properties


def tile_queryset(
    queryset, geometry: Expression, properties: Dict[str, Optional[Expression]], tile: Tile, geography_columns=()
):
    """`queryset` reduced to the rows overlapping `tile`, as `.values()` rows: the MVT geometry, the feature id
    and `properties`.

    `geometry` is the row's shape in EPSG:4326 (`geometry`, not `geography`: the tile is a planar lon/lat box
    once unprojected). From `INDEX_PREFILTER_MIN_ZOOM`, `geography_columns` (the indexed columns `geometry` is
    derived from) also get an index-backed prefilter."""
    envelope = Transform(TileEnvelope(tile), 4326)
    queryset = queryset.order_by().filter(BoxesOverlap(geometry, envelope))
    if geography_columns and tile.z >= INDEX_PREFILTER_MIN_ZOOM:
        queryset = queryset.filter(geography_index_prefilter(tile, geography_columns))
    columns = [name for name, expression in properties.items() if expression is None]
    annotations = {name: expression for name, expression in properties.items() if expression is not None}
    return queryset.annotate(
        **annotations, **{GEOMETRY_COLUMN: AsMVTGeom(geometry, tile), FEATURE_ID_COLUMN: F("pk")}
    ).values(*columns, *annotations, GEOMETRY_COLUMN, FEATURE_ID_COLUMN)


def render_tile(values_queryset, layer_name: str) -> bytes:
    """Encode the rows of `tile_queryset()` as one MVT layer, in postgres."""
    sql, params = values_queryset.query.sql_with_params()
    with connection.cursor() as cursor:
        cursor.execute(
            f"SELECT ST_AsMVT(t.*, %s, %s, %s, %s) FROM ({sql}) AS t",
            [layer_name, EXTENT, GEOMETRY_COLUMN, FEATURE_ID_COLUMN, *params],
        )
        row = cursor.fetchone()
    return bytes(row[0]) if row and row[0] is not None else b""
