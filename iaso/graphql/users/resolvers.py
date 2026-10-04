"""`users` / `user` / `me`: the scope of `GET /api/profiles/` - the users of the requesting user's account -, with
its read permissions ("users admin" or "users managed"; `me` for anyone). A user's profile (language, phone...) is
joined, their `projects` and `orgUnits` are each one query for the whole page."""

from typing import Any, Dict, Optional

from ariadne import ObjectType, QueryType
from django.contrib.auth.models import User
from django.db.models import Prefetch, Q, QuerySet
from graphql import GraphQLError, GraphQLResolveInfo

from iaso.api.profiles.policies import ManagedUsersPolicy
from iaso.models import OrgUnit, Profile, Project
from iaso.permissions.core_permissions import CORE_USERS_ADMIN_PERMISSION, CORE_USERS_MANAGED_PERMISSION

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
from ..org_units.selection import SUMMARY_COLUMNS, USER_COLUMNS


MAX_LIMIT = 1_000

#: any of them, as the REST endpoint
READ_PERMISSIONS = (CORE_USERS_ADMIN_PERMISSION, CORE_USERS_MANAGED_PERMISSION)

#: GraphQL field -> column, the `User`'s then its profile's
COLUMNS = {**USER_COLUMNS, "isActive": "is_active", "dateJoined": "date_joined", "lastLogin": "last_login"}
PROFILE_COLUMNS = {
    "profileId": "id",
    "language": "language",
    "phoneNumber": "phone_number",
    "organization": "organization",
    "dhis2Id": "dhis2_id",
}
#: page size caps: a list per user
FIELD_LIMITS = {"projects": 100, "orgUnits": 100}
ORDERINGS = orderings("id", "username", "last_name", "date_joined", "last_login")

query = QueryType()
user_type = ObjectType("User")


def _account_id(user) -> Optional[int]:
    profile = getattr(user, "iaso_profile", None)
    return profile.account_id if profile is not None else None


def visible_users(info: GraphQLResolveInfo) -> QuerySet:
    user = requesting_user(info)
    if not any(user.has_perm(permission.full_name()) for permission in READ_PERMISSIONS):
        raise GraphQLError("You do not have permission to see users.", extensions={"code": "FORBIDDEN"})
    return User.objects.filter(iaso_profile__account_id=_account_id(user))


def _search(queryset: QuerySet, value: str, user) -> QuerySet:
    return queryset.filter(
        Q(username__icontains=value)
        | Q(first_name__icontains=value)
        | Q(last_name__icontains=value)
        | Q(email__icontains=value)
    )


def _managed_only(queryset: QuerySet, value: bool, user) -> QuerySet:
    """`ManagedUsersPolicy`: everyone for a users admin, else those assigned below the requester's org units."""
    if not value:
        return queryset
    managed = ManagedUsersPolicy.authorize_list(user, Profile.objects.filter(account_id=_account_id(user)))
    return queryset.filter(iaso_profile__id__in=managed.values("id"))


LOOKUPS = {
    "id": "id",
    "idIn": "id__in",
    "isActive": "is_active",
    "projectId": "iaso_profile__projects__id",
    "orgUnitId": "iaso_profile__org_units__id",
}
METHODS: Dict[str, FilterMethod] = {"search": _search, "managedOnly": _managed_only}


def load_selected(queryset: QuerySet, fields: SelectionTree, account: Optional[int]) -> QuerySet:
    """`queryset` of `User` loading only the selected `fields`: the profile joined, one more query per selected list
    for the whole page. Only the account's projects."""
    only = ["id", *columns(fields, COLUMNS)]
    profile_fields = columns(fields, PROFILE_COLUMNS, "iaso_profile__")
    if profile_fields or "projects" in fields or "orgUnits" in fields:
        queryset = queryset.select_related("iaso_profile")
        only += ["iaso_profile", "iaso_profile__id", "iaso_profile__user", *profile_fields]
    if "projects" in fields:
        projects = Project.objects.filter(account_id=account).only("id", *columns(fields["projects"], PROJECT_COLUMNS))
        queryset = queryset.prefetch_related(Prefetch("iaso_profile__projects", queryset=projects.order_by("id")))
    if "orgUnits" in fields:
        org_units = OrgUnit.objects.only("id", *columns(fields["orgUnits"], SUMMARY_COLUMNS))
        queryset = queryset.prefetch_related(
            Prefetch("iaso_profile__org_units", queryset=org_units.order_by("name", "id"))
        )
    return queryset.only(*only)


@query.field("users")
def resolve_users(
    _, info: GraphQLResolveInfo, limit: int, offset: int, filters: Optional[Dict[str, Any]] = None, order=None
):
    selected = selection_tree(info)
    check_page(limit, offset, selected.get("items") or {}, MAX_LIMIT, FIELD_LIMITS)
    requester = info.context["request"].user
    queryset = apply_filters(visible_users(info), filters or {}, requester, LOOKUPS, METHODS)
    account = _account_id(requester)
    order_by = ordering(order, ORDERINGS, default="ID")
    return page(selected, queryset, lambda rows, fields: load_selected(rows, fields, account), order_by, limit, offset)


@query.field("user")
def resolve_user(_, info: GraphQLResolveInfo, id: int):
    account = _account_id(info.context["request"].user)
    return load_selected(visible_users(info), selection_tree(info), account).filter(pk=id).order_by().first()


@query.field("me")
def resolve_me(_, info: GraphQLResolveInfo):
    user = requesting_user(info)
    return load_selected(User.objects.filter(pk=user.pk), selection_tree(info), _account_id(user)).get()


def _profile(user) -> Optional[Profile]:
    return getattr(user, "iaso_profile", None)


@user_type.field("profileId")
def resolve_profile_id(user, _info):
    profile = _profile(user)
    return profile.id if profile is not None else None


@user_type.field("language")
@user_type.field("organization")
@user_type.field("dhis2Id")
def resolve_profile_field(user, info: GraphQLResolveInfo):
    profile = _profile(user)
    column = {"language": "language", "organization": "organization", "dhis2Id": "dhis2_id"}[info.field_name]
    return getattr(profile, column) if profile is not None else None


@user_type.field("phoneNumber")
def resolve_phone_number(user, _info):
    profile = _profile(user)
    return str(profile.phone_number) if profile is not None and profile.phone_number else None


@user_type.field("projects")
def resolve_projects(user, _info):
    profile = _profile(user)
    return profile.projects.all() if profile is not None else []  # prefetched


@user_type.field("orgUnits")
def resolve_org_units(user, _info):
    profile = _profile(user)
    return profile.org_units.all() if profile is not None else []  # prefetched
