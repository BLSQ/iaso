import json
import tempfile

from time import gmtime, strftime

from django.conf import settings
from django.db.models import BooleanField, ExpressionWrapper, Q
from django.http import HttpResponse, StreamingHttpResponse
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import filters, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.response import Response
from rest_framework_csv.renderers import CSVRenderer

from hat.api.export_utils import Echo, generate_xlsx, iter_items
from iaso.api.common import CONTENT_TYPE_CSV, CONTENT_TYPE_XLSX
from iaso.api.common.views import ReadOnlyModelViewSet
from iaso.api.permission_checks import AuthenticationEnforcedPermission
from iaso.api.v3.common.fields_parser import FieldsParseError, parse_fields
from iaso.api.v3.common.pagination import V3PagePagination
from iaso.api.v3.common.param_validator import suggest_close_matches
from iaso.api.v3.common.renderers import ParquetRenderer, XLSXRenderer
from iaso.exports import CleaningFileResponse, parquet
from iaso.models import OrgUnit

from .filters import OrgUnitFilterSetV3
from .serializers import (
    ANCESTOR_DEFAULT_SUBFIELDS,
    CREATOR_SUBFIELDS,
    DATA_SOURCE_SUBFIELDS,
    DEFAULT_FIELDS,
    GEOMETRY_FIELDS,
    GROUP_FIELDS,
    ORG_UNIT_TYPE_SUBFIELDS,
    PARENT_DEFAULT_SUBFIELDS,
    VERSION_DEFAULT_SUBFIELDS,
    OrgUnitSerializerV3,
    build_export_row_getter,
    build_fields_schema,
    collect_distinct_groups_for_queryset,
    required_row_columns,
    serialize_org_units,
    validate_field_tree,
)


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

V3_ORG_UNIT_PARAMETERS = [
    OpenApiParameter(name="id", type=OpenApiTypes.INT, description="Exact id match"),
    OpenApiParameter(
        name="id__in",
        type=OpenApiTypes.STR,
        description="Comma-separated list of ids - load several org units by id in one request.",
    ),
    OpenApiParameter(name="name", type=OpenApiTypes.STR, description="Exact name match"),
    OpenApiParameter(
        name="name__icontains", type=OpenApiTypes.STR, description="Case-insensitive substring match on name"
    ),
    OpenApiParameter(name="name__startswith", type=OpenApiTypes.STR, description="Name starts with"),
    OpenApiParameter(name="source_ref", type=OpenApiTypes.STR, description="Exact external (DHIS2) reference match"),
    OpenApiParameter(
        name="source_ref__in", type=OpenApiTypes.STR, description="Comma-separated list of source_ref values"
    ),
    OpenApiParameter(name="source_ref__startswith", type=OpenApiTypes.STR, description="source_ref starts with"),
    OpenApiParameter(name="code", type=OpenApiTypes.STR, description="Exact DHIS2 code match"),
    OpenApiParameter(name="code__in", type=OpenApiTypes.STR, description="Comma-separated list of code values"),
    OpenApiParameter(
        name="validation_status",
        type=OpenApiTypes.STR,
        enum=[choice[0] for choice in OrgUnit.VALIDATION_STATUS_CHOICES],
        description="Exact validation status match",
    ),
    OpenApiParameter(
        name="validation_status__in", type=OpenApiTypes.STR, description="Comma-separated list of validation statuses"
    ),
    OpenApiParameter(name="org_unit_type_id", type=OpenApiTypes.INT, description="Exact org unit type id"),
    OpenApiParameter(
        name="parent_id",
        type=OpenApiTypes.INT,
        description=(
            "Exact parent org unit id - only its direct children (one level down), not further "
            "descendants. Equivalent to `ancestor_id__direct_children`; use `ancestor_id` instead for "
            "all descendants at any depth."
        ),
    ),
    OpenApiParameter(name="group_id", type=OpenApiTypes.INT, description="Org units belonging to this group id"),
    OpenApiParameter(
        name="source_id", type=OpenApiTypes.INT, description="Exact data source id (via the org unit's version)"
    ),
    OpenApiParameter(name="version_id", type=OpenApiTypes.INT, description="Exact source version id"),
    OpenApiParameter(
        name="project_id", type=OpenApiTypes.INT, description="Org units whose type is linked to this project id"
    ),
    OpenApiParameter(
        name="org_unit_type__name__icontains",
        type=OpenApiTypes.STR,
        description="Org unit type name contains (case-insensitive)",
    ),
    OpenApiParameter(
        name="org_unit_type__category",
        type=OpenApiTypes.STR,
        description="Exact org unit type category",
    ),
    OpenApiParameter(
        name="parent__name__icontains", type=OpenApiTypes.STR, description="Parent name contains (case-insensitive)"
    ),
    OpenApiParameter(name="parent__source_ref", type=OpenApiTypes.STR, description="Exact parent source_ref match"),
    OpenApiParameter(
        name="created_at__gte", type=OpenApiTypes.DATETIME, description="Created at/after this ISO 8601 datetime"
    ),
    OpenApiParameter(
        name="created_at__lte", type=OpenApiTypes.DATETIME, description="Created at/before this ISO 8601 datetime"
    ),
    OpenApiParameter(
        name="updated_at__gte", type=OpenApiTypes.DATETIME, description="Updated at/after this ISO 8601 datetime"
    ),
    OpenApiParameter(
        name="updated_at__lte", type=OpenApiTypes.DATETIME, description="Updated at/before this ISO 8601 datetime"
    ),
    OpenApiParameter(name="opening_date__gte", type=OpenApiTypes.DATE, description="Opening date on/after this date"),
    OpenApiParameter(name="opening_date__lte", type=OpenApiTypes.DATE, description="Opening date on/before this date"),
    OpenApiParameter(name="closed_date__gte", type=OpenApiTypes.DATE, description="Closed date on/after this date"),
    OpenApiParameter(name="closed_date__lte", type=OpenApiTypes.DATE, description="Closed date on/before this date"),
    OpenApiParameter(name="has_shape", type=OpenApiTypes.BOOL, description="Has a geom or simplified_geom"),
    OpenApiParameter(name="has_location", type=OpenApiTypes.BOOL, description="Has a location (point)"),
    OpenApiParameter(
        name="geom__isnull",
        type=OpenApiTypes.BOOL,
        description="`geom` is null (true) / not null (false). Use `has_shape` instead if geom-or-simplified_geom is enough.",
    ),
    OpenApiParameter(
        name="simplified_geom__isnull",
        type=OpenApiTypes.BOOL,
        description="`simplified_geom` is null (true) / not null (false)",
    ),
    OpenApiParameter(
        name="catchment__isnull", type=OpenApiTypes.BOOL, description="`catchment` is null (true) / not null (false)"
    ),
    OpenApiParameter(
        name="location__isnull",
        type=OpenApiTypes.BOOL,
        description="`location` is null (true) / not null (false). Equivalent to `has_location` with the opposite boolean.",
    ),
    OpenApiParameter(
        name="ancestor_id",
        type=OpenApiTypes.INT,
        description=(
            "All descendants of this org unit id, at any depth (excluding itself) - not just its direct "
            "children. Use `ancestor_id__direct_children` instead to stop at one level down."
        ),
    ),
    OpenApiParameter(
        name="ancestor_id__direct_children",
        type=OpenApiTypes.INT,
        description="Only the direct children (one level down) of this org unit id. Equivalent to `parent_id`.",
    ),
    OpenApiParameter(name="depth", type=OpenApiTypes.INT, description="Exact ltree path depth (1 = root)"),
    OpenApiParameter(
        name="geom__bbox",
        type=OpenApiTypes.STR,
        description="`minx,miny,maxx,maxy` - org units whose `geom` intersects this bounding box",
    ),
    OpenApiParameter(
        name="simplified_geom__bbox",
        type=OpenApiTypes.STR,
        description="Same as `geom__bbox` but against `simplified_geom` (faster, lower precision)",
    ),
    OpenApiParameter(
        name="location__bbox",
        type=OpenApiTypes.STR,
        description="`minx,miny,maxx,maxy` - org units whose `location` point falls in this bounding box",
    ),
    OpenApiParameter(
        name="geom__within_org_unit",
        type=OpenApiTypes.INT,
        description="Org units whose `geom` is contained within the referenced org unit's geometry",
    ),
    OpenApiParameter(
        name="location__within_org_unit",
        type=OpenApiTypes.INT,
        description="Org units whose `location` point falls within the referenced org unit's geometry",
    ),
    OpenApiParameter(
        name="geom__outside_org_unit",
        type=OpenApiTypes.INT,
        description=(
            "Org units that HAVE a `geom` but it's NOT contained within the referenced org unit's "
            'geometry (org units with no `geom` are excluded, not treated as "outside")'
        ),
    ),
    OpenApiParameter(
        name="location__outside_org_unit",
        type=OpenApiTypes.INT,
        description=(
            "Org units that HAVE a `location` but it falls OUTSIDE the referenced org unit's geometry - "
            "typically a data quality check, e.g. a facility whose recorded GPS point falls outside its "
            "own district's shape. Combine with `ancestor_id=<same id>` to scope to that org unit's "
            "descendants specifically."
        ),
    ),
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
        name="fields",
        type=OpenApiTypes.STR,
        description=(
            "Field selector, e.g. `fields=id,name,ancestors(id,name,source_ref)`. Defaults to: "
            + ", ".join(DEFAULT_FIELDS)
            + ". Geometry fields (`geom`, `simplified_geom`, `catchment`), `ancestors(...)`, `parent(...)`,"
            " `org_unit_type`, `creator` and `version(...)` are only returned when explicitly requested. "
            "`groups` returns `[{id, name}, ...]`; request `group_ids` instead for just the bare ids. "
            "`parent(...)` takes the same sub-fields as `ancestors(...)` (it's the same kind of object) "
            "and returns a single `{...}`, not a list. `org_unit_type`/`creator` have a fixed shape "
            "(`{id, name, short_name, category}`/`{id, username, first_name, last_name, email}`, no "
            "sub-selector) and are separate from the always-present `org_unit_type_id`. `version(...)` "
            "defaults to `{id, number, data_source_id}`; request `version(data_source)` to also get a "
            "nested `data_source: {id, name}` (one extra query, opt-in). In format=csv/xlsx, "
            "`org_unit_type`/`parent`/`creator`/`version` are split into `org_unit_type.<subfield>`/"
            "`parent.<subfield>`/`creator.<subfield>`/`version.<subfield>` columns (a spreadsheet can't "
            "hold a nested object in one cell) - `version(data_source)` adds "
            "`version.data_source.<subfield>` columns on top."
        ),
    ),
    OpenApiParameter(
        name="order",
        type=OpenApiTypes.STR,
        description=(
            f"Comma-separated ordering, `-` prefix for descending. Allowed: {', '.join(ORDERING_FIELDS)}. "
            "Default: id (name has no database index, so ordering by it - the default suggested "
            "elsewhere - forces a full unindexed sort on every request; pass order=name yourself if you "
            "need it and can accept that cost)."
        ),
    ),
    OpenApiParameter(
        name="format",
        type=OpenApiTypes.STR,
        enum=["json", "csv", "xlsx", "parquet"],
        description="Response format. Exports (csv/xlsx/parquet) bypass pagination and stream the full filtered result set.",
    ),
    OpenApiParameter(name="page", type=OpenApiTypes.INT, description="Page number (1-indexed). Default: 1"),
    OpenApiParameter(name="page_size", type=OpenApiTypes.INT, description="Page size. Default: 100, max: 10000"),
    OpenApiParameter(
        name="with_count",
        type=OpenApiTypes.BOOL,
        description="If true, compute an exact `count`/`pages` (an extra COUNT(*) query). Default: false (count is null).",
    ),
    OpenApiParameter(
        name="extra_fields",
        type=OpenApiTypes.STR,
        description=f"format=parquet only. Comma-separated extra geometry columns. Allowed: {', '.join(PARQUET_EXTRA_FIELDS)}",
    ),
]

V3_ORG_UNIT_PARAMETERS_BY_NAME = {parameter.name: parameter for parameter in V3_ORG_UNIT_PARAMETERS}


def _flatten_export_cell(value):
    """Tabular exports (csv/xlsx) can't nest: a list becomes a `;`-separated string, and a `{id, name}`
    object (one entry of the default `groups` field) is flattened to just the name. Every other
    non-scalar field (`ancestors(...)`, `org_unit_type`, `parent`) is split into its own columns instead
    of ever reaching this (see `_export`), and geometry fields are handled separately too (raw GeoJSON,
    not through this)."""
    if isinstance(value, list):
        return ";".join(_flatten_export_cell(item) for item in value)
    if isinstance(value, dict):
        return str(value.get("name", value))
    return value


def _export_cell_value(field: str, value):
    """Geometry fields (`geom`/`simplified_geom`/`catchment`) are rendered as raw GeoJSON - the caller
    explicitly asked for the shape, not a lossy flattening of it - everything else goes through
    `_flatten_export_cell`."""
    if field in GEOMETRY_FIELDS:
        return json.dumps(value) if value is not None else None
    return _flatten_export_cell(value)


@extend_schema(tags=["Org units", "v3"])
class OrgUnitViewSetV3(ReadOnlyModelViewSet):
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
    results_key = "results"
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = OrgUnitFilterSetV3
    #: the same `OpenApiParameter` list passed to `@extend_schema` on `list()` below, exposed as a class
    #: attribute so `test_filter_nomenclature.py` can check it against `filterset_class` for every v3
    #: endpoint generically (no per-endpoint registration needed there - just keep this in sync, which the
    #: test enforces).
    documented_parameters = V3_ORG_UNIT_PARAMETERS
    ordering_fields = ORDERING_FIELDS
    # `id` (not `name`, unlike the gist's suggested default) - `name` has no database index, so sorting
    # by it (with no LIMIT, e.g. a csv/xlsx/parquet export) forces a full unindexed sort of every matched
    # row before the first one can be returned. `id` sorts for free off the primary key index.
    ordering = ["id"]
    renderer_classes = [JSONRenderer, BrowsableAPIRenderer, CSVRenderer, XLSXRenderer, ParquetRenderer]
    http_method_names = ["get", "options", "head", "trace"]

    #: advertised in the error message below - deliberately excludes "api" (BrowsableAPIRenderer's format,
    #: still accepted since it's in `renderer_classes`, just not part of the documented contract).
    DOCUMENTED_FORMATS = frozenset({"json", "csv", "xlsx", "parquet"})

    def initial(self, request, *args, **kwargs):
        """DRF's own content negotiation (triggered by `?format=`, before this view's `list()`/`retrieve()`
        even runs) reacts to an unrecognized `format` value by raising a bare `Http404` - "Not Found" is a
        confusing response for "you typoed a query param value". Check it ourselves first and give a
        proper 400 with a suggestion instead."""
        requested_format = request.query_params.get("format")
        valid_formats = {renderer.format for renderer in self.renderer_classes}
        if requested_format and requested_format not in valid_formats:
            suggestions = suggest_close_matches(requested_format, self.DOCUMENTED_FORMATS)
            raise ValidationError(
                {
                    "error": f"Unsupported format: {requested_format!r}",
                    "detail": (
                        f"Allowed values: {', '.join(sorted(self.DOCUMENTED_FORMATS))}."
                        + (f" Did you mean {suggestions[0]!r}?" if suggestions else "")
                    ),
                }
            )
        super().initial(request, *args, **kwargs)

    def get_queryset(self):
        queryset = OrgUnit.objects.filter_for_user(self.request.user)
        # No `select_related` here on purpose: `org_unit_type`/`parent`/`version` are never read as
        # attributes on these rows (only their `_id`, already loaded with no join) - the rich
        # `org_unit_type`/`parent`/`ancestors`/`groups` objects are batch-loaded separately (see
        # serializers.py), only when actually requested via `fields=`. A `select_related` here would add
        # unconditional JOINs to every single request regardless of what was asked for.
        queryset = queryset.defer("geom", "simplified_geom", "catchment")
        has_geo_json = ExpressionWrapper(
            Q(geom__isnull=False) | Q(simplified_geom__isnull=False), output_field=BooleanField()
        )
        queryset = queryset.annotate(has_geo_json=has_geo_json)

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

    def _parse_and_validate_fields(self, request):
        fields_param = request.query_params.get("fields")
        try:
            field_tree = parse_fields(fields_param) if fields_param else None
        except FieldsParseError as e:
            raise ValidationError({"error": "Invalid fields= parameter", "detail": str(e)})
        validate_field_tree(field_tree)
        return field_tree

    @extend_schema(parameters=V3_ORG_UNIT_PARAMETERS)
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        field_tree = self._parse_and_validate_fields(request)

        export_format = request.accepted_renderer.format
        if export_format == "csv":
            return self._export(queryset, field_tree, file_format="csv")
        if export_format == "xlsx":
            return self._export(queryset, field_tree, file_format="xlsx")
        if export_format == "parquet":
            return self._export_parquet(request, queryset)

        page = self.paginate_queryset(queryset)
        if page is not None:
            return self.get_paginated_response(serialize_org_units(page, field_tree))
        return Response({self.results_key: serialize_org_units(queryset, field_tree)})

    @extend_schema(parameters=[V3_ORG_UNIT_PARAMETERS_BY_NAME["fields"]])
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        field_tree = self._parse_and_validate_fields(request)
        return Response(serialize_org_units([instance], field_tree)[0])

    @extend_schema(
        parameters=[],
        summary="Field/sub-field schema for `fields=`",
        description=(
            "Machine-readable description of every field (and relation sub-field) the `fields=` selector "
            "accepts, plus which ones are included by default. A plain `GET` (not an `OPTIONS` request) so "
            "it's reachable straight from a browser address bar - built from the same constants the "
            "`fields=` parser/validator use, so it can't drift out of sync with actual behavior."
        ),
    )
    # NB: this method must NOT be named `schema` - that shadows the ViewSet's own reserved `.schema`
    # attribute (drf-spectacular's AutoSchema instance), breaking schema generation entirely. `url_path`
    # below is what actually controls the URL - it stays `/api/v3/orgunits/schema/`.
    @action(detail=False, methods=["get"], url_path="schema")
    def fields_schema(self, request, *args, **kwargs):
        return Response(build_fields_schema())

    def _export_filename(self, extension: str) -> str:
        profile = getattr(self.request.user, "iaso_profile", None)
        account_name = profile.account.name if profile else ""
        timestamp = strftime("%Y-%m-%d-%H-%M", gmtime())
        return f"{settings.ENVIRONMENT}-{account_name}-org_units-{timestamp}.{extension}"

    def _export(self, queryset, field_tree, file_format: str):
        """`format=csv`/`format=xlsx`: reuses `hat/api/export_utils.py`, the same helpers the legacy
        `/api/orgunits/` endpoint uses. Bypasses pagination - the whole filtered queryset is streamed, and
        every relational field (`geom`/`simplified_geom`/`catchment`, `groups`/`group_ids`,
        `ancestors(...)`, `org_unit_type`, `parent`, `creator`, `version`) is batched ONCE against the
        whole queryset upfront via `build_export_row_getter` rather than per row - see that function's
        docstring for why calling `serialize_org_units` once per row (as an earlier version of this did)
        would be an N+1.

        A spreadsheet can't nest, so every non-scalar field is split into its own columns rather than
        stuffed into one cell: `aliases`/`group_ids` (lists of scalars) are `;`-joined into one column,
        `org_unit_type`/`parent`/`creator`/`version` (single objects) become `org_unit_type.<subfield>`/
        `parent.<subfield>`/`creator.<subfield>`/`version.<subfield>` columns (`version(data_source)` adds
        a further-nested `version.data_source.<subfield>` set), `ancestors(...)` (a positional list -
        level 0 always means "root") becomes one `ancestors[i].<subfield>` column per level up to the
        deepest matched org unit, and `groups` (an *unordered membership set* - "group 0" doesn't mean the
        same thing from one row to the next) becomes one `group-<id>.id`/`group-<id>.name` column pair
        per distinct group referenced anywhere in the export, populated only for the rows that actually
        belong to that group."""
        all_fields = list(field_tree.keys()) if field_tree else list(DEFAULT_FIELDS)
        # Preserve any requested sub-selector (e.g. `ancestors(id,name)`) instead of resetting it to
        # "use the defaults".
        ancestor_subfields_tree = (field_tree or {}).get("ancestors") if "ancestors" in all_fields else None
        parent_subfields_tree = (field_tree or {}).get("parent") if "parent" in all_fields else None
        version_subfields_tree = (field_tree or {}).get("version") if "version" in all_fields else None
        include_org_unit_type = "org_unit_type" in all_fields
        include_creator = "creator" in all_fields
        include_groups = "groups" in all_fields

        # `org_unit_type`/`parent`/`creator`/`version`/`groups` are split into their own columns below, so
        # - like `ancestors` - they're excluded from the flat, one-column-per-field loop. `group_ids` is
        # unaffected: it stays a single `;`-joined column, same as `aliases`.
        scalar_fields = [
            f for f in all_fields if f not in ("ancestors", "org_unit_type", "parent", "creator", "version", "groups")
        ]
        geometry_fields = [f for f in scalar_fields if f in GEOMETRY_FIELDS]
        # computed from `all_fields`, not `scalar_fields`: `build_export_row_getter` still needs to batch
        # `groups` membership per row even though it's no longer in the flat per-field column loop.
        group_fields = [f for f in all_fields if f in GROUP_FIELDS]
        columns = [{"title": field, "width": 40 if field in GEOMETRY_FIELDS else 20} for field in scalar_fields]

        get_value, max_depth = build_export_row_getter(
            queryset,
            geometry_fields,
            group_fields,
            ancestor_subfields_tree,
            include_org_unit_type=include_org_unit_type,
            parent_subfields=parent_subfields_tree,
            include_creator=include_creator,
            version_subfields=version_subfields_tree,
        )
        # `.values()` instead of iterating full OrgUnit instances: every relational field is already
        # resolved above from separate batch maps (keyed by id/org_unit_type_id/parent_id/creator_id/
        # version_id), so the row itself only ever needs to supply plain columns - skipping full model
        # instantiation (GEOS wrapping, ltree wrapping, datetime parsing into a whole Python object) per
        # row is a meaningful saving once you're streaming an unbounded export instead of one paginated
        # page.
        row_columns = required_row_columns(
            scalar_fields
            + (["org_unit_type"] if include_org_unit_type else [])
            + (["parent"] if parent_subfields_tree is not None else [])
            + (["creator"] if include_creator else [])
            + (["version"] if version_subfields_tree is not None else []),
            include_ancestors=ancestor_subfields_tree is not None,
        )
        row_queryset = queryset.values(*row_columns)

        ancestor_subfields = None
        if "ancestors" in all_fields:
            ancestor_subfields = list(ancestor_subfields_tree or {}) or list(ANCESTOR_DEFAULT_SUBFIELDS)
            columns += [
                {"title": f"ancestors[{i}].{subfield}", "width": 20}
                for i in range(max_depth)
                for subfield in ancestor_subfields
            ]

        org_unit_type_columns = ["id", *ORG_UNIT_TYPE_SUBFIELDS] if include_org_unit_type else None
        if org_unit_type_columns is not None:
            columns += [{"title": f"org_unit_type.{subfield}", "width": 20} for subfield in org_unit_type_columns]

        parent_subfields = None
        if "parent" in all_fields:
            parent_subfields = list(parent_subfields_tree or {}) or list(PARENT_DEFAULT_SUBFIELDS)
            columns += [{"title": f"parent.{subfield}", "width": 20} for subfield in parent_subfields]

        creator_columns = ["id", *CREATOR_SUBFIELDS] if include_creator else None
        if creator_columns is not None:
            columns += [{"title": f"creator.{subfield}", "width": 20} for subfield in creator_columns]

        version_columns = None
        include_version_data_source = False
        if "version" in all_fields:
            requested = list(version_subfields_tree or {}) or list(VERSION_DEFAULT_SUBFIELDS)
            include_version_data_source = "data_source" in requested
            version_columns = [f for f in requested if f != "data_source"]
            columns += [{"title": f"version.{subfield}", "width": 20} for subfield in version_columns]
            if include_version_data_source:
                columns += [
                    {"title": f"version.data_source.{subfield}", "width": 20}
                    for subfield in ("id", *DATA_SOURCE_SUBFIELDS)
                ]

        group_names_by_id = None
        if include_groups:
            group_names_by_id = collect_distinct_groups_for_queryset(queryset)
            for group_id in sorted(group_names_by_id):
                columns.append({"title": f"group-{group_id}.id", "width": 10})
                columns.append({"title": f"group-{group_id}.name", "width": 20})

        def get_row(row, **kwargs):
            # `row` is a `.values()` dict, not an OrgUnit instance - see `row_queryset` above.
            values = [_export_cell_value(field, get_value(row, field)) for field in scalar_fields]
            if ancestor_subfields is not None:
                ancestors = get_value(row, "ancestors")
                for i in range(max_depth):
                    ancestor = ancestors[i] if i < len(ancestors) else None
                    values += [ancestor.get(subfield) if ancestor else None for subfield in ancestor_subfields]
            if org_unit_type_columns is not None:
                org_unit_type = get_value(row, "org_unit_type")
                values += [org_unit_type.get(subfield) if org_unit_type else None for subfield in org_unit_type_columns]
            if parent_subfields is not None:
                parent = get_value(row, "parent")
                values += [parent.get(subfield) if parent else None for subfield in parent_subfields]
            if creator_columns is not None:
                creator = get_value(row, "creator")
                values += [creator.get(subfield) if creator else None for subfield in creator_columns]
            if version_columns is not None:
                version = get_value(row, "version")
                values += [version.get(subfield) if version else None for subfield in version_columns]
                if include_version_data_source:
                    data_source = version.get("data_source") if version else None
                    values += [
                        data_source.get(subfield) if data_source else None
                        for subfield in ("id", *DATA_SOURCE_SUBFIELDS)
                    ]
            # must come last: matches the order `group-<id>.*` columns were appended in, above.
            if group_names_by_id is not None:
                member_group_ids = {group["id"] for group in get_value(row, "groups")}
                for group_id in sorted(group_names_by_id):
                    is_member = group_id in member_group_ids
                    values.append(group_id if is_member else None)
                    values.append(group_names_by_id[group_id] if is_member else None)
            return values

        filename = self._export_filename(file_format)
        if file_format == "xlsx":
            return HttpResponse(
                generate_xlsx("Org units", columns, row_queryset, get_row),
                content_type=CONTENT_TYPE_XLSX,
                headers={"Content-Disposition": f"attachment; filename={filename}"},
            )
        return StreamingHttpResponse(
            streaming_content=iter_items(row_queryset, Echo(), columns, get_row),
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
            raise ValidationError(
                {
                    "error": f"Unknown extra_fields for parquet exports: {', '.join(sorted(unknown_extra_fields))}",
                    "detail": f"Allowed extra_fields: {', '.join(PARQUET_EXTRA_FIELDS)}",
                }
            )

        try:
            export_queryset = parquet.build_pyramid_queryset(queryset, extra_fields)
        except ValueError as e:
            raise ValidationError(str(e))

        tmp = tempfile.NamedTemporaryFile(suffix=".parquet", delete=False)
        parquet.export_django_query_to_parquet_via_duckdb(export_queryset, tmp.name)
        filename = self._export_filename("parquet")
        return CleaningFileResponse(tmp.name, as_attachment=True, filename=filename)
