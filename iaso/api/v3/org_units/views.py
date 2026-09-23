import logging
import tempfile

from time import gmtime, strftime

from django.conf import settings
from django.db.models import F, Func, IntegerField, Max, Q
from django.http import HttpResponse, StreamingHttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import filters, permissions
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework_csv.renderers import CSVRenderer

from hat.api.export_utils import Echo, generate_xlsx, iter_items
from iaso.api.common import CONTENT_TYPE_CSV, CONTENT_TYPE_XLSX
from iaso.api.permission_checks import AuthenticationEnforcedPermission
from iaso.api.v3.common.dynamic_fields import KeyedColumns, PositionalColumns, tabular_columns, tabular_values
from iaso.api.v3.common.errors import bad_request
from iaso.api.v3.common.pagination import V3PagePagination
from iaso.api.v3.common.renderers import ParquetRenderer, XLSXRenderer
from iaso.api.v3.common.views import BaseV3ReadOnlyViewSet
from iaso.exports import CleaningFileResponse, parquet
from iaso.models import Group, OrgUnit

from .filters import OrgUnitFilterSetV3
from .serializers import OrgUnitSerializerV3


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
    """

    permission_classes = [AuthenticationEnforcedPermission, permissions.IsAuthenticated]
    serializer_class = OrgUnitSerializerV3
    pagination_class = V3PagePagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
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
