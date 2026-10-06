import logging
import tempfile

from time import gmtime, strftime

from django.conf import settings
from django.db.models import F, Func, IntegerField, Max
from django.http import HttpResponse, StreamingHttpResponse
from django.urls import reverse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import filters, permissions
from rest_framework.decorators import action
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.response import Response
from rest_framework_csv.renderers import CSVRenderer

from hat.api.export_utils import Echo, generate_xlsx, iter_items
from iaso.api.common import CONTENT_TYPE_CSV, CONTENT_TYPE_XLSX
from iaso.api.org_unit_search import apply_org_unit_search
from iaso.api.permission_checks import AuthenticationEnforcedPermission
from iaso.api.v3.common.dynamic_fields import KeyedColumns, PositionalColumns, tabular_columns, tabular_values
from iaso.api.v3.common.errors import bad_request
from iaso.api.v3.common.mvt import (
    CLUSTER_MAX_ZOOM,
    COLLAPSED_SHAPE_PX,
    MAX_CLUSTER_PX,
    MAX_TILE_FEATURES,
    MVT_MEDIA_TYPE,
    POINT_COUNT_COLUMN,
    TILE_CACHE_MAX_AGE,
    TILE_META_LAYER,
    FirstRendererNegotiation,
    MVTRenderer,
    Tile,
    render_tile,
    set_tile_cache_headers,
    summary,
    tile_fields,
    tile_properties,
    tile_queryset,
    tilejson,
    validated_cluster_px,
)
from iaso.api.v3.common.pagination import V3PagePagination
from iaso.api.v3.common.renderers import ParquetRenderer, XLSXRenderer
from iaso.api.v3.common.views import BaseV3ReadOnlyViewSet, V3FilterBackend
from iaso.exports import CleaningFileResponse, parquet
from iaso.models import Group, OrgUnit

from .expressions import GEOGRAPHY_COLUMNS, drawn_geometry, extent_geometry
from .filters import OrgUnitFilterSetV3
from .serializers import OrgUnitSerializerV3, OrgUnitTileFeatureSerializerV3, TileJSONSerializerV3


logger = logging.getLogger(__name__)

ORDERING_FIELDS = [
    "id",
    "name",
    "created_at",
    "updated_at",
    "opening_date",
    "closed_date",
    "validation_status",
]

#: allowlist of `extra_fields` for `format=parquet`, mirrors the legacy `/api/orgunits/?parquet=` endpoint
#: (`iaso/api/org_units.py`), reusing the same `iaso.exports.parquet.build_pyramid_queryset` machinery.
PARQUET_EXTRA_FIELDS = [
    "geom_geojson",
    "location_geojson",
    "simplified_geom_geojson",
    "biggest_polygon_geojson",
    "groups_exploded",
    "groups_exploded_code",
    "groups_json",
    ":all",
]

#: view-level query params handled in `OrgUnitViewSetV3` itself (filters are documented from their `help_text`).
EXTRA_PARAMETERS = [
    OpenApiParameter(
        name="search",
        type=OpenApiTypes.STR,
        description="Case-insensitive search across name and aliases, or `ids:1,2`, `refs:a,b`, `codes:x,y` (as the org unit search)",
    ),
    OpenApiParameter(
        name="default_version",
        type=OpenApiTypes.BOOL,
        description="If true, restrict to the requesting user's account's default source version",
    ),
    OpenApiParameter(
        name="roots_for_user",
        type=OpenApiTypes.BOOL,
        description="If true, only return the root org unit(s) visible to the requesting user",
    ),
    OpenApiParameter(
        name="extra_fields",
        type=OpenApiTypes.STR,
        description=f"format=parquet only. Comma-separated extra geometry columns. Allowed: {', '.join(PARQUET_EXTRA_FIELDS)}",
    ),
]


#: the view-level params that also apply to tiles (`extra_fields` is parquet only)
TILE_EXTRA_PARAMETERS = [
    *(parameter for parameter in EXTRA_PARAMETERS if parameter.name != "extra_fields"),
    OpenApiParameter(
        name="cache_key",
        type=OpenApiTypes.STR,
        description=(
            f"Any value: lets the browser reuse the tile for up to {TILE_CACHE_MAX_AGE // 60} minutes instead of "
            "revalidating it. Change it (so the tile url) whenever the org units may have changed."
        ),
    ),
    OpenApiParameter(
        name="cluster",
        type=OpenApiTypes.INT,
        description=(
            f"1 to {MAX_CLUSTER_PX}: below zoom {CLUSTER_MAX_ZOOM}, group the points by squares of that many "
            f"screen pixels - one feature per square, with a `{POINT_COUNT_COLUMN}` property and no id when it "
            f"stands for several org units (a lone point stays itself). Shapes smaller than {COLLAPSED_SHAPE_PX} "
            "pixels are drawn as points, so they are clustered too. A small value (1-2) only thins the points a "
            "screen can't tell apart; a large one (40-60) makes clusters."
        ),
    ),
]
TILE_PATH_PARAMETERS = [
    OpenApiParameter(name=name, type=OpenApiTypes.INT, location=OpenApiParameter.PATH, description=description)
    for name, description in (("z", "Zoom level, 0-24"), ("x", "Tile column, 0..2^z-1"), ("y", "Tile row, 0..2^z-1"))
]
#: name of the tile layer, the `source-layer` of a MapLibre style
TILE_LAYER = "org_units"


def _values_as_row(values, **kwargs):
    """`get_row` for `hat.api.export_utils`: rows are already flattened by `tabular_values`."""
    return values


@extend_schema(tags=["Org units", "v3"])
class OrgUnitViewSetV3(BaseV3ReadOnlyViewSet):
    """Org units API (v3)

    Read-only, `django-filter`-style companion to `/api/orgunits/`: strict query-param validation (unknown
    params -> 400 with suggestions), a `fields=` sub-selector, opt-in geometry, and exports that bypass
    pagination. Writes stay on `/api/orgunits/`.

    GET /api/v3/orgunits/
    GET /api/v3/orgunits/<id>/
    GET /api/v3/orgunits/tiles/<z>/<x>/<y>/
    """

    permission_classes = [AuthenticationEnforcedPermission, permissions.IsAuthenticated]
    serializer_class = OrgUnitSerializerV3
    pagination_class = V3PagePagination
    filter_backends = [V3FilterBackend, filters.OrderingFilter]
    #: query params only the tiles take (on top of the FilterSet's)
    action_params = {"tiles": frozenset({"cache_key", "cluster"}), "tilejson": frozenset({"cache_key", "cluster"})}
    filterset_class = OrgUnitFilterSetV3
    extra_parameters = EXTRA_PARAMETERS
    ordering_fields = ORDERING_FIELDS
    ordering_help = (
        "`name` has no database index: ordering by it forces a full unindexed sort on every request, "
        "so only pass order=name if you need it and can accept that cost."
    )
    # `id`, not `name`: `name` has no database index, so sorting by it (with no LIMIT, e.g. an export)
    # forces a full unindexed sort before the first row can be returned.
    ordering = ["id"]
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer, CSVRenderer, XLSXRenderer, ParquetRenderer]
    http_method_names = ["get", "options", "head", "trace"]
    documented_formats = frozenset({"json", "csv", "xlsx", "parquet"})
    #: actions whose `fields=` is documented by `V3AutoSchema` (on top of list/retrieve)
    field_selector_actions = frozenset({"tiles", "tilejson"})

    def get_serializer_class(self):
        if self.action in ("tiles", "tilejson"):
            return OrgUnitTileFeatureSerializerV3
        return super().get_serializer_class()

    def get_queryset(self):
        # No `select_related`/`defer` here: `optimize_for()` only joins, prefetches and loads what `fields=`
        # asked for.
        queryset = OrgUnit.objects.filter_for_user(self.request.user)

        search = self.request.query_params.get("search")
        if search:
            # The org unit search's: `ids:1,2`, `refs:a,b`, `codes:x,y` or else name/alias. Case-insensitive only,
            # not accent-insensitive for now (see name__icontains in filters.py - same tradeoff, deferred to avoid
            # a migration for the `unaccent` postgres extension).
            try:
                queryset = apply_org_unit_search(queryset, search)
            except ValueError:  # `ids:` with something else than ids
                raise bad_request(f"Invalid search {search!r}", "`ids:` takes comma-separated org unit ids.")

        if str(self.request.query_params.get("default_version", "")).lower() == "true":
            profile = getattr(self.request.user, "iaso_profile", None)
            if profile is not None and profile.account.default_version_id is not None:
                queryset = queryset.filter(version_id=profile.account.default_version_id)

        if str(self.request.query_params.get("roots_for_user", "")).lower() == "true":
            profile = getattr(self.request.user, "iaso_profile", None)
            user_org_units = profile.org_units.all() if profile is not None else OrgUnit.objects.none()
            if user_org_units and not self.request.user.is_superuser:
                queryset = queryset.filter(id__in=user_org_units)
            else:
                queryset = queryset.filter(parent__isnull=True)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        field_tree = self.get_field_tree(request)

        export_format = request.accepted_renderer.format
        if export_format in ("csv", "xlsx"):
            return self._export(queryset, field_tree, file_format=export_format)
        if export_format == "parquet":
            return self._export_parquet(request, queryset)
        return self.paginated_list(queryset, field_tree)

    @extend_schema(
        summary="Org units as Mapbox Vector Tiles",
        description=(
            "One `org_units` layer: the org units overlapping tile `z/x/y`, drawn as their location, else their "
            "simplified shape, else their shape. Takes every filter of the list endpoint (e.g. "
            "`version_id`, `org_unit_type_id`, `parent_id`, `roots_for_user=true`, "
            "`ancestor_id__closest_located`) and `fields=` for the feature properties. The MVT feature id is "
            "the org unit id. An empty body is an empty tile. Errors are JSON. "
            f"A tile holds at most {MAX_TILE_FEATURES} features: a cut tile has an extra `{TILE_META_LAYER}` layer, "
            "one feature with `feature_count` (how many it should have held) and `kept`. A tile taking too long "
            "is a 503."
        ),
        parameters=[*TILE_PATH_PARAMETERS, *TILE_EXTRA_PARAMETERS],
        filters=True,
        responses={(200, MVT_MEDIA_TYPE): OpenApiTypes.BINARY},
    )
    @action(
        detail=False,
        url_path=r"tiles/(?P<z>[0-9]+)/(?P<x>[0-9]+)/(?P<y>[0-9]+)",
        renderer_classes=[MVTRenderer],
        content_negotiation_class=FirstRendererNegotiation,
        documented_formats=frozenset({"mvt"}),
    )
    def tiles(self, request, z, x, y):
        """Built like `list()` - same scoping, same FilterSet - then encoded by postgres (see
        `iaso.api.v3.common.mvt`): nothing but the tile bytes goes through python."""
        tile = Tile.validated(z, x, y)
        cluster_px = validated_cluster_px(request.query_params.get("cluster"))
        queryset, serializer = self._tile_source(request)
        values = tile_queryset(
            queryset,
            drawn_geometry(tile, collapse_px=COLLAPSED_SHAPE_PX if cluster_px else None),
            tile_properties(serializer),
            tile,
            geography_columns=GEOGRAPHY_COLUMNS,
            # a collapsed shape is a point inside the shape: the shape tells which tiles may hold it
            filter_geometry=drawn_geometry(tile) if cluster_px else None,
        )
        response = HttpResponse(render_tile(values, TILE_LAYER, tile, cluster_px), content_type=MVT_MEDIA_TYPE)
        set_tile_cache_headers(response, request.query_params.get("cache_key"))
        return response

    @extend_schema(
        summary="TileJSON of the org unit vector tiles",
        description=(
            "Describes the tiles of `tiles/{z}/{x}/{y}/` for the same query params, so a map client can use them on "
            "their own: the tile url (those params included), the zoom range, the feature properties and `bounds`, "
            "the extent of the matching org units (left out when none is located), which MapLibre uses to skip the "
            "tiles outside. Pass it as a vector source's `url`. On top of TileJSON: `count` and `located_count` "
            "(how many org units match, how many are on the map), and `fit_bounds`, where to look: the extent "
            "without the far outliers (e.g. a village geolocated on another continent), `outside_fit_bounds` of "
            "them left out."
        ),
        parameters=TILE_EXTRA_PARAMETERS,
        filters=True,
        responses=TileJSONSerializerV3,
    )
    @action(detail=False, url_path="tilejson", renderer_classes=[JSONRenderer])
    def tilejson(self, request):
        validated_cluster_px(request.query_params.get("cluster"))
        queryset, serializer = self._tile_source(request)
        # the tiles url, with every query param of this request (filters, `fields`, `cache_key`)
        tiles_url = request.build_absolute_uri(reverse("orgunits_v3-tiles", kwargs={"z": 0, "x": 0, "y": 0}))
        tiles_url = tiles_url.replace("/0/0/0/", "/{z}/{x}/{y}/")
        if request.GET:
            tiles_url += "?" + request.GET.urlencode(safe=",")
        fields = tile_fields(serializer)
        if "cluster" in request.query_params:
            fields[POINT_COUNT_COLUMN] = "Number of org units of a cluster (only set on clusters, which have no id)"
        about = summary(queryset, extent_geometry())
        document = tilejson(tiles_url, TILE_LAYER, fields, about.pop("bounds"))
        if about["fit_bounds"] is None:
            del about["fit_bounds"]
        response = Response({**document, **about})
        set_tile_cache_headers(response, request.query_params.get("cache_key"))
        return response

    def _tile_source(self, request):
        """The rows and the feature properties of the tiles - also described by their TileJSON."""
        queryset = self.filter_queryset(self.get_queryset())
        if "order" not in request.query_params:
            # the default `id` ordering is only for pagination: a tile would pay a sort for nothing
            queryset = queryset.order_by()
        serializer = self.get_serializer(field_tree=self.get_field_tree(request))
        missing_filter = [
            name for name in serializer.requires_closest_located if name in serializer.fields
        ] and "closest_located_via_id" not in queryset.query.annotations
        if missing_filter:
            raise bad_request(
                "via_id/via_name need the ancestor_id__closest_located filter",
                "They tell which child of that org unit a feature stands in for.",
            )
        return queryset, serializer

    def _export_filename(self, extension: str) -> str:
        profile = getattr(self.request.user, "iaso_profile", None)
        account_name = profile.account.name if profile else ""
        timestamp = strftime("%Y-%m-%d-%H-%M", gmtime())
        return f"{settings.ENVIRONMENT}-{account_name}-org_units-{timestamp}.{extension}"

    def _tabular_layout(self, queryset, serializer) -> dict:
        """How list-of-object fields are spread over csv/xlsx columns - each needs one query over the whole
        export upfront, so every row gets the same columns."""
        layout = {}
        if "ancestors" in serializer.fields:
            depth = Func(F("path"), function="nlevel", output_field=IntegerField())
            max_depth = queryset.aggregate(max_depth=Max(depth))["max_depth"] or 0
            layout["ancestors"] = PositionalColumns(count=max(max_depth - 1, 0))
        if "groups" in serializer.fields:
            group_ids = Group.objects.filter(org_units__in=queryset).values_list("id", flat=True).distinct()
            layout["groups"] = KeyedColumns(label="group", keys=group_ids)
        return layout

    def _export(self, queryset, field_tree, file_format: str):
        """`format=csv`/`format=xlsx`: the same serializer as the JSON response, over the whole filtered
        queryset (no pagination) in chunks, each row flattened into columns - see `tabular_columns`."""
        serializer = self.get_serializer(field_tree=field_tree)
        layout = self._tabular_layout(queryset, serializer)
        columns = [{"title": title, "width": 20} for title in tabular_columns(serializer, layout)]
        rows = (
            tabular_values(row, serializer, layout)
            for row in self.serialize_in_chunks(self.optimize_for(queryset, field_tree), field_tree)
        )

        filename = self._export_filename(file_format)
        if file_format == "xlsx":
            return HttpResponse(
                generate_xlsx("Org units", columns, rows, _values_as_row),
                content_type=CONTENT_TYPE_XLSX,
                headers={"Content-Disposition": f"attachment; filename={filename}"},
            )
        return StreamingHttpResponse(
            streaming_content=iter_items(rows, Echo(), columns, _values_as_row),
            content_type=CONTENT_TYPE_CSV,
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )

    def _export_parquet(self, request, queryset):
        """`format=parquet`: reuses `iaso.exports.parquet` exactly like the legacy `/api/orgunits/?parquet=`
        endpoint (same DuckDB-backed exporter, same `extra_fields` allowlist)."""
        extra_fields_raw = request.query_params.get("extra_fields", "")
        extra_fields = [f for f in extra_fields_raw.split(",") if f]
        unknown_extra_fields = set(extra_fields) - set(PARQUET_EXTRA_FIELDS)
        if unknown_extra_fields:
            raise bad_request(
                f"Unknown extra_fields for parquet exports: {', '.join(sorted(unknown_extra_fields))}",
                f"Allowed extra_fields: {', '.join(PARQUET_EXTRA_FIELDS)}",
            )

        try:
            export_queryset = parquet.build_pyramid_queryset(queryset, extra_fields)
        except ValueError:
            # the one `ValueError` `build_pyramid_queryset` raises: two group names normalizing to the same
            # `groups_exploded_code` column. Logged rather than echoed, so no exception text reaches the client.
            logger.exception("Parquet export of org units failed for extra_fields=%s", extra_fields)
            raise bad_request(
                "Conflicting group column names for extra_fields=groups_exploded_code",
                "Two or more groups normalize to the same column name - use extra_fields=groups_exploded instead.",
            )

        tmp = tempfile.NamedTemporaryFile(suffix=".parquet", delete=False)
        parquet.export_django_query_to_parquet_via_duckdb(export_queryset, tmp.name)
        filename = self._export_filename("parquet")
        return CleaningFileResponse(tmp.name, as_attachment=True, filename=filename)
