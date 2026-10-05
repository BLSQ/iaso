import logging
import tempfile

from time import gmtime, strftime

from django.conf import settings
from django.db.models import F, Func, IntegerField, Max, Q
from django.http import HttpResponse, StreamingHttpResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import filters, permissions
from rest_framework.decorators import action
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework_csv.renderers import CSVRenderer

from hat.api.export_utils import Echo, generate_xlsx, iter_items
from iaso.api.common import CONTENT_TYPE_CSV, CONTENT_TYPE_XLSX
from iaso.api.permission_checks import AuthenticationEnforcedPermission
from iaso.api.v3.common.dynamic_fields import KeyedColumns, PositionalColumns, tabular_columns, tabular_values
from iaso.api.v3.common.errors import bad_request
from iaso.api.v3.common.mvt import (
    MVT_MEDIA_TYPE,
    TILE_CACHE_MAX_AGE,
    FirstRendererNegotiation,
    MVTRenderer,
    Tile,
    render_tile,
    set_tile_cache_headers,
    tile_properties,
    tile_queryset,
)
from iaso.api.v3.common.pagination import V3PagePagination
from iaso.api.v3.common.renderers import ParquetRenderer, XLSXRenderer
from iaso.api.v3.common.views import BaseV3ReadOnlyViewSet, V3FilterBackend
from iaso.exports import CleaningFileResponse, parquet
from iaso.models import Group, OrgUnit

from .expressions import GEOGRAPHY_COLUMNS, drawn_geometry
from .filters import OrgUnitFilterSetV3
from .serializers import OrgUnitSerializerV3, OrgUnitTileFeatureSerializerV3


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
        name="search", type=OpenApiTypes.STR, description="Case-insensitive search across name and aliases"
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
    action_params = {"tiles": frozenset({"cache_key"})}
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
    field_selector_actions = frozenset({"tiles"})

    def get_serializer_class(self):
        if self.action == "tiles":
            return OrgUnitTileFeatureSerializerV3
        return super().get_serializer_class()

    def get_queryset(self):
        # No `select_related`/`defer` here: `optimize_for()` only joins, prefetches and loads what `fields=`
        # asked for.
        queryset = OrgUnit.objects.filter_for_user(self.request.user)

        search = self.request.query_params.get("search")
        if search:
            # Case-insensitive only, not accent-insensitive for now (see name__icontains in filters.py -
            # same tradeoff, deferred to avoid a migration for the `unaccent` postgres extension).
            queryset = queryset.filter(Q(name__icontains=search) | Q(aliases__contains=[search]))

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
            "the org unit id. An empty body is an empty tile. Errors are JSON."
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
        queryset = self.filter_queryset(self.get_queryset())
        if "order" not in request.query_params:
            # the default `id` ordering is only for pagination: a tile would pay a sort for nothing
            queryset = queryset.order_by()
        serializer = self.get_serializer(field_tree=self.get_field_tree(request))
        properties = tile_properties(serializer)

        missing_filter = [
            name for name in serializer.requires_closest_located if name in serializer.fields
        ] and "closest_located_via_id" not in queryset.query.annotations
        if missing_filter:
            raise bad_request(
                "via_id/via_name need the ancestor_id__closest_located filter",
                "They tell which child of that org unit a feature stands in for.",
            )

        values = tile_queryset(queryset, drawn_geometry(tile), properties, tile, geography_columns=GEOGRAPHY_COLUMNS)
        response = HttpResponse(render_tile(values, TILE_LAYER), content_type=MVT_MEDIA_TYPE)
        set_tile_cache_headers(response, request.query_params.get("cache_key"))
        return response

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
