"""`groups` / `group`: the scope of `GET /api/groups/` - the groups of the source versions of the account's data
sources -, with its read permissions. The org units of a group are `orgUnits(filters: {groupId: ...})`: no count per
row here."""

from typing import Any, Dict, Optional

from ariadne import QueryType
from django.db.models import Exists, OuterRef, QuerySet
from graphql import GraphQLError, GraphQLResolveInfo

from iaso.models import DataSource, Group
from iaso.permissions.core_permissions import (
    CORE_COMPLETENESS_STATS_PERMISSION,
    CORE_ORG_UNITS_PERMISSION,
    CORE_ORG_UNITS_READ_PERMISSION,
)

from ..common import (
    FilterMethod,
    SelectionTree,
    apply_filters,
    check_page,
    columns,
    ordering,
    orderings,
    page,
    requesting_user,
    selection_tree,
)
from ..sources.selection import DATA_SOURCE_SUMMARY_COLUMNS, SOURCE_VERSION_COLUMNS
from .selection import GROUP_COLUMNS


MAX_LIMIT = 1_000

#: any of them, as the REST endpoint
READ_PERMISSIONS = (CORE_ORG_UNITS_PERMISSION, CORE_ORG_UNITS_READ_PERMISSION, CORE_COMPLETENESS_STATS_PERMISSION)

#: GraphQL field -> model column, for the fields read straight from a column
COLUMNS = {
    **GROUP_COLUMNS,
    "blockOfCountries": "block_of_countries",
    "createdAt": "created_at",
    "updatedAt": "updated_at",
    "sourceVersionId": "source_version_id",
}
ORDERINGS = orderings("id", "name", "created_at", "updated_at")

query = QueryType()


def visible_groups(info: GraphQLResolveInfo) -> QuerySet:
    user = requesting_user(info)
    if not any(user.has_perm(permission.full_name()) for permission in READ_PERMISSIONS):
        raise GraphQLError("You do not have permission to see groups.", extensions={"code": "FORBIDDEN"})
    profile = getattr(user, "iaso_profile", None)
    linked = DataSource.projects.through.objects.filter(
        datasource_id=OuterRef("source_version__data_source_id"),
        project__account_id=profile.account_id if profile is not None else None,
    )
    return Group.objects.filter(Exists(linked))


def _default_version(queryset: QuerySet, value: bool, user) -> QuerySet:
    """`false`: not filtered, as `OrgUnitFilter.defaultVersion`."""
    profile = getattr(user, "iaso_profile", None)
    if not value or profile is None:
        return queryset
    return queryset.filter(source_version_id=profile.account.default_version_id)


LOOKUPS = {
    "id": "id",
    "idIn": "id__in",
    "nameIContains": "name__icontains",
    "sourceRef": "source_ref",
    "sourceVersionId": "source_version_id",
    "sourceVersionIdIn": "source_version_id__in",
    "dataSourceId": "source_version__data_source_id",
    "blockOfCountries": "block_of_countries",
}
METHODS: Dict[str, FilterMethod] = {"defaultVersion": _default_version}


def load_selected(queryset: QuerySet, fields: SelectionTree) -> QuerySet:
    """`queryset` loading only the selected `fields`, its source version (and data source) joined if selected."""
    only = ["id", *columns(fields, COLUMNS)]
    if "sourceVersion" in fields:
        version = fields["sourceVersion"]
        queryset = queryset.select_related("source_version")
        only += ["source_version", *columns(version, SOURCE_VERSION_COLUMNS, "source_version__")]
        if "dataSource" in version:
            queryset = queryset.select_related("source_version__data_source")
            only += [
                "source_version__data_source",
                *columns(version["dataSource"], DATA_SOURCE_SUMMARY_COLUMNS, "source_version__data_source__"),
            ]
    return queryset.only(*only)


@query.field("groups")
def resolve_groups(
    _, info: GraphQLResolveInfo, limit: int, offset: int, filters: Optional[Dict[str, Any]] = None, order=None
):
    selected = selection_tree(info)
    check_page(limit, offset, selected.get("items") or {}, MAX_LIMIT, {})
    queryset = apply_filters(visible_groups(info), filters or {}, info.context["request"].user, LOOKUPS, METHODS)
    order_by = ordering(order, ORDERINGS, default="NAME")
    return page(selected, queryset, load_selected, order_by, limit, offset)


@query.field("group")
def resolve_group(_, info: GraphQLResolveInfo, id: int):
    return load_selected(visible_groups(info), selection_tree(info)).filter(pk=id).order_by().first()
