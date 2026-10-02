"""`orgUnits(filters: ...)` - the GraphQL counterpart of `OrgUnitFilterSetV3` (`/api/v3/orgunits/`).

Same deliberate lookup surface as v3, rather than strawberry-django's generic `FilterLookup` (which offers
`iContains`/`regex`/`endsWith` on every text field): `iContains` only on free-text fields, `exact`/`inList`/
`startsWith` on the indexed references, and a core subset of spatial operators.
"""

import math

from datetime import date, datetime, timedelta
from functools import reduce
from operator import or_
from typing import List, Optional

import strawberry
import strawberry_django

from django.contrib.gis.geos import Polygon
from django.db.models import Q, QuerySet
from graphql import GraphQLError
from strawberry import UNSET
from strawberry.types import Info
from strawberry_django import filter_field

from iaso.models import OrgUnit

from .expressions import as_geometry
from .types import OrgUnitTypeCategory, ValidationStatus


#: Postgres' `timestamptz` rejects a UTC offset of 16 hours or more - an uncaught `DataError` otherwise.
POSTGRES_MAX_TZ_OFFSET = timedelta(hours=16)


def _user(info: Info):
    return info.context.request.user


# -- lookups --


@strawberry.input
class IntLookup:
    exact: Optional[int] = filter_field()
    in_list: Optional[List[int]] = filter_field()


@strawberry.input(description="Case-insensitive only, not accent-insensitive")
class NameLookup:
    exact: Optional[str] = filter_field()
    i_contains: Optional[str] = filter_field()
    starts_with: Optional[str] = filter_field()


@strawberry.input(description="Indexed reference: no iContains (a btree index doesn't help LIKE '%x%')")
class RefLookup:
    exact: Optional[str] = filter_field()
    in_list: Optional[List[str]] = filter_field()
    starts_with: Optional[str] = filter_field()


@strawberry.input
class CodeLookup:
    exact: Optional[str] = filter_field()
    in_list: Optional[List[str]] = filter_field()


@strawberry.input
class ValidationStatusLookup:
    exact: Optional[ValidationStatus] = filter_field()
    in_list: Optional[List[ValidationStatus]] = filter_field()


@strawberry.input
class DatetimeRange:
    gte: Optional[datetime] = UNSET
    lte: Optional[datetime] = UNSET

    @filter_field
    def filter(self, queryset: QuerySet, prefix: str):
        q = Q()
        for lookup in ("gte", "lte"):
            value = getattr(self, lookup)
            if value in (UNSET, None):
                continue
            if value.utcoffset() is not None and abs(value.utcoffset()) >= POSTGRES_MAX_TZ_OFFSET:
                raise GraphQLError(f"Time zone offset in {value.isoformat()!r} must be within 16 hours of UTC.")
            q &= Q(**{f"{prefix}{lookup}": value})
        return queryset, q


@strawberry.input
class DateRange:
    gte: Optional[date] = filter_field()
    lte: Optional[date] = filter_field()


@strawberry.input(description="Degrees, as in GeoJSON. `minx > maxx` means the box crosses the antimeridian.")
class Bbox:
    minx: float
    miny: float
    maxx: float
    maxy: float

    def polygons(self) -> List[Polygon]:
        """The planar lon/lat box(es) covered - two when crossing the antimeridian."""
        coordinates = (self.minx, self.miny, self.maxx, self.maxy)
        if not all(math.isfinite(c) for c in coordinates):
            raise GraphQLError("Invalid bbox: all 4 values must be finite numbers")
        if not (-180 <= self.minx <= 180 and -180 <= self.maxx <= 180):
            raise GraphQLError("Invalid bbox: longitudes (minx, maxx) must be between -180 and 180")
        if not (-90 <= self.miny <= 90 and -90 <= self.maxy <= 90):
            raise GraphQLError("Invalid bbox: latitudes (miny, maxy) must be between -90 and 90")
        if self.miny > self.maxy:
            raise GraphQLError("Invalid bbox: miny must be <= maxy")
        spans = [(self.minx, self.maxx)] if self.minx <= self.maxx else [(self.minx, 180.0), (-180.0, self.maxx)]
        boxes = [Polygon.from_bbox((west, self.miny, east, self.maxy)) for west, east in spans]
        for box in boxes:
            box.srid = 4326
        return boxes


def _bbox_filter(queryset: QuerySet, prefix: str, bbox: Bbox, outside: bool):
    """Tested in planar lon/lat on the column cast to `geometry` (see `filter_bbox` in v3 for why not on the
    `geography` itself). Org units without that geometry are never "outside": nothing to compare."""
    column = prefix[:-2]
    alias = f"{column}_as_geometry"
    queryset = queryset.alias(**{alias: as_geometry(column)})
    in_box = reduce(or_, (Q(**{f"{alias}__intersects": box}) for box in bbox.polygons()))
    if outside:
        return queryset, Q(**{f"{column}__isnull": False}) & ~in_box
    return queryset, in_box


def _reference_geometry(info: Info, org_unit_id: int):
    """Scoped to the requesting user: another account's org unit is indistinguishable from a missing one."""
    try:
        reference = (
            OrgUnit.objects.filter_for_user(_user(info)).only("id", "geom", "simplified_geom").get(pk=org_unit_id)
        )
    except OrgUnit.DoesNotExist:
        raise GraphQLError(f"Org unit {org_unit_id} does not exist")
    geometry = reference.simplified_geom or reference.geom
    if geometry is None:
        raise GraphQLError(f"Org unit {org_unit_id} has no geom or simplified_geom")
    return geometry


def _containment_filter(info: Info, queryset: QuerySet, prefix: str, org_unit_id: int, outside: bool):
    column = prefix[:-2]
    within = Q(**{f"{column}__within": _reference_geometry(info, org_unit_id)})
    if outside:
        return queryset, Q(**{f"{column}__isnull": False}) & ~within
    return queryset, within


@strawberry.input
class ShapeFilter:
    is_null: Optional[bool] = filter_field()

    @filter_field(description="Inside the box, or overlapping it")
    def within_or_intersects_bbox(self, queryset: QuerySet, prefix: str, value: Bbox):
        return _bbox_filter(queryset, prefix, value, outside=False)

    @filter_field(description="Has this geometry, and it doesn't intersect the box")
    def outside_bbox(self, queryset: QuerySet, prefix: str, value: Bbox):
        return _bbox_filter(queryset, prefix, value, outside=True)


@strawberry.input
class ContainableShapeFilter(ShapeFilter):
    @filter_field(description="Contained within that org unit's simplified_geom (else geom)")
    def within_org_unit(self, info: Info, queryset: QuerySet, prefix: str, value: int):
        return _containment_filter(info, queryset, prefix, value, outside=False)

    @filter_field(description="Has this geometry, and it isn't contained within that org unit's geometry")
    def outside_org_unit(self, info: Info, queryset: QuerySet, prefix: str, value: int):
        return _containment_filter(info, queryset, prefix, value, outside=True)


@strawberry.input
class OrgUnitTypeFilter:
    name: Optional[NameLookup] = filter_field()
    category: Optional[OrgUnitTypeCategory] = filter_field()


@strawberry.input
class ParentFilter:
    name: Optional[NameLookup] = filter_field()
    source_ref: Optional[str] = filter_field()


@strawberry_django.filter_type(OrgUnit, lookups=False)
class OrgUnitFilter:
    id: Optional[IntLookup] = filter_field()
    name: Optional[NameLookup] = filter_field()
    source_ref: Optional[RefLookup] = filter_field()
    code: Optional[CodeLookup] = filter_field()
    validation_status: Optional[ValidationStatusLookup] = filter_field()

    org_unit_type_id: Optional[int] = filter_field()
    parent_id: Optional[int] = filter_field(
        description="Only the direct children of this org unit id. Use `ancestorId` for all descendants."
    )
    version_id: Optional[int] = filter_field()
    org_unit_type: Optional[OrgUnitTypeFilter] = filter_field()
    parent: Optional[ParentFilter] = filter_field()

    created_at: Optional[DatetimeRange] = filter_field()
    updated_at: Optional[DatetimeRange] = filter_field()
    source_created_at: Optional[DatetimeRange] = filter_field()
    opening_date: Optional[DateRange] = filter_field()
    closed_date: Optional[DateRange] = filter_field()

    geom: Optional[ContainableShapeFilter] = filter_field()
    simplified_geom: Optional[ShapeFilter] = filter_field()
    location: Optional[ContainableShapeFilter] = filter_field()
    catchment: Optional[ShapeFilter] = filter_field()

    @filter_field(description="Org units belonging to this group id")
    def group_id(self, value: int, prefix: str):
        return Q(**{f"{prefix}groups__id": value})

    @filter_field(description="Exact data source id (via the org unit's version)")
    def source_id(self, value: int, prefix: str):
        return Q(**{f"{prefix}version__data_source_id": value})

    @filter_field(description="Org units whose type is linked to this project id")
    def project_id(self, value: int, prefix: str):
        return Q(**{f"{prefix}org_unit_type__projects__id": value})

    @filter_field(description="Has a geom or simplified_geom")
    def has_shape(self, value: bool, prefix: str):
        has_shape = Q(**{f"{prefix}geom__isnull": False}) | Q(**{f"{prefix}simplified_geom__isnull": False})
        return has_shape if value else ~has_shape

    @filter_field(description="Has a location (point)")
    def has_location(self, value: bool, prefix: str):
        return Q(**{f"{prefix}location__isnull": not value})

    @filter_field(description="ltree path depth (1 = root)")
    def depth(self, value: int, prefix: str):
        return Q(**{f"{prefix}path__depth": value})

    @filter_field(description="All descendants of this org unit id, at any depth (excluding itself)")
    def ancestor_id(self, info: Info, queryset: QuerySet, value: int, prefix: str):
        try:
            ancestor = OrgUnit.objects.filter_for_user(_user(info)).only("id", "path").get(pk=value)
        except OrgUnit.DoesNotExist:
            raise GraphQLError(f"Org unit {value} does not exist")
        if ancestor.path is None:
            return queryset.none(), Q()
        return queryset, Q(
            **{f"{prefix}path__descendants": str(ancestor.path), f"{prefix}path__depth__gt": len(ancestor.path)}
        )

    @filter_field(description="Case-insensitive search across name and aliases")
    def search(self, value: str, prefix: str):
        return Q(**{f"{prefix}name__icontains": value}) | Q(**{f"{prefix}aliases__contains": [value]})

    @filter_field(description="If true, restrict to the requesting user's account's default source version")
    def default_version(self, info: Info, value: bool, prefix: str):
        profile = getattr(_user(info), "iaso_profile", None)
        if not value or profile is None or profile.account.default_version_id is None:
            return Q()
        return Q(**{f"{prefix}version_id": profile.account.default_version_id})

    @filter_field(description="If true, only the root org unit(s) visible to the requesting user")
    def roots_for_user(self, info: Info, value: bool, prefix: str):
        if not value:
            return Q()
        user = _user(info)
        profile = getattr(user, "iaso_profile", None)
        user_org_unit_ids = list(profile.org_units.values_list("id", flat=True)) if profile is not None else []
        if user_org_unit_ids and not user.is_superuser:
            return Q(**{f"{prefix}id__in": user_org_unit_ids})
        return Q(**{f"{prefix}parent__isnull": True})


@strawberry_django.order_type(OrgUnit)
class OrgUnitOrder:
    """`name` has no database index: ordering by it forces a full unindexed sort."""

    id: strawberry.auto
    name: strawberry.auto
    created_at: strawberry.auto
    updated_at: strawberry.auto
    opening_date: strawberry.auto
    closed_date: strawberry.auto
    validation_status: strawberry.auto
