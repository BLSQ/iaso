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

from contextlib import contextmanager
from typing import Dict, Iterable, NamedTuple, Optional

from django.contrib.gis.db.models import GeometryField
from django.contrib.gis.db.models.functions import Transform
from django.db import OperationalError, connection, transaction
from django.db.models import BooleanField, Expression, F, Func, Q, Value
from django.utils.cache import patch_vary_headers
from rest_framework import serializers, status
from rest_framework.exceptions import APIException
from rest_framework.negotiation import BaseContentNegotiation
from rest_framework.renderers import BaseRenderer

from .errors import bad_request


MVT_MEDIA_TYPE = "application/vnd.mapbox-vector-tile"
#: size of a tile's coordinate grid (ST_AsMVTGeom's default, what MapLibre expects)
EXTENT = 4096
#: geometries are clipped this many grid units beyond the tile, so lines and polygons join seamlessly
BUFFER = 64
MAX_ZOOM = 24
#: MapLibre draws a vector tile on 512 x 512 css pixels
TILE_SIZE_PX = 512
#: geometries are simplified (Douglas-Peucker) by this many screen pixels: finer is invisible, and the tile grid
#: (`EXTENT`) is already 8 times finer than the screen
SIMPLIFY_TOLERANCE_PX = 0.5
#: circumference of the earth in web mercator (EPSG:3857) units, i.e. meters at the equator
WEB_MERCATOR_WIDTH = 2 * math.pi * 6378137
#: from this zoom, a tile covers few enough rows for a geography index prefilter to pay off (below, postgres
#: reads most of the scoped rows anyway and the extra test only costs time) - see `tile_queryset`
INDEX_PREFILTER_MIN_ZOOM = 11
#: zoom up to which clients should request tiles (past it they overzoom): tiles are simplified for their zoom up
#: to the full shapes, so finer only shows sub-meter rounding while each level is 4 times more tiles
TILE_SOURCE_MAX_ZOOM = 18
#: web mercator's latitude limit: TileJSON `bounds` must stay within it
MAX_MERCATOR_LATITUDE = 85.0511287798066
#: how long a browser may reuse a tile requested with a `cache_key` (the frontend's tile cache key lives as long)
TILE_CACHE_MAX_AGE = 15 * 60
#: column holding the MVT feature id: postgres removes it from the properties
FEATURE_ID_COLUMN = "mvt_feature_id"
GEOMETRY_COLUMN = "mvt_geom"
#: property of a cluster feature: how many points it stands for (only set when more than one)
POINT_COUNT_COLUMN = "point_count"
#: largest `cluster` cell, in screen pixels (a quarter of a tile)
MAX_CLUSTER_PX = TILE_SIZE_PX // 4
#: `cluster=auto`: the tiles are clustered by `AUTO_CLUSTER_PX` when more than `AUTO_CLUSTER_MIN_LOCATED` rows
#: are located (unlocated rows are never drawn). Below, they hold every point as is.
AUTO_CLUSTER = "auto"
AUTO_CLUSTER_PX = 48
AUTO_CLUSTER_MIN_LOCATED = 10_000
#: from this zoom points are never clustered: points that close are the same place (duplicates, a building
#: drawn twice), which zooming in can't separate - the client lists them instead
CLUSTER_MAX_ZOOM = 15
#: at most this many features in a tile: past it the tile is cut and says so in a `TILE_META_LAYER` feature.
#: A safety net for the browser - clustered points never get near it, only unclustered points or shapes can.
MAX_TILE_FEATURES = 50_000
#: layer added to a tile only when it was cut: one feature with `feature_count` and `kept`
TILE_META_LAYER = "tile_meta"
#: a tile query running longer is cancelled (a 503 the map shows as a missing tile, instead of piling up)
TILE_STATEMENT_TIMEOUT_MS = 15_000
#: postgres settings of the tile and TileJSON queries. No JIT: postgres compiles queries estimated above
#: `jit_above_cost`, which these reach over large searches - and the compiling costs more than it saves (162k org
#: units: a TileJSON 0.32 s -> 0.16 s, the 6 tiles of the fitted view 2.4 s -> 0.4 s in all).
QUERY_SETTINGS = {"jit": "off"}
#: a shape smaller than this many screen pixels is drawn as a point: polygons that small vanish once snapped to
#: the tile grid (and couldn't be seen anyway), the point keeps them on the map - and in the clusters
COLLAPSED_SHAPE_PX = 2
#: `fit_bounds`: the located org units whose center lies further than this many times the spread of the central
#: 90% (5th to 95th percentile) away from it are left out - a village geolocated on another continent
FIT_BOUNDS_QUANTILE = 0.05
FIT_BOUNDS_MARGIN = 1.0


class TileTimeout(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = {"error": "The tile took too long", "detail": "Narrow the filters, or zoom in."}
    default_code = "tile_timeout"


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

    @property
    def pixel_size(self) -> float:
        """Size of a screen pixel, in web mercator units."""
        return WEB_MERCATOR_WIDTH / 2**self.z / TILE_SIZE_PX

    @property
    def pixel_size_degrees(self) -> float:
        """Size of a screen pixel in degrees of longitude, i.e. at most its size in degrees of latitude."""
        return 360 / 2**self.z / TILE_SIZE_PX


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


class Simplify(Func):
    """Douglas-Peucker simplification, keeping the shapes it would collapse (a tiny org unit stays a dot)."""

    function = "ST_Simplify"

    def __init__(self, geometry, tolerance: float):
        super().__init__(geometry, Value(tolerance), Value(True), output_field=GeometryField(srid=3857))


class AsMVTGeom(Func):
    """`geometry` (EPSG:4326) in the tile's grid coordinates, simplified for the tile's zoom and clipped to the
    tile (+ `BUFFER`)."""

    function = "ST_AsMVTGeom"
    output_field = _UncastGeometryField(srid=0)

    def __init__(self, geometry, tile: Tile):
        simplified = Simplify(Transform(geometry, 3857), tile.pixel_size * SIMPLIFY_TOLERANCE_PX)
        super().__init__(simplified, TileEnvelope(tile), Value(EXTENT), Value(BUFFER), Value(True))


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
    queryset,
    geometry: Expression,
    properties: Dict[str, Optional[Expression]],
    tile: Tile,
    geography_columns=(),
    filter_geometry: Optional[Expression] = None,
):
    """`queryset` reduced to the rows overlapping `tile`, as `.values()` rows: the MVT geometry, the feature id
    and `properties`.

    `geometry` is the row's shape in EPSG:4326 (`geometry`, not `geography`: the tile is a planar lon/lat box
    once unprojected). From `INDEX_PREFILTER_MIN_ZOOM`, `geography_columns` (the indexed columns `geometry` is
    derived from) also get an index-backed prefilter. `filter_geometry`, when given, picks the rows instead of
    `geometry`: a cheaper expression whose box holds `geometry`'s (every row of the queryset is tested, only the
    rows of the tile are drawn)."""
    envelope = Transform(TileEnvelope(tile), 4326)
    queryset = queryset.order_by().filter(BoxesOverlap(filter_geometry or geometry, envelope))
    if geography_columns and tile.z >= INDEX_PREFILTER_MIN_ZOOM:
        queryset = queryset.filter(geography_index_prefilter(tile, geography_columns))
    columns = [name for name, expression in properties.items() if expression is None]
    annotations = {name: expression for name, expression in properties.items() if expression is not None}
    return queryset.annotate(
        **annotations, **{GEOMETRY_COLUMN: AsMVTGeom(geometry, tile), FEATURE_ID_COLUMN: F("pk")}
    ).values(*columns, *annotations, GEOMETRY_COLUMN, FEATURE_ID_COLUMN)


def set_tile_cache_headers(response, cache_key: Optional[str]):
    """Tiles depend on the user's access scope: only the user's own browser may keep them (`private`, and
    `Vary` so another user signing in on that browser doesn't get them).

    By default the browser must always revalidate. With a `cache_key`, the client accepts that the tile may be
    up to `TILE_CACHE_MAX_AGE` old: it changes the key (so the url) when it knows the data changed."""
    response["Cache-Control"] = f"private, max-age={TILE_CACHE_MAX_AGE}" if cache_key else "private, no-cache"
    patch_vary_headers(response, ("Cookie", "Authorization"))


#: TileJSON's usual field descriptions, for the fields without `help_text`
_TILEJSON_TYPES = {
    serializers.IntegerField: "Number",
    serializers.FloatField: "Number",
    serializers.BooleanField: "Boolean",
}


def tile_fields(serializer) -> Dict[str, str]:
    """MVT property name -> its description, for TileJSON's `vector_layers` (same names as `tile_properties`)."""
    fields = {}
    for name, field in serializer.fields.items():
        description = str(field.help_text or _TILEJSON_TYPES.get(type(field), "String"))
        for property_name in serializer.annotations.get(name, {name: None}):
            fields[property_name] = description
    return fields


def tilejson(tiles_url: str, layer_name: str, fields: Dict[str, str], bounds: Optional[list]) -> dict:
    """A TileJSON 3.0.0 document (https://github.com/mapbox/tilejson-spec): what a map client needs to use a tile
    source on its own - where to fetch the tiles, up to which zoom, what their features hold and where they are.
    `bounds` also spares the client the requests of tiles outside them."""
    document = {
        "tilejson": "3.0.0",
        "tiles": [tiles_url],
        "minzoom": 0,
        "maxzoom": TILE_SOURCE_MAX_ZOOM,
        "vector_layers": [{"id": layer_name, "fields": fields}],
    }
    if bounds is not None:
        document["bounds"] = bounds
    return document


@contextmanager
def settings_cursor(**settings):
    """A cursor in a transaction of its own, with postgres `settings` (`SET LOCAL`) for the duration of the block.

    Requests run in autocommit: the transaction, so the settings, end with the block. Within a caller's transaction
    (`ATOMIC_REQUESTS`, tests), the block is a savepoint, which doesn't scope `SET LOCAL`: the previous values are
    put back after it (on an error, rolling the savepoint back does)."""
    names = list(settings)
    nested = connection.in_atomic_block
    with transaction.atomic(), connection.cursor() as cursor:
        if nested:
            cursor.execute("SELECT " + ", ".join(["current_setting(%s)"] * len(names)), names)
            previous = cursor.fetchone()
        set_config = ", ".join(["set_config(%s, %s, true)"] * len(names))
        cursor.execute(f"SELECT {set_config}", [v for name in names for v in (name, str(settings[name]))])
        yield cursor
        if nested:
            cursor.execute(f"SELECT {set_config}", [v for name, value in zip(names, previous) for v in (name, value)])


def validated_cluster_px(value, allow_auto: bool = False):
    """The `cluster` query param: the side of a cluster cell in screen pixels, `None` when not clustering - or
    `AUTO_CLUSTER` where `allow_auto` (TileJSON, which decides for its tiles: see `auto_cluster_px`)."""
    if value in (None, ""):
        return None
    if allow_auto and value == AUTO_CLUSTER:
        return AUTO_CLUSTER
    try:
        cluster_px = int(value)
    except ValueError:
        cluster_px = 0
    if not 1 <= cluster_px <= MAX_CLUSTER_PX:
        raise bad_request(
            f"Invalid value for 'cluster': {value!r}",
            f"An integer number of pixels, from 1 to {MAX_CLUSTER_PX}"
            + (f", or {AUTO_CLUSTER!r}." if allow_auto else "."),
        )
    return cluster_px


def auto_cluster_px(located_count: int) -> Optional[int]:
    """What `cluster=auto` picks for a query with `located_count` rows to draw."""
    return AUTO_CLUSTER_PX if located_count > AUTO_CLUSTER_MIN_LOCATED else None


def _quoted(name: str) -> str:
    return connection.ops.quote_name(name)


def _clustered_features_sql(columns, cell: int, cluster_by: Optional[str] = None) -> str:
    """The rows of `tile_rows` with their points grouped by `cell` x `cell` squares of the tile grid: one feature per
    square, at the points' mean position. A lone point stays itself; a square of several points has their count
    (`POINT_COUNT_COLUMN`) and neither a feature id nor properties, which are those of one org unit.

    Points are only kept inside the tile: one on the edge of two tiles overlaps both, and a cluster must count it
    once. Grouping happens in tile grid coordinates, so squares never straddle tiles.

    With `cluster_by` (one of `columns`), the points of a square are grouped by that column too: one cluster per
    value, which keeps it - e.g. one per org unit type, which a map can color and filter like single points."""
    single = "count(*) = 1"
    properties = ", ".join(
        _quoted(c) if c == cluster_by else f"CASE WHEN {single} THEN (array_agg({_quoted(c)}))[1] END AS {_quoted(c)}"
        for c in columns
    )
    # an empty point (some locations are `POINT EMPTY`) has nothing to draw. Locations are 3D (`POINT Z`) and
    # collapsed shapes 2D: `ST_Collect` takes either, not both, hence `ST_Force2D`.
    is_point = f"ST_GeometryType({GEOMETRY_COLUMN}) = 'ST_Point' AND NOT ST_IsEmpty({GEOMETRY_COLUMN})"
    # `ST_XMin` rather than `ST_X`: postgres may evaluate it before `is_point`, and it takes any geometry
    x, y = f"ST_XMin({GEOMETRY_COLUMN})", f"ST_YMin({GEOMETRY_COLUMN})"
    in_tile = f"{x} >= 0 AND {x} < {EXTENT} AND {y} >= 0 AND {y} < {EXTENT}"
    plain_columns = "".join(f"{_quoted(c)}, " for c in columns)
    return f"""
        SELECT {plain_columns}{GEOMETRY_COLUMN}, {FEATURE_ID_COLUMN}, NULL::bigint AS {POINT_COUNT_COLUMN}
        FROM tile_rows WHERE {GEOMETRY_COLUMN} IS NOT NULL AND ST_GeometryType({GEOMETRY_COLUMN}) <> 'ST_Point'
        UNION ALL
        SELECT {properties}{", " if columns else ""}
            CASE WHEN {single} THEN (array_agg({GEOMETRY_COLUMN}))[1]
                 ELSE ST_SnapToGrid(ST_Centroid(ST_Collect(ST_Force2D({GEOMETRY_COLUMN}))), 1) END,
            CASE WHEN {single} THEN min({FEATURE_ID_COLUMN}) END,
            CASE WHEN NOT {single} THEN count(*) END
        FROM tile_rows WHERE {is_point} AND {in_tile}
        GROUP BY floor({x} / {cell}), floor({y} / {cell}){f", {_quoted(cluster_by)}" if cluster_by else ""}"""


def _columns(values_queryset):
    """Property columns of a `tile_queryset()`, in their select order."""
    query = values_queryset.query
    names = [*query.values_select, *query.annotation_select]
    return [name for name in names if name not in (GEOMETRY_COLUMN, FEATURE_ID_COLUMN)]


def render_tile(
    values_queryset, layer_name: str, tile: Tile, cluster_px: Optional[int] = None, cluster_by: Optional[str] = None
) -> bytes:
    """Encode the rows of `tile_queryset()` as one MVT layer, in postgres.

    With `cluster_px` (below `CLUSTER_MAX_ZOOM`), points are clustered by squares of that many screen pixels (see
    `_clustered_features_sql`), and by `cluster_by` too when given. A tile holds at most `MAX_TILE_FEATURES`: past it, a `TILE_META_LAYER` is added
    (MVT layers concatenate as bytes) with the number of features the tile should have held."""
    sql, params = values_queryset.query.sql_with_params()
    if cluster_px and tile.z < CLUSTER_MAX_ZOOM:
        cell = cluster_px * EXTENT // TILE_SIZE_PX
        features = _clustered_features_sql(_columns(values_queryset), cell, cluster_by)
    else:
        # `ST_AsMVTGeom` gives no geometry for what doesn't reach the tile: not a feature (nor counted as one)
        features = f"SELECT * FROM tile_rows WHERE {GEOMETRY_COLUMN} IS NOT NULL"
    query = f"""
        WITH tile_rows AS ({sql}), features AS ({features})
        SELECT
            COALESCE((SELECT ST_AsMVT(t.*, %s, {EXTENT}, %s, %s) FROM (SELECT * FROM features LIMIT %s) t), ''::bytea)
            || COALESCE((
                SELECT ST_AsMVT(m.*, %s, {EXTENT}, 'geom') FROM (
                    SELECT ST_MakePoint({EXTENT // 2}, {EXTENT // 2}) AS geom, n AS feature_count, %s AS kept
                    FROM (SELECT count(*) AS n FROM features) c WHERE n > %s
                ) m
            ), ''::bytea)"""
    query_params = [
        *params,
        layer_name,
        GEOMETRY_COLUMN,
        FEATURE_ID_COLUMN,
        MAX_TILE_FEATURES,
        TILE_META_LAYER,
        MAX_TILE_FEATURES,
        MAX_TILE_FEATURES,
    ]
    try:
        with settings_cursor(**QUERY_SETTINGS, statement_timeout=TILE_STATEMENT_TIMEOUT_MS) as cursor:
            cursor.execute(query, query_params)
            row = cursor.fetchone()
    except OperationalError as error:
        if getattr(error.__cause__, "pgcode", None) == "57014":  # query_canceled
            raise TileTimeout()
        raise
    return bytes(row[0]) if row and row[0] is not None else b""


class Box2D(Func):
    function = "Box2D"
    output_field = _UncastGeometryField()


def summary(queryset, geometry: Expression, count_by: Optional[str] = None) -> dict:
    """What a map needs to know of the whole `queryset` before drawing it, in one query:

    - `count`, `located_count`: how many rows, how many with a `geometry` (the others aren't on the map);
    - `bounds`: the extent of `geometry` - where tiles may hold something (`None` when nothing is located);
    - `fit_bounds`: where to look - the extent without the far outliers (see `FIT_BOUNDS_MARGIN`), and
      `outside_fit_bounds`, how many were left out;
    - with `count_by` (a column), `counts_by`: `count` and `located_count` per value of that column, the most
      frequent first - e.g. per org unit type, for a legend. Rows already read: a few ms more."""
    boxes = queryset.order_by().annotate(box=Box2D(geometry))
    if count_by:
        boxes = boxes.annotate(count_key=F(count_by))
    boxes_sql, params = boxes.values("box", *(["count_key"] if count_by else [])).query.sql_with_params()
    counts_by = (
        """, (SELECT COALESCE(json_agg(json_build_object('value', count_key, 'count', n, 'located_count', l)
                                ORDER BY n DESC, count_key), '[]')
             FROM (SELECT count_key, count(*) AS n, count(box) AS l FROM boxes GROUP BY count_key) g)"""
        if count_by
        else ""
    )
    low, high = FIT_BOUNDS_QUANTILE, 1 - FIT_BOUNDS_QUANTILE
    cx = "(ST_XMin(box) + ST_XMax(box)) / 2"
    cy = "(ST_YMin(box) + ST_YMax(box)) / 2"
    query = f"""
        WITH boxes AS MATERIALIZED ({boxes_sql}),
        q AS (
            SELECT percentile_cont({low}) WITHIN GROUP (ORDER BY {cx}) AS x0,
                   percentile_cont({high}) WITHIN GROUP (ORDER BY {cx}) AS x1,
                   percentile_cont({low}) WITHIN GROUP (ORDER BY {cy}) AS y0,
                   percentile_cont({high}) WITHIN GROUP (ORDER BY {cy}) AS y1
            FROM boxes WHERE box IS NOT NULL
        ),
        w AS (
            SELECT x0 - (x1 - x0) * {FIT_BOUNDS_MARGIN} AS west, x1 + (x1 - x0) * {FIT_BOUNDS_MARGIN} AS east,
                   y0 - (y1 - y0) * {FIT_BOUNDS_MARGIN} AS south, y1 + (y1 - y0) * {FIT_BOUNDS_MARGIN} AS north
            FROM q
        ),
        flagged AS (
            SELECT box, {cx} BETWEEN west AND east AND {cy} BETWEEN south AND north AS inside FROM boxes, w
        )
        SELECT count(*), count(box), ST_Extent(box), ST_Extent(box) FILTER (WHERE inside),
               count(box) FILTER (WHERE NOT inside){counts_by}
        FROM flagged"""
    with settings_cursor(**QUERY_SETTINGS) as cursor:
        cursor.execute(query, params)
        count, located_count, extent, fit_extent, outside, *by = cursor.fetchone()
    result = {
        "count": count,
        "located_count": located_count,
        "bounds": _box_bounds(extent),
        "fit_bounds": _box_bounds(fit_extent),
        "outside_fit_bounds": outside or 0,
    }
    if count_by:
        # a json column: psycopg2 decodes it
        result["counts_by"] = by[0]
    return result


def _box_bounds(box: Optional[str]) -> Optional[list]:
    """`BOX(west south,east north)` (postgres' text of a box2d) as TileJSON bounds, within web mercator."""
    if box is None:
        return None
    west, south, east, north = (float(n) for n in box[4:-1].replace(",", " ").split())
    return [west, max(south, -MAX_MERCATOR_LATITUDE), east, min(north, MAX_MERCATOR_LATITUDE)]
