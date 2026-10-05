"""`dataSources`/`dataSource` and `sourceVersions`/`sourceVersion`: the scope of `GET /api/datasources/` and
`GET /api/sourceversions/` - the sources of a project of the user's account -, with their read permissions."""

from typing import Any, Dict, Optional

from ariadne import QueryType
from django.db.models import Exists, OuterRef, QuerySet
from graphql import GraphQLError, GraphQLResolveInfo

from iaso.models import DataSource, Project, SourceVersion
from iaso.permissions.core_permissions import (
    CORE_LINKS_PERMISSION,
    CORE_MAPPINGS_PERMISSION,
    CORE_ORG_UNITS_PERMISSION,
    CORE_ORG_UNITS_READ_PERMISSION,
    CORE_SOURCE_PERMISSION,
)

from ..common import check_page, ordering, orderings, page, requesting_user, selection_tree
from .filters import apply_source_filters, apply_version_filters
from .selection import SOURCE_FIELD_LIMITS, load_selected_sources, load_selected_versions


MAX_LIMIT = 1_000

#: any of them, as the REST endpoints
READ_PERMISSIONS = (
    CORE_SOURCE_PERMISSION,
    CORE_MAPPINGS_PERMISSION,
    CORE_ORG_UNITS_PERMISSION,
    CORE_ORG_UNITS_READ_PERMISSION,
    CORE_LINKS_PERMISSION,
)

SOURCE_ORDERINGS = orderings("id", "name", "created_at", "updated_at")
VERSION_ORDERINGS = orderings("id", "number", "created_at", "updated_at")

query = QueryType()


def account_id(info: GraphQLResolveInfo) -> Optional[int]:
    """The requesting user's account, once their permission checked."""
    user = requesting_user(info)
    if not any(user.has_perm(permission.full_name()) for permission in READ_PERMISSIONS):
        raise GraphQLError("You do not have permission to see data sources.", extensions={"code": "FORBIDDEN"})
    profile = getattr(user, "iaso_profile", None)
    return profile.account_id if profile is not None else None


def visible_sources(info: GraphQLResolveInfo) -> QuerySet:
    linked = Project.objects.filter(account_id=account_id(info), data_sources=OuterRef("pk"))
    return DataSource.objects.filter(Exists(linked))


def visible_versions(info: GraphQLResolveInfo) -> QuerySet:
    return SourceVersion.objects.filter(data_source_id__in=visible_sources(info).values("id"))


def _load_sources(info: GraphQLResolveInfo):
    account = account_id(info)
    return lambda queryset, fields: load_selected_sources(queryset, fields, account)


@query.field("dataSources")
def resolve_data_sources(
    _, info: GraphQLResolveInfo, limit: int, offset: int, filters: Optional[Dict[str, Any]] = None, order=None
):
    selected = selection_tree(info)
    check_page(limit, offset, selected.get("items") or {}, MAX_LIMIT, SOURCE_FIELD_LIMITS)
    queryset = apply_source_filters(visible_sources(info), filters or {}, info.context["request"].user)
    order_by = ordering(order, SOURCE_ORDERINGS, default="NAME")
    return page(selected, queryset, _load_sources(info), order_by, limit, offset)


@query.field("dataSource")
def resolve_data_source(_, info: GraphQLResolveInfo, id: int):
    return _load_sources(info)(visible_sources(info), selection_tree(info)).filter(pk=id).order_by().first()


@query.field("sourceVersions")
def resolve_source_versions(
    _, info: GraphQLResolveInfo, limit: int, offset: int, filters: Optional[Dict[str, Any]] = None, order=None
):
    selected = selection_tree(info)
    check_page(limit, offset, selected.get("items") or {}, MAX_LIMIT, {})
    queryset = apply_version_filters(visible_versions(info), filters or {}, info.context["request"].user)
    order_by = ordering(order, VERSION_ORDERINGS, default="CREATED_AT_DESC")
    return page(selected, queryset, load_selected_versions, order_by, limit, offset)


@query.field("sourceVersion")
def resolve_source_version(_, info: GraphQLResolveInfo, id: int):
    return load_selected_versions(visible_versions(info), selection_tree(info)).filter(pk=id).order_by().first()
