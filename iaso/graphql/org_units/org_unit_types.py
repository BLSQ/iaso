"""`orgUnitTypes` / `orgUnitType`: the scope of `GET /api/v2/orgunittypes/` - the types of a project of the user's
account -, readable by any logged-in user, as there. Its lists (`subUnitTypes`, `referenceForms`, `projects`) are
each one query for the whole page, limited to the account too."""

from typing import Any, Dict, List, Optional

from ariadne import ObjectType, QueryType
from django.db.models import Exists, OuterRef, Prefetch, Q, QuerySet
from graphql import GraphQLResolveInfo

from iaso.models import Form, OrgUnitType, Project

from ..common import (
    PROJECT_COLUMNS,
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
from ..forms.selection import FORM_SUMMARY_COLUMNS
from .selection import ORG_UNIT_TYPE_COLUMNS


MAX_LIMIT = 1_000

#: GraphQL field -> model column, for the fields read straight from a column
COLUMNS = {**ORG_UNIT_TYPE_COLUMNS, "createdAt": "created_at", "updatedAt": "updated_at"}
ORDERINGS = orderings("id", "name", "depth", "created_at", "updated_at")

query = QueryType()
org_unit_type = ObjectType("OrgUnitType")


def account_id(info: GraphQLResolveInfo) -> Optional[int]:
    profile = getattr(requesting_user(info), "iaso_profile", None)
    return profile.account_id if profile is not None else None


def of_account(account: Optional[int]) -> QuerySet:
    """The types linked to a project of the account."""
    linked = OrgUnitType.projects.through.objects.filter(orgunittype_id=OuterRef("pk"), project__account_id=account)
    return OrgUnitType.objects.filter(Exists(linked))


def _search(queryset: QuerySet, value: str, user) -> QuerySet:
    return queryset.filter(Q(name__icontains=value) | Q(short_name__icontains=value))


def _projects(queryset: QuerySet, value, user) -> QuerySet:
    ids: List[int] = value if isinstance(value, list) else [value]
    linked = OrgUnitType.projects.through.objects.filter(orgunittype_id=OuterRef("pk"), project_id__in=ids)
    return queryset.filter(Exists(linked))


LOOKUPS = {"id": "id", "idIn": "id__in", "category": "category", "depth": "depth"}
METHODS: Dict[str, FilterMethod] = {"search": _search, "projectId": _projects, "projectIdIn": _projects}


def load_selected(queryset: QuerySet, fields: SelectionTree, account: Optional[int]) -> QuerySet:
    """`queryset` loading only the selected `fields`, one more query per selected list for the whole page."""
    for field, relation in (
        ("subUnitTypes", "sub_unit_types"),
        ("allowCreatingSubUnitTypes", "allow_creating_sub_unit_types"),
    ):
        if field in fields:
            types = (
                of_account(account)
                .only("id", *columns(fields[field], ORG_UNIT_TYPE_COLUMNS))
                .order_by("depth", "name", "id")
            )
            queryset = queryset.prefetch_related(Prefetch(relation, queryset=types, to_attr=f"{relation}_list"))
    if "referenceForms" in fields:
        # the account's forms (deleted ones excluded by `Form.objects`)
        linked = Form.projects.through.objects.filter(form_id=OuterRef("pk"), project__account_id=account)
        forms = Form.objects.filter(Exists(linked)).only("id", *columns(fields["referenceForms"], FORM_SUMMARY_COLUMNS))
        queryset = queryset.prefetch_related(
            Prefetch("reference_forms", queryset=forms.order_by("name", "id"), to_attr="reference_form_list")
        )
    if "projects" in fields:
        projects = Project.objects.filter(account_id=account).only("id", *columns(fields["projects"], PROJECT_COLUMNS))
        queryset = queryset.prefetch_related(
            Prefetch("projects", queryset=projects.order_by("id"), to_attr="project_list")
        )
    return queryset.only("id", *columns(fields, COLUMNS))


@query.field("orgUnitTypes")
def resolve_org_unit_types(
    _, info: GraphQLResolveInfo, limit: int, offset: int, filters: Optional[Dict[str, Any]] = None, order=None
):
    selected = selection_tree(info)
    check_page(limit, offset, selected.get("items") or {}, MAX_LIMIT, {})
    account = account_id(info)
    queryset = apply_filters(of_account(account), filters or {}, info.context["request"].user, LOOKUPS, METHODS)
    order_by = ordering(order or ["DEPTH", "NAME"], ORDERINGS, default="DEPTH")
    return page(selected, queryset, lambda rows, fields: load_selected(rows, fields, account), order_by, limit, offset)


@query.field("orgUnitType")
def resolve_org_unit_type(_, info: GraphQLResolveInfo, id: int):
    account = account_id(info)
    return load_selected(of_account(account), selection_tree(info), account).filter(pk=id).order_by().first()


@org_unit_type.field("subUnitTypes")
def resolve_sub_unit_types(org_unit_type, _info):
    return org_unit_type.sub_unit_types_list  # prefetched


@org_unit_type.field("allowCreatingSubUnitTypes")
def resolve_allow_creating_sub_unit_types(org_unit_type, _info):
    return org_unit_type.allow_creating_sub_unit_types_list  # prefetched


@org_unit_type.field("referenceForms")
def resolve_reference_forms(org_unit_type, _info):
    return org_unit_type.reference_form_list  # prefetched


@org_unit_type.field("projects")
def resolve_projects(org_unit_type, _info):
    return org_unit_type.project_list  # prefetched
