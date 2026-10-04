"""What every list query shares: reading the selection, applying the flat filters, pages, orderings and the spatial
filters (`orgUnits` and `instances`)."""

import math

from functools import reduce
from operator import or_
from typing import Any, Callable, Dict, List, Optional

from django.contrib.gis.geos import Polygon
from django.db.models import Q, QuerySet
from graphql import GraphQLError, GraphQLNamedType, GraphQLResolveInfo, get_named_type
from graphql.execution.collect_fields import collect_sub_fields

from iaso.models import OrgUnit

from .org_units.expressions import as_geometry


#: `Project` GraphQL field -> model column, for every type with projects
PROJECT_COLUMNS = {"id": "id", "name": "name"}

#: selected field name -> its sub-selection (`None` for a leaf)
SelectionTree = Dict[str, Optional["SelectionTree"]]
#: a filter that isn't a plain lookup: `(queryset, value, user) -> queryset`
FilterMethod = Callable[[QuerySet, Any, Any], QuerySet]

#: `...In` lists: v3 is implicitly bounded by the URL length, GraphQL needs an explicit cap
MAX_IN_VALUES = 1_000


def selection_tree(info: GraphQLResolveInfo, field_nodes=None, return_type=None) -> SelectionTree:
    """What the query selected under the field being resolved (or under `field_nodes`, of `return_type`)."""
    field_nodes = info.field_nodes if field_nodes is None else field_nodes
    return_type: GraphQLNamedType = get_named_type(info.return_type if return_type is None else return_type)
    if not hasattr(return_type, "fields"):
        return {}
    tree: SelectionTree = {}
    for nodes in collect_sub_fields(
        info.schema, info.fragments, info.variable_values, return_type, field_nodes
    ).values():
        name = nodes[0].name.value
        if name.startswith("__"):
            continue  # `__typename`, answered by graphql-core itself
        sub_type = return_type.fields[name].type
        sub_tree = selection_tree(info, nodes, sub_type) if hasattr(get_named_type(sub_type), "fields") else None
        # aliases are rejected below the root (see `validation.py`): one response key per field name
        tree[name] = sub_tree
    return tree


def columns(fields: SelectionTree, available: Dict[str, str], prefix: str = "") -> List[str]:
    """The model columns of the selected `fields` (`prefix`: the ORM path to a related model, `parent__`)."""
    return [f"{prefix}{available[name]}" for name in fields if name in available]


def requesting_user(info: GraphQLResolveInfo):
    user = info.context["request"].user
    if not user.is_authenticated:
        raise GraphQLError("Authentication credentials were not provided.", extensions={"code": "UNAUTHENTICATED"})
    return user


def check_page(limit: int, offset: int, items: SelectionTree, max_limit: int, field_limits: Dict[str, int]) -> None:
    """`field_limits`: page size cap of the selected fields whose cost grows with the page - the lowest applies. A
    field of a related object is named by its path (`orgUnit.ancestors`)."""
    selected = [*items, *(f"{name}.{sub}" for name, sub_tree in items.items() if sub_tree for sub in sub_tree)]
    caps = {name: field_limits[name] for name in selected if name in field_limits}
    max_limit = min([max_limit, *caps.values()])
    if not 0 < limit <= max_limit:
        capped_by = sorted(name for name, cap in caps.items() if cap == max_limit)
        reason = f" when selecting {', '.join(capped_by)}" if capped_by else ""
        raise GraphQLError(f"limit must be between 1 and {max_limit}{reason}")
    if offset < 0:
        raise GraphQLError("offset must be >= 0")


def orderings(*fields: str) -> Dict[str, str]:
    """`<Type>Order` enum value -> ORM ordering, ascending and `_DESC`ending for each field."""
    return {
        f"{field.upper()}{suffix}": f"{sign}{field}" for field in fields for suffix, sign in (("", ""), ("_DESC", "-"))
    }


def ordering(order: Optional[List[str]], available: Dict[str, str], default: str) -> List[str]:
    ordering = [available[value] for value in dict.fromkeys(order or [default])]
    if not any(field.lstrip("-") == "id" for field in ordering):
        # stable offset pages: the other fields aren't unique. In the direction of the first one, so that an index
        # on it still serves `ORDER BY <field> DESC, id DESC` (a mixed direction would sort the whole result)
        ordering.append("-id" if ordering[0].startswith("-") else "id")
    return ordering


def apply_filters(
    queryset: QuerySet, filters: Dict[str, Any], user, lookups: Dict[str, str], methods: Dict[str, FilterMethod]
) -> QuerySet:
    """`filters` is already validated against its input type by graphql-core: only known keys, typed values. Each
    is a plain ORM lookup (`lookups`) or a method, all AND-ed."""
    for name, value in filters.items():
        if value is None:
            continue  # an explicit `null` is "not filtered", like an absent v3 query param
        if isinstance(value, list) and len(value) > MAX_IN_VALUES:
            raise GraphQLError(f"{name} takes at most {MAX_IN_VALUES} values")
        if any(isinstance(item, str) and "\x00" in item for item in (value if isinstance(value, list) else [value])):
            # postgres text can't hold one: psycopg2 would raise mid-query (found by schemathesis)
            raise GraphQLError(f"{name} can't contain a NUL (\\u0000) character")
        if name in lookups:
            queryset = queryset.filter(**{lookups[name]: value})
        else:
            queryset = methods[name](queryset, value, user)
    return queryset


def visible_org_unit(user, org_unit_id: int, *columns: str) -> OrgUnit:
    """Scoped to the requesting user: another account's org unit is indistinguishable from a missing one."""
    try:
        return OrgUnit.objects.filter_for_user(user).only("id", *columns).get(pk=org_unit_id)
    except OrgUnit.DoesNotExist:
        raise GraphQLError(f"Org unit {org_unit_id} does not exist")


def bbox_polygons(bbox: Dict[str, float]) -> List[Polygon]:
    """The planar lon/lat box(es) covered - two when crossing the antimeridian."""
    minx, miny, maxx, maxy = coordinates = [bbox[key] for key in ("minx", "miny", "maxx", "maxy")]
    if not all(math.isfinite(coordinate) for coordinate in coordinates):
        raise GraphQLError("Invalid bbox: all 4 values must be finite numbers")
    if not (-180 <= minx <= 180 and -180 <= maxx <= 180):
        raise GraphQLError("Invalid bbox: longitudes (minx, maxx) must be between -180 and 180")
    if not (-90 <= miny <= 90 and -90 <= maxy <= 90):
        raise GraphQLError("Invalid bbox: latitudes (miny, maxy) must be between -90 and 90")
    if miny > maxy:
        raise GraphQLError("Invalid bbox: miny must be <= maxy (minx > maxx crosses the antimeridian)")
    spans = [(minx, maxx)] if minx <= maxx else [(minx, 180.0), (-180.0, maxx)]
    boxes = [Polygon.from_bbox((west, miny, east, maxy)) for west, east in spans]
    for box in boxes:
        box.srid = 4326
    return boxes


def bbox_filter(column: str, outside: bool) -> FilterMethod:
    """On an org unit `geography` column, tested in planar lon/lat on the column cast to `geometry` (see
    `filter_bbox` in v3 for why not on the `geography` itself). Rows without that geometry are never "outside":
    nothing to compare."""

    def apply(queryset: QuerySet, value: Dict[str, float], user) -> QuerySet:
        tested = f"{column}_as_geometry"
        queryset = queryset.alias(**{tested: as_geometry(column)})
        in_box = reduce(or_, (Q(**{f"{tested}__intersects": box}) for box in bbox_polygons(value)))
        if outside:
            return queryset.filter(**{f"{column}__isnull": False}).exclude(in_box)
        return queryset.filter(in_box)

    return apply


def containment_filter(column: str, outside: bool) -> FilterMethod:
    """Against the referenced org unit's `simplified_geom`, else its `geom`."""

    def apply(queryset: QuerySet, value: int, user) -> QuerySet:
        reference = visible_org_unit(user, value, "geom", "simplified_geom")
        geometry = reference.simplified_geom or reference.geom
        if geometry is None:
            raise GraphQLError(f"Org unit {value} has no geom or simplified_geom")
        if outside:
            return queryset.filter(**{f"{column}__isnull": False}).exclude(**{f"{column}__within": geometry})
        return queryset.filter(**{f"{column}__within": geometry})

    return apply


def page(selected: SelectionTree, queryset: QuerySet, load, order_by, limit: int, offset: int) -> Dict[str, Any]:
    """A `...Page` of `queryset`: `items` loaded by `load(queryset, items' selection)`, `hasNextPage` from one extra
    row, `totalCount` a `COUNT(*)` only when selected."""
    result: Dict[str, Any] = {}
    if "totalCount" in selected:
        result["total_count"] = queryset.count()
    if "items" in selected or "hasNextPage" in selected:
        # one extra row tells whether there is a next page, without a COUNT(*)
        extra_row = 1 if "hasNextPage" in selected else 0
        rows = list(
            load(queryset, selected.get("items") or {}).order_by(*order_by)[offset : offset + limit + extra_row]
        )
        result["has_next_page"] = len(rows) > limit
        result["items"] = rows[:limit]
    return result
