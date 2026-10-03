from typing import Any, Dict, Optional

from ariadne import QueryType
from django.db.models import QuerySet
from graphql import GraphQLResolveInfo

from iaso.models import OrgUnit

from ..common import check_page, ordering, orderings, requesting_user, selection_tree
from .filters import apply_filters
from .selection import FIELD_LIMITS, load_selected


#: lower than v3's 200 000 page size (sized for exports, which stay REST): a GraphQL page is one JSON document
MAX_LIMIT = 10_000

#: `OrgUnitOrder` value -> ORM ordering
ORDERINGS = orderings("id", "name", "created_at", "updated_at", "opening_date", "closed_date", "validation_status")

query = QueryType()


def visible_org_units(info: GraphQLResolveInfo) -> QuerySet:
    # `filter_for_user` defers `geom`: harmless, `only()` replaces the deferred fields anyway
    return OrgUnit.objects.filter_for_user(requesting_user(info))


@query.field("orgUnits")
def resolve_org_units(
    _, info: GraphQLResolveInfo, limit: int, offset: int, filters: Optional[Dict[str, Any]] = None, order=None
):
    selected = selection_tree(info)
    items = selected.get("items") or {}
    check_page(limit, offset, items, MAX_LIMIT, FIELD_LIMITS)

    queryset = apply_filters(visible_org_units(info), filters or {}, info.context["request"].user)
    page: Dict[str, Any] = {}
    if "totalCount" in selected:
        page["total_count"] = queryset.count()
    if "items" in selected or "hasNextPage" in selected:
        # one extra row tells whether there is a next page, without a COUNT(*)
        extra_row = 1 if "hasNextPage" in selected else 0
        queryset = load_selected(queryset, items).order_by(*ordering(order, ORDERINGS, default="ID"))
        org_units = list(queryset[offset : offset + limit + extra_row])
        page["has_next_page"] = len(org_units) > limit
        page["items"] = org_units[:limit]
    return page


@query.field("orgUnit")
def resolve_org_unit(_, info: GraphQLResolveInfo, id: int):
    return load_selected(visible_org_units(info), selection_tree(info)).filter(pk=id).order_by().first()
