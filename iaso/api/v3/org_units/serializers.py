"""Response shaping for `/api/v3/orgunits/`.

Field selection is dynamic (driven by the `fields=` query param, see
`iaso.api.v3.common.fields_parser.parse_fields`), which doesn't fit a static `ModelSerializer` well.
`OrgUnitSerializerV3`/`AncestorSerializerV3` below exist only to give drf-spectacular a concrete response
schema to document; the actual runtime shaping happens in `serialize_org_units()`.
"""

from collections import defaultdict
from typing import Callable, Dict, List, Optional, Tuple

from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from iaso.models import DataSource, Group, OrgUnit, OrgUnitType, SourceVersion
from iaso.utils import geojson_queryset


DEFAULT_FIELDS = (
    "id",
    "name",
    "uuid",
    "validation_status",
    "parent_id",
    "source_ref",
    "code",
    "aliases",
    "opening_date",
    "closed_date",
    "created_at",
    "updated_at",
    "has_geo_json",
    "latitude",
    "longitude",
    "altitude",
    "org_unit_type_id",
    "groups",
    "depth",
)
GEOMETRY_FIELDS = ("geom", "simplified_geom", "catchment")
#: `group_ids` isn't in DEFAULT_FIELDS (use `groups` for the full {id, name} objects) but stays available
#: as a lighter opt-in alternative for consumers who only need the ids.
GROUP_FIELDS = ("groups", "group_ids")
ANCESTOR_DEFAULT_SUBFIELDS = ("id", "name", "source_ref", "org_unit_type_id")
ANCESTOR_ALLOWED_SUBFIELDS = frozenset(
    {"id", "name", "source_ref", "org_unit_type_id", "validation_status", "parent_id"}
)
#: `parent` is shaped exactly like one `ancestors(...)` entry (it's the same kind of object - an OrgUnit
#: summary), so it reuses the same sub-field allowlist/defaults instead of declaring its own.
PARENT_DEFAULT_SUBFIELDS = ANCESTOR_DEFAULT_SUBFIELDS
PARENT_ALLOWED_SUBFIELDS = ANCESTOR_ALLOWED_SUBFIELDS
#: `org_unit_type` has a fixed shape (no sub-selector, unlike `ancestors`/`parent`) - it's a small enough
#: lookup table that there's no real "only fetch what I asked for" benefit to supporting one.
ORG_UNIT_TYPE_SUBFIELDS = ("name", "short_name", "category")
#: `creator` (the `auth.User` who created the org unit) is fixed-shape too, same rationale as
#: `org_unit_type` - a user record is small and there's no real sub-selector benefit.
CREATOR_SUBFIELDS = ("username", "first_name", "last_name", "email")
#: `version` *does* support a sub-selector (unlike `org_unit_type`/`creator`) because `data_source` is a
#: second hop (`OrgUnit -> SourceVersion -> DataSource`) with its own extra query - opt-in, not fetched by
#: default. `id`/`number`/`data_source_id` are direct `SourceVersion` columns, no extra query either way.
VERSION_DEFAULT_SUBFIELDS = ("id", "number", "data_source_id")
VERSION_ALLOWED_SUBFIELDS = frozenset({"id", "number", "data_source_id", "data_source"})
#: fixed shape, no further nesting - `version(data_source)` stops at `{id, name}` for the data source.
DATA_SOURCE_SUBFIELDS = ("name",)
ALLOWED_TOP_LEVEL_FIELDS = (
    frozenset(DEFAULT_FIELDS)
    | frozenset(GEOMETRY_FIELDS)
    | frozenset(GROUP_FIELDS)
    | {"ancestors", "parent", "org_unit_type", "creator", "version"}
)


def build_fields_schema() -> dict:
    """Machine-readable description of the `fields=` grammar, returned from `GET /api/v3/orgunits/schema/`
    (see `OrgUnitViewSetV3.schema()`). Built directly from the same constants `validate_field_tree()` and
    the row-shaping code below use, so it can't drift from what `fields=` actually accepts."""
    fields: Dict[str, dict] = {name: {"default": True} for name in DEFAULT_FIELDS}
    fields["groups"]["shape"] = "[{id, name}, ...]"
    fields["group_ids"] = {"default": False, "shape": "[id, ...]", "note": "lighter alternative to groups"}
    for geometry_field in GEOMETRY_FIELDS:
        fields[geometry_field] = {"default": False, "shape": "GeoJSON"}
    fields["ancestors"] = {
        "default": False,
        "many": True,
        "sub_selector": True,
        "default_subfields": list(ANCESTOR_DEFAULT_SUBFIELDS),
        "allowed_subfields": sorted(ANCESTOR_ALLOWED_SUBFIELDS),
    }
    fields["parent"] = {
        "default": False,
        "many": False,
        "sub_selector": True,
        "note": "same shape as one ancestors(...) entry",
        "default_subfields": list(PARENT_DEFAULT_SUBFIELDS),
        "allowed_subfields": sorted(PARENT_ALLOWED_SUBFIELDS),
    }
    fields["org_unit_type"] = {
        "default": False,
        "sub_selector": False,
        "fixed_subfields": list(ORG_UNIT_TYPE_SUBFIELDS),
    }
    fields["creator"] = {
        "default": False,
        "sub_selector": False,
        "nullable": True,
        "fixed_subfields": list(CREATOR_SUBFIELDS),
    }
    fields["version"] = {
        "default": False,
        "sub_selector": True,
        "default_subfields": list(VERSION_DEFAULT_SUBFIELDS),
        "allowed_subfields": sorted(VERSION_ALLOWED_SUBFIELDS),
        "nested": {"data_source": {"fixed_subfields": list(DATA_SOURCE_SUBFIELDS)}},
    }
    assert set(fields) == ALLOWED_TOP_LEVEL_FIELDS, "build_fields_schema() drifted from ALLOWED_TOP_LEVEL_FIELDS"
    return {"default_fields": list(DEFAULT_FIELDS), "fields": fields}


class AncestorSerializerV3(serializers.Serializer):
    """Every sub-field that can be requested via `ancestors(...)` - only the requested ones are actually
    returned at runtime."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    source_ref = serializers.CharField(allow_null=True)
    org_unit_type_id = serializers.IntegerField(allow_null=True)
    validation_status = serializers.CharField()
    parent_id = serializers.IntegerField(allow_null=True)


class GroupSerializerV3(serializers.Serializer):
    """One entry of the default `groups` field. Request `group_ids` instead for just the bare ids."""

    id = serializers.IntegerField()
    name = serializers.CharField()


class OrgUnitTypeSummarySerializerV3(serializers.Serializer):
    """The `org_unit_type` field - fixed shape, no sub-selector."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    short_name = serializers.CharField()
    category = serializers.CharField(allow_null=True)


class CreatorSummarySerializerV3(serializers.Serializer):
    """The `creator` field - fixed shape, no sub-selector. `null` for org units with no recorded creator."""

    id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField(allow_blank=True)
    last_name = serializers.CharField(allow_blank=True)
    email = serializers.CharField(allow_blank=True)


class DataSourceSummarySerializerV3(serializers.Serializer):
    """One entry requested via `version(data_source)` - fixed shape, no further nesting."""

    id = serializers.IntegerField()
    name = serializers.CharField()


class VersionSummarySerializerV3(serializers.Serializer):
    """The `version` field. `data_source` is only present when `version(data_source)` was requested - it's
    a second hop (`SourceVersion -> DataSource`) with its own extra query, unlike `id`/`number`/
    `data_source_id`."""

    id = serializers.IntegerField()
    number = serializers.IntegerField()
    data_source_id = serializers.IntegerField(allow_null=True)
    data_source = DataSourceSummarySerializerV3(required=False, allow_null=True)


class OrgUnitSerializerV3(serializers.Serializer):
    """Documents the *default* response shape of `/api/v3/orgunits/`. `fields=` can narrow this down to a
    subset, plus opt-in `geom`/`simplified_geom`/`catchment` (GeoJSON) and `ancestors(...)`."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    uuid = serializers.CharField(allow_null=True)
    validation_status = serializers.CharField()
    parent_id = serializers.IntegerField(allow_null=True)
    source_ref = serializers.CharField(allow_null=True)
    code = serializers.CharField(allow_blank=True)
    aliases = serializers.ListField(child=serializers.CharField())
    opening_date = serializers.DateField(allow_null=True)
    closed_date = serializers.DateField(allow_null=True)
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    has_geo_json = serializers.BooleanField()
    latitude = serializers.FloatField(allow_null=True)
    longitude = serializers.FloatField(allow_null=True)
    altitude = serializers.FloatField(allow_null=True)
    org_unit_type_id = serializers.IntegerField(allow_null=True)
    depth = serializers.IntegerField(
        allow_null=True, help_text="ltree path depth, root = 1 - matches the `depth` filter"
    )
    groups = GroupSerializerV3(many=True)
    group_ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    geom = serializers.JSONField(required=False)
    simplified_geom = serializers.JSONField(required=False)
    catchment = serializers.JSONField(required=False)
    ancestors = AncestorSerializerV3(many=True, required=False)
    org_unit_type = OrgUnitTypeSummarySerializerV3(required=False)
    parent = AncestorSerializerV3(required=False, help_text="Same shape as one `ancestors(...)` entry")
    creator = CreatorSummarySerializerV3(required=False, allow_null=True)
    version = VersionSummarySerializerV3(required=False, allow_null=True)


def _reject_fixed_shape_sub_selector(field_tree: Dict[str, dict], field: str, subfields: tuple) -> None:
    """`org_unit_type`/`creator` always return the same fixed set of sub-fields (unlike `ancestors`/
    `parent`) - raise if the caller tried `field(...)` anyway, instead of silently ignoring what they
    asked for."""
    requested_subfields = field_tree.get(field)
    if requested_subfields:
        raise ValidationError(
            {
                "error": f"{field} doesn't support a sub-selector",
                "detail": (
                    f"{field} always returns {{id, {', '.join(subfields)}}} - request `{field}` (no "
                    f"parentheses), not `{field}({','.join(requested_subfields)})`."
                ),
            }
        )


def _reject_unknown_subfields(field_tree: Dict[str, dict], field: str, allowed_subfields) -> Optional[dict]:
    """Raise a 400 if `field(...)` referenced a sub-field outside `allowed_subfields`. Returns whatever
    was requested for `field` (possibly `None`/`{}`), so callers can inspect it further (see `version`'s
    `data_source` handling below)."""
    requested = field_tree.get(field)
    if requested:
        unknown = sorted(set(requested) - allowed_subfields)
        if unknown:
            raise ValidationError(
                {
                    "error": f"Unknown {field}(...) sub-field(s): {', '.join(unknown)}",
                    "detail": f"Allowed {field}(...) sub-fields: {', '.join(sorted(allowed_subfields))}",
                }
            )
    return requested


def validate_field_tree(field_tree: Optional[Dict[str, dict]]) -> None:
    """Raise a 400 if `fields=` referenced an unknown top-level field or an unknown/unsupported
    sub-field."""
    if field_tree is None:
        return
    unknown_top = sorted(set(field_tree) - ALLOWED_TOP_LEVEL_FIELDS)
    if unknown_top:
        raise ValidationError(
            {
                "error": f"Unknown field(s) in fields=: {', '.join(unknown_top)}",
                "detail": f"Allowed fields: {', '.join(sorted(ALLOWED_TOP_LEVEL_FIELDS))}",
            }
        )
    _reject_unknown_subfields(field_tree, "ancestors", ANCESTOR_ALLOWED_SUBFIELDS)
    _reject_unknown_subfields(field_tree, "parent", PARENT_ALLOWED_SUBFIELDS)
    _reject_fixed_shape_sub_selector(field_tree, "org_unit_type", ORG_UNIT_TYPE_SUBFIELDS)
    _reject_fixed_shape_sub_selector(field_tree, "creator", CREATOR_SUBFIELDS)

    version_subfields = _reject_unknown_subfields(field_tree, "version", VERSION_ALLOWED_SUBFIELDS)
    if version_subfields and version_subfields.get("data_source"):
        raise ValidationError(
            {
                "error": "version(data_source) doesn't support a further sub-selector",
                "detail": (
                    f"data_source always returns {{id, {', '.join(DATA_SOURCE_SUBFIELDS)}}} - request "
                    "version(data_source), not "
                    f"version(data_source({','.join(version_subfields['data_source'])}))."
                ),
            }
        )


def serialize_org_units(org_units, field_tree: Optional[Dict[str, dict]]) -> List[dict]:
    """Build the list of response dicts for a page (or export batch) of `OrgUnit` instances.

    `field_tree` is the parsed `fields=` selector (or `None` for the default field set). Geometry fields,
    `ancestors`, `parent`, `org_unit_type`, `creator` and `version` are only computed when requested, each
    in a single batched query for the whole `org_units` collection - no N+1 regardless of page size or
    tree depth.
    """
    org_units = list(org_units)

    if field_tree is None:
        scalar_fields = list(DEFAULT_FIELDS)
        ancestor_subfields = None
        parent_subfields = None
        version_subfields = None
    else:
        ancestor_subfields = field_tree.get("ancestors")
        parent_subfields = field_tree.get("parent")
        version_subfields = field_tree.get("version")
        scalar_fields = [f for f in field_tree if f not in ("ancestors", "parent", "version")]

    geometry_fields = [f for f in scalar_fields if f in GEOMETRY_FIELDS]
    group_fields = [f for f in scalar_fields if f in GROUP_FIELDS]
    include_org_unit_type = "org_unit_type" in scalar_fields
    include_creator = "creator" in scalar_fields
    plain_fields = [
        f
        for f in scalar_fields
        if f not in GEOMETRY_FIELDS and f not in GROUP_FIELDS and f not in ("org_unit_type", "creator")
    ]

    geometry_maps = {field: _batch_geojson(org_units, field) for field in geometry_fields}
    group_maps: Dict[str, Dict[int, list]] = {field: _BATCH_GROUP_LOADERS[field](org_units) for field in group_fields}
    ancestors_map = _batch_ancestors(org_units, ancestor_subfields) if ancestor_subfields is not None else None
    org_unit_type_map = _batch_org_unit_types(org_units) if include_org_unit_type else None
    parent_map = _batch_parents(org_units, parent_subfields) if parent_subfields is not None else None
    creator_map = (
        _batch_single_fk([unit.creator_id for unit in org_units], User, list(CREATOR_SUBFIELDS))
        if include_creator
        else None
    )
    version_map = (
        _batch_versions([unit.version_id for unit in org_units], version_subfields)
        if version_subfields is not None
        else None
    )

    rows = []
    for unit in org_units:
        row = {field: _get_scalar_field(unit, field) for field in plain_fields}
        for field in geometry_fields:
            row[field] = geometry_maps[field].get(unit.id)
        for field in group_fields:
            row[field] = group_maps[field].get(unit.id, [])
        if ancestors_map is not None:
            row["ancestors"] = ancestors_map.get(unit.id, [])
        if org_unit_type_map is not None:
            row["org_unit_type"] = org_unit_type_map.get(unit.org_unit_type_id)
        if parent_map is not None:
            row["parent"] = parent_map.get(unit.parent_id)
        if creator_map is not None:
            row["creator"] = creator_map.get(unit.creator_id)
        if version_map is not None:
            row["version"] = version_map.get(unit.version_id)
        rows.append(row)
    return rows


def _field(row, name: str):
    """`row` is either a full `OrgUnit` instance (the JSON/paginated path) or a `.values()` dict (the
    CSV/XLSX export path, see `build_export_row_getter` - lighter than materializing a full model
    instance per row). Both are read the same way everywhere else in this module via this helper."""
    return row.get(name) if isinstance(row, dict) else getattr(row, name, None)


def _get_scalar_field(row, field: str):
    if field == "latitude":
        location = _field(row, "location")
        return location.y if location else None
    if field == "longitude":
        location = _field(row, "location")
        return location.x if location else None
    if field == "altitude":
        location = _field(row, "location")
        return location.z if location else None
    if field == "aliases":
        return _field(row, "aliases") or []
    if field == "depth":
        # Same value the `depth` filter matches against (ltree path length, root = 1) - read straight
        # off the already-loaded `path` column, no query.
        path = _field(row, "path")
        return len(path) if path else None
    return _field(row, field)


def _batch_geojson(org_units: List[OrgUnit], geometry_field: str) -> Dict[int, Optional[dict]]:
    ids = [unit.id for unit in org_units]
    if not ids:
        return {}
    return _batch_geojson_for_queryset(OrgUnit.objects.filter(id__in=ids), geometry_field)


def _batch_geojson_for_queryset(queryset, geometry_field: str) -> Dict[int, Optional[dict]]:
    """Same idea as `_batch_geojson`, but works directly off a queryset (used by CSV/XLSX export, which
    already has the filtered queryset and shouldn't need a materialized id list to batch this)."""
    result = geojson_queryset(queryset, geometry_field=geometry_field)
    return {feature["id"]: feature["geometry"] for feature in result["features"]}


def _batch_group_ids(org_units: List[OrgUnit]) -> Dict[int, List[int]]:
    """One query for the whole collection instead of one `.groups.values_list(...)` per org unit."""
    ids = [unit.id for unit in org_units]
    result: Dict[int, List[int]] = {unit.id: [] for unit in org_units}
    if not ids:
        return result
    pairs = Group.objects.filter(org_units__id__in=ids).values_list("org_units__id", "id")
    for org_unit_id, group_id in pairs:
        result.setdefault(org_unit_id, []).append(group_id)
    return result


def _batch_groups(org_units: List[OrgUnit]) -> Dict[int, List[dict]]:
    """Same as `_batch_group_ids` but with `{id, name}` objects - one query for the whole collection."""
    ids = [unit.id for unit in org_units]
    result: Dict[int, List[dict]] = {unit.id: [] for unit in org_units}
    if not ids:
        return result
    rows = Group.objects.filter(org_units__id__in=ids).values_list("org_units__id", "id", "name")
    for org_unit_id, group_id, group_name in rows:
        result.setdefault(org_unit_id, []).append({"id": group_id, "name": group_name})
    return result


#: which batch loader backs each field name in `GROUP_FIELDS`.
_BATCH_GROUP_LOADERS: Dict[str, Callable[[List[OrgUnit]], Dict[int, list]]] = {
    "groups": _batch_groups,
    "group_ids": _batch_group_ids,
}


def _batch_ancestors(org_units: List[OrgUnit], requested_subfields: Optional[dict]) -> Dict[int, List[dict]]:
    subfields = [f for f in (requested_subfields or ANCESTOR_DEFAULT_SUBFIELDS) if f != "id"]

    all_ancestor_ids: set = set()
    for unit in org_units:
        if unit.path:
            all_ancestor_ids.update(int(ancestor_id) for ancestor_id in unit.path[:-1])

    ancestors_by_id: Dict[int, dict] = {}
    if all_ancestor_ids:
        for ancestor in OrgUnit.objects.filter(id__in=all_ancestor_ids).only("id", *subfields):
            ancestors_by_id[ancestor.id] = {"id": ancestor.id, **{f: getattr(ancestor, f) for f in subfields}}

    result: Dict[int, List[dict]] = {}
    for unit in org_units:
        if not unit.path:
            result[unit.id] = []
            continue
        result[unit.id] = [
            ancestors_by_id[int(ancestor_id)] for ancestor_id in unit.path[:-1] if int(ancestor_id) in ancestors_by_id
        ]
    return result


def _batch_single_fk(ids: List[Optional[int]], model, subfields: List[str]) -> Dict[int, dict]:
    """Batch-load a single (non-M2M) FK relation's summary object for a set of ids - one query instead of
    one `.get()` per row. Used for `org_unit_type` (ids = each unit's `org_unit_type_id`) and `parent`
    (ids = each unit's `parent_id`)."""
    unique_ids = {i for i in ids if i is not None}
    if not unique_ids:
        return {}
    result: Dict[int, dict] = {}
    for obj in model.objects.filter(id__in=unique_ids).only("id", *subfields):
        result[obj.id] = {"id": obj.id, **{f: getattr(obj, f) for f in subfields}}
    return result


def _batch_org_unit_types(org_units: List[OrgUnit]) -> Dict[int, dict]:
    return _batch_single_fk([unit.org_unit_type_id for unit in org_units], OrgUnitType, list(ORG_UNIT_TYPE_SUBFIELDS))


def _batch_parents(org_units: List[OrgUnit], requested_subfields: Optional[dict]) -> Dict[int, dict]:
    subfields = [f for f in (requested_subfields or PARENT_DEFAULT_SUBFIELDS) if f != "id"]
    return _batch_single_fk([unit.parent_id for unit in org_units], OrgUnit, subfields)


def _version_plain_subfields(requested_subfields: Optional[dict]) -> List[str]:
    """`SourceVersion` columns to fetch for `version(...)` - excludes `id` (added automatically by
    `_batch_single_fk`) and `data_source` (a separate nested object, not a plain column)."""
    return [f for f in (requested_subfields or VERSION_DEFAULT_SUBFIELDS) if f not in ("id", "data_source")]


def _attach_data_sources(version_map: Dict[int, dict], requested_subfields: Optional[dict]) -> None:
    """If `data_source` was requested as part of `version(...)`, expand each version's `data_source_id`
    into a nested `{id, name}` object, in one extra batch query - mutates `version_map` in place."""
    if not (requested_subfields and "data_source" in requested_subfields):
        return
    data_source_ids = {v["data_source_id"] for v in version_map.values() if v.get("data_source_id") is not None}
    data_source_map = _batch_single_fk(list(data_source_ids), DataSource, list(DATA_SOURCE_SUBFIELDS))
    for version in version_map.values():
        data_source_id = version.get("data_source_id")
        version["data_source"] = data_source_map.get(data_source_id) if data_source_id is not None else None


def _batch_versions(version_ids: List[Optional[int]], requested_subfields: Optional[dict]) -> Dict[int, dict]:
    plain_subfields = _version_plain_subfields(requested_subfields)
    # `data_source_id` is needed internally to expand `data_source`, even if it wasn't itself requested.
    fetch_subfields = list({*plain_subfields, "data_source_id"})
    version_map = _batch_single_fk(version_ids, SourceVersion, fetch_subfields)
    _attach_data_sources(version_map, requested_subfields)
    if "data_source_id" not in plain_subfields:
        for version in version_map.values():
            version.pop("data_source_id", None)
    return version_map


# -- CSV/XLSX export support -------------------------------------------------------------------------
#
# `serialize_org_units()` above batches groups/ancestors once for a *materialized* list of org units -
# fine for a paginated page (<= page_size, held in memory anyway), but calling it once per row would
# undo the batching entirely: each call would re-run its "one query for the whole collection" queries
# against a collection of one. CSV/XLSX exports stream a queryset that can be far bigger than one page, so
# they need the batching done against the *queryset* itself (subqueries, no materialized id list) before
# streaming starts - `build_export_row_getter()` below does that.


def _batch_groups_for_queryset(queryset, include_names: bool) -> Dict[int, list]:
    """Same idea as `_batch_groups`/`_batch_group_ids`, but scoped to `queryset` via a subquery
    (`org_units__in=queryset`) instead of a materialized id list - one query no matter how many rows
    `queryset` matches."""
    value_fields = ("org_units__id", "id", "name") if include_names else ("org_units__id", "id")
    result: Dict[int, list] = defaultdict(list)
    for row in Group.objects.filter(org_units__in=queryset).values_list(*value_fields):
        org_unit_id, group_id = row[0], row[1]
        result[org_unit_id].append({"id": group_id, "name": row[2]} if include_names else group_id)
    return result


def collect_distinct_groups_for_queryset(queryset) -> Dict[int, str]:
    """Every distinct group referenced by any org unit in `queryset`, as `{id: name}` - used to build one
    `group-<id>.id`/`group-<id>.name` column pair per group for CSV/XLSX export. Group membership is an
    unordered set (an org unit can belong to any subset of the account's groups), not a positional list
    like `ancestors` - so, unlike `ancestors[i].<subfield>`, columns are keyed by the group's own id
    rather than its position in some row's membership list, which wouldn't mean the same thing from one
    row to the next."""
    return dict(Group.objects.filter(org_units__in=queryset).distinct().values_list("id", "name"))


def _collect_ancestor_export_data(queryset, requested_subfields: Optional[dict]) -> Tuple[int, Dict[int, dict]]:
    """One pass over `queryset`'s `path` column (not full rows, so this stays cheap even for a huge
    export) to get (a) the deepest ancestor chain among the matched org units, used to size the
    `ancestors[i].<subfield>` export columns, and (b) every ancestor id referenced, fetched in a single
    bulk query. Deliberately doesn't build a per-exported-unit map - that could be as large as the export
    itself; each row instead reuses its own already-loaded `.path` at row-build time (see
    `build_export_row_getter`)."""
    subfields = [f for f in (requested_subfields or ANCESTOR_DEFAULT_SUBFIELDS) if f != "id"]

    max_depth = 0
    all_ancestor_ids: set = set()
    for path in queryset.exclude(path__isnull=True).values_list("path", flat=True):
        max_depth = max(max_depth, len(path) - 1)
        all_ancestor_ids.update(int(ancestor_id) for ancestor_id in path[:-1])

    ancestors_by_id: Dict[int, dict] = {}
    if all_ancestor_ids:
        for ancestor in OrgUnit.objects.filter(id__in=all_ancestor_ids).only("id", *subfields):
            ancestors_by_id[ancestor.id] = {"id": ancestor.id, **{f: getattr(ancestor, f) for f in subfields}}
    return max_depth, ancestors_by_id


def _batch_single_fk_for_queryset(queryset, fk_field: str, model, subfields: List[str]) -> Dict[int, dict]:
    """Same idea as `_batch_single_fk`, but scoped to `queryset` via a subquery on `fk_field` (e.g.
    `org_unit_type_id`, `parent_id`) instead of a materialized id list."""
    ids_subquery = queryset.exclude(**{f"{fk_field}__isnull": True}).values(fk_field)
    result: Dict[int, dict] = {}
    for obj in model.objects.filter(id__in=ids_subquery).only("id", *subfields):
        result[obj.id] = {"id": obj.id, **{f: getattr(obj, f) for f in subfields}}
    return result


def _batch_versions_for_queryset(queryset, requested_subfields: Optional[dict]) -> Dict[int, dict]:
    """Same idea as `_batch_versions`, but scoped to `queryset` via a subquery instead of a materialized
    id list - used by CSV/XLSX export."""
    plain_subfields = _version_plain_subfields(requested_subfields)
    fetch_subfields = list({*plain_subfields, "data_source_id"})
    version_map = _batch_single_fk_for_queryset(queryset, "version_id", SourceVersion, fetch_subfields)
    _attach_data_sources(version_map, requested_subfields)
    if "data_source_id" not in plain_subfields:
        for version in version_map.values():
            version.pop("data_source_id", None)
    return version_map


def build_export_row_getter(
    queryset,
    geometry_fields: List[str],
    group_fields: List[str],
    ancestor_subfields: Optional[dict],
    include_org_unit_type: bool = False,
    parent_subfields: Optional[dict] = None,
    include_creator: bool = False,
    version_subfields: Optional[dict] = None,
) -> Tuple[Callable[[object, str], object], int]:
    """Return `(get_value, max_ancestor_depth)` for CSV/XLSX export rows.

    `get_value(row, field)` reads plain scalar fields straight off `row` (no query - same as
    `_get_scalar_field`) and `geom`/`simplified_geom`/`catchment`/`groups`/`group_ids`/`ancestors`/
    `org_unit_type`/`parent`/`creator`/`version` from maps batched ONCE against the whole `queryset`
    upfront, so a caller can stream `queryset` row by row without re-running those batch queries for
    every single row. `row` can be a plain `OrgUnit` instance or a `.values()` dict (see
    `required_row_columns`) - lighter than a full model instance per row, which is what the CSV/XLSX
    export in `views.py` actually iterates.
    """
    geometry_maps = {field: _batch_geojson_for_queryset(queryset, field) for field in geometry_fields}
    group_maps = {
        field: _batch_groups_for_queryset(queryset, include_names=(field == "groups")) for field in group_fields
    }
    max_depth, ancestors_by_id = (
        _collect_ancestor_export_data(queryset, ancestor_subfields) if ancestor_subfields is not None else (0, {})
    )
    org_unit_type_map = (
        _batch_single_fk_for_queryset(queryset, "org_unit_type_id", OrgUnitType, list(ORG_UNIT_TYPE_SUBFIELDS))
        if include_org_unit_type
        else None
    )
    parent_map = (
        _batch_single_fk_for_queryset(
            queryset, "parent_id", OrgUnit, [f for f in (parent_subfields or PARENT_DEFAULT_SUBFIELDS) if f != "id"]
        )
        if parent_subfields is not None
        else None
    )
    creator_map = (
        _batch_single_fk_for_queryset(queryset, "creator_id", User, list(CREATOR_SUBFIELDS))
        if include_creator
        else None
    )
    version_map = _batch_versions_for_queryset(queryset, version_subfields) if version_subfields is not None else None

    def get_value(row, field: str):
        # `row` is a `.values()` dict here (see `required_row_columns`/`views.py._export`) - read via
        # `_field()`, same helper `_get_scalar_field` uses, so this works for a plain OrgUnit instance too.
        if field in geometry_maps:
            return geometry_maps[field].get(_field(row, "id"))
        if field in group_maps:
            return group_maps[field].get(_field(row, "id"), [])
        if field == "org_unit_type":
            return org_unit_type_map.get(_field(row, "org_unit_type_id")) if org_unit_type_map is not None else None
        if field == "parent":
            return parent_map.get(_field(row, "parent_id")) if parent_map is not None else None
        if field == "creator":
            return creator_map.get(_field(row, "creator_id")) if creator_map is not None else None
        if field == "version":
            return version_map.get(_field(row, "version_id")) if version_map is not None else None
        if field == "ancestors":
            path = _field(row, "path")
            if not path:
                return []
            return [
                ancestors_by_id[int(ancestor_id)] for ancestor_id in path[:-1] if int(ancestor_id) in ancestors_by_id
            ]
        return _get_scalar_field(row, field)

    return get_value, max_depth


def required_row_columns(scalar_fields: List[str], include_ancestors: bool) -> List[str]:
    """DB columns/annotations `get_value()` (from `build_export_row_getter`) needs to be present in a
    `.values()` row for the given `scalar_fields` (plus whether `ancestors(...)` was requested). Used by
    the CSV/XLSX export to project only what's actually needed instead of materializing full `OrgUnit`
    instances - `geom`/`simplified_geom`/`catchment`/`groups`/`group_ids` are deliberately excluded: their
    values come from the id-keyed batch maps above, never read off the row itself."""
    columns = {"id"}
    for field in scalar_fields:
        if field in GEOMETRY_FIELDS or field in GROUP_FIELDS:
            continue
        if field in ("latitude", "longitude", "altitude"):
            columns.add("location")
        elif field == "depth":
            columns.add("path")
        elif field == "org_unit_type":
            columns.add("org_unit_type_id")
        elif field == "parent":
            columns.add("parent_id")
        elif field == "creator":
            columns.add("creator_id")
        elif field == "version":
            columns.add("version_id")
        else:
            columns.add(field)
    if include_ancestors:
        columns.add("path")
    return sorted(columns)
