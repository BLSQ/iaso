"""`orgUnits(filters: OrgUnitFilter)` - the `/api/v3/orgunits/` FilterSet (`OrgUnitFilterSetV3`), one flat input.

Every filter maps to one v3 query param: a plain lookup (`LOOKUPS`) or a method (`METHODS`). They are all
AND-ed, each at most once - the input type has no AND/OR/NOT and no nesting, so a request can't build a filter
v3 couldn't.
"""

from typing import Any, Dict

from django.db.models import Q, QuerySet

from ..common import (
    FilterMethod,
    apply_filters as apply_lookups_and_methods,
    bbox_filter,
    containment_filter,
    visible_org_unit,
)


LOOKUPS = {
    "id": "id",
    "idIn": "id__in",
    "name": "name",
    "nameIContains": "name__icontains",
    "nameStartsWith": "name__startswith",
    "sourceRef": "source_ref",
    "sourceRefIn": "source_ref__in",
    "sourceRefStartsWith": "source_ref__startswith",
    "code": "code",
    "codeIn": "code__in",
    "validationStatus": "validation_status",
    "validationStatusIn": "validation_status__in",
    "orgUnitTypeId": "org_unit_type_id",
    "parentId": "parent_id",
    "ancestorIdDirectChildren": "parent_id",
    "groupId": "groups__id",
    "sourceId": "version__data_source_id",
    "versionId": "version_id",
    "projectId": "org_unit_type__projects__id",
    "orgUnitTypeNameIContains": "org_unit_type__name__icontains",
    "orgUnitTypeCategory": "org_unit_type__category",
    "parentNameIContains": "parent__name__icontains",
    "parentSourceRef": "parent__source_ref",
    "sourceCreatedAtGte": "source_created_at__gte",
    "sourceCreatedAtLte": "source_created_at__lte",
    "createdAtGte": "created_at__gte",
    "createdAtLte": "created_at__lte",
    "updatedAtGte": "updated_at__gte",
    "updatedAtLte": "updated_at__lte",
    "openingDateGte": "opening_date__gte",
    "openingDateLte": "opening_date__lte",
    "closedDateGte": "closed_date__gte",
    "closedDateLte": "closed_date__lte",
    "geomIsNull": "geom__isnull",
    "simplifiedGeomIsNull": "simplified_geom__isnull",
    "catchmentIsNull": "catchment__isnull",
    "locationIsNull": "location__isnull",
    "depth": "path__depth",
}


def _profile(user):
    return getattr(user, "iaso_profile", None)


def _search(queryset: QuerySet, value: str, user) -> QuerySet:
    return queryset.filter(Q(name__icontains=value) | Q(aliases__contains=[value]))


def _has_shape(queryset: QuerySet, value: bool, user) -> QuerySet:
    has_shape = Q(geom__isnull=False) | Q(simplified_geom__isnull=False)
    return queryset.filter(has_shape) if value else queryset.exclude(has_shape)


def _has_location(queryset: QuerySet, value: bool, user) -> QuerySet:
    return queryset.filter(location__isnull=not value)


def _default_version(queryset: QuerySet, value: bool, user) -> QuerySet:
    profile = _profile(user)
    if not value or profile is None or profile.account.default_version_id is None:
        return queryset
    return queryset.filter(version_id=profile.account.default_version_id)


def _roots_for_user(queryset: QuerySet, value: bool, user) -> QuerySet:
    if not value:
        return queryset
    profile = _profile(user)
    user_org_unit_ids = list(profile.org_units.values_list("id", flat=True)) if profile is not None else []
    if user_org_unit_ids and not user.is_superuser:
        return queryset.filter(id__in=user_org_unit_ids)
    return queryset.filter(parent__isnull=True)


def _ancestor_id(queryset: QuerySet, value: int, user) -> QuerySet:
    ancestor = visible_org_unit(user, value, "path")
    if ancestor.path is None:
        return queryset.none()
    return queryset.filter(path__descendants=str(ancestor.path), path__depth__gt=len(ancestor.path))


METHODS: Dict[str, FilterMethod] = {
    "search": _search,
    "hasShape": _has_shape,
    "hasLocation": _has_location,
    "defaultVersion": _default_version,
    "rootsForUser": _roots_for_user,
    "ancestorId": _ancestor_id,
    "geomWithinOrIntersectsBbox": bbox_filter("geom", outside=False),
    "simplifiedGeomWithinOrIntersectsBbox": bbox_filter("simplified_geom", outside=False),
    "locationWithinBbox": bbox_filter("location", outside=False),
    "geomOutsideBbox": bbox_filter("geom", outside=True),
    "simplifiedGeomOutsideBbox": bbox_filter("simplified_geom", outside=True),
    "locationOutsideBbox": bbox_filter("location", outside=True),
    "geomWithinOrgUnit": containment_filter("geom", outside=False),
    "locationWithinOrgUnit": containment_filter("location", outside=False),
    "geomOutsideOrgUnit": containment_filter("geom", outside=True),
    "locationOutsideOrgUnit": containment_filter("location", outside=True),
}


def apply_filters(queryset: QuerySet, filters: Dict[str, Any], user) -> QuerySet:
    return apply_lookups_and_methods(queryset, filters, user, LOOKUPS, METHODS)
