from typing import Any, Dict, Optional

from ariadne import QueryType
from django.db.models import QuerySet
from graphql import GraphQLError, GraphQLResolveInfo

from iaso.models import Form, Instance
from iaso.permissions.core_permissions import (
    CORE_FORMS_PERMISSION,
    CORE_REGISTRY_READ_PERMISSION,
    CORE_REGISTRY_WRITE_PERMISSION,
    CORE_SUBMISSIONS_PERMISSION,
)

from ..common import check_page, ordering, orderings, requesting_user, selection_tree
from .filters import apply_filters
from .selection import FIELD_LIMITS, load_selected


MAX_LIMIT = 10_000

#: `InstanceOrder` value -> ORM ordering: the indexed columns only
ORDERINGS = orderings("id", "created_at", "updated_at", "source_created_at", "source_updated_at", "period")

#: the legacy `HasInstancePermission`
READ_PERMISSIONS = (
    CORE_FORMS_PERMISSION,
    CORE_SUBMISSIONS_PERMISSION,
    CORE_REGISTRY_WRITE_PERMISSION,
    CORE_REGISTRY_READ_PERMISSION,
)

query = QueryType()


def visible_instances(info: GraphQLResolveInfo) -> QuerySet:
    """The legacy `/api/instances/` list scope: the user's account (and org units, and projects if restricted to
    some), forms not deleted.

    The deleted forms are a `NOT IN` subquery rather than v1's `form__deleted_at__isnull=True`: that LEFT JOIN on
    `iaso_form` hides from the planner that nearly every row passes, so a page of the newest submissions sorted
    the whole account (~1 s for 1.1M submissions) instead of reading the primary key backwards (~0.1 ms)."""
    user = requesting_user(info)
    if not any(user.has_perm(permission.full_name()) for permission in READ_PERMISSIONS):
        raise GraphQLError("You do not have permission to see submissions.", extensions={"code": "FORBIDDEN"})
    return instances_of(user)


def instances_of(user) -> QuerySet:
    """The submissions in `user`'s scope, whatever their permissions (checked by the caller)."""
    return (
        Instance.objects.filter_for_user(user)
        .filter_on_user_projects(user=user)
        .exclude(form_id__in=Form.objects_only_deleted.values("id"))
    )


@query.field("submissions")
def resolve_instances(
    _, info: GraphQLResolveInfo, limit: int, offset: int, filters: Optional[Dict[str, Any]] = None, order=None
):
    selected = selection_tree(info)
    items = selected.get("items") or {}
    check_page(limit, offset, items, MAX_LIMIT, FIELD_LIMITS)

    queryset = apply_filters(visible_instances(info), filters or {}, info.context["request"].user)
    page: Dict[str, Any] = {}
    if "totalCount" in selected:
        page["total_count"] = queryset.count()
    if "items" in selected or "hasNextPage" in selected:
        # one extra row tells whether there is a next page, without a COUNT(*)
        extra_row = 1 if "hasNextPage" in selected else 0
        queryset = load_selected(queryset, items).order_by(*ordering(order, ORDERINGS, default="ID_DESC"))
        instances = list(queryset[offset : offset + limit + extra_row])
        page["has_next_page"] = len(instances) > limit
        page["items"] = instances[:limit]
    return page


@query.field("submission")
def resolve_instance(_, info: GraphQLResolveInfo, id: int):
    """Deleted ones included: a link to a submission keeps working after it's deleted, `deleted` tells."""
    return load_selected(visible_instances(info), selection_tree(info)).filter(pk=id).order_by().first()
