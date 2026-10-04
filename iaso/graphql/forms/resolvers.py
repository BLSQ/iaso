from typing import Any, Dict, Optional

from ariadne import QueryType
from django.db.models import QuerySet
from graphql import GraphQLResolveInfo

from iaso.models import Form, FormVersion

from ..common import check_page, ordering, orderings, page, requesting_user, selection_tree
from .filters import apply_form_filters, apply_version_filters
from .selection import FORM_FIELD_LIMITS, VERSION_FIELD_LIMITS, load_selected_forms, load_selected_versions


MAX_LIMIT = 1_000

FORM_ORDERINGS = orderings("id", "name", "created_at", "updated_at")
VERSION_ORDERINGS = orderings("id", "created_at", "updated_at")

query = QueryType()


def visible_forms(info: GraphQLResolveInfo) -> QuerySet:
    """The legacy `/api/forms/` read scope: the forms of a project of the user's account (and of their projects,
    if restricted to some), deleted ones excluded (`Form.objects`)."""
    user = requesting_user(info)
    return Form.objects.filter_for_user_and_app_id(user, None).filter_on_user_projects(user)


def visible_versions(info: GraphQLResolveInfo) -> QuerySet:
    """The versions of the visible forms: the legacy `/api/formversions/` scope, plus the project restriction."""
    return FormVersion.objects.filter(form_id__in=visible_forms(info).values("id"))


@query.field("forms")
def resolve_forms(
    _, info: GraphQLResolveInfo, limit: int, offset: int, filters: Optional[Dict[str, Any]] = None, order=None
):
    selected = selection_tree(info)
    check_page(limit, offset, selected.get("items") or {}, MAX_LIMIT, FORM_FIELD_LIMITS)
    queryset = apply_form_filters(visible_forms(info), filters or {}, info.context["request"].user)
    order_by = ordering(order, FORM_ORDERINGS, default="ID")
    return page(selected, queryset, load_selected_forms, order_by, limit, offset)


@query.field("form")
def resolve_form(_, info: GraphQLResolveInfo, id: int):
    return load_selected_forms(visible_forms(info), selection_tree(info)).filter(pk=id).order_by().first()


@query.field("formVersions")
def resolve_form_versions(
    _, info: GraphQLResolveInfo, limit: int, offset: int, filters: Optional[Dict[str, Any]] = None, order=None
):
    selected = selection_tree(info)
    check_page(limit, offset, selected.get("items") or {}, MAX_LIMIT, VERSION_FIELD_LIMITS)
    queryset = apply_version_filters(visible_versions(info), filters or {}, info.context["request"].user)
    order_by = ordering(order, VERSION_ORDERINGS, default="CREATED_AT_DESC")
    return page(selected, queryset, load_selected_versions, order_by, limit, offset)


@query.field("formVersion")
def resolve_form_version(_, info: GraphQLResolveInfo, id: int):
    return load_selected_versions(visible_versions(info), selection_tree(info)).filter(pk=id).order_by().first()
