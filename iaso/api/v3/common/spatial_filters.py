"""Spatial filters shared by v3 endpoints.

Core subset only (per product decision): bounding-box intersection/exclusion (`__within_or_intersects_bbox`/`__outside_bbox`)
and containment inside/outside another org unit's geometry (`__within_org_unit`/`__outside_org_unit`).
Point-in-arbitrary-polygon (`__contains`) and radius search (`__near`) are still deferred to a follow-up.
"""

import math

from functools import reduce
from operator import or_
from typing import List

import django_filters

from django.contrib.gis.db.models import GeometryField
from django.contrib.gis.geos import Polygon
from django.db.models import F, Func, Q
from drf_spectacular.types import OpenApiTypes

from iaso.models import OrgUnit

from .errors import bad_request
from .filterset import document_as


#: appended to every bbox filter's `help_text`
BBOX_HELP = " Longitudes -180..180, latitudes -90..90; `minx > maxx` means the box crosses the antimeridian."


def parse_bbox(value: str) -> List[Polygon]:
    """Parse a `minx,miny,maxx,maxy` string (degrees, as in GeoJSON / OGC API Features) into the planar
    longitude/latitude box(es) it covers (SRID 4326) - two when it crosses the antimeridian."""
    parts = value.split(",")
    if len(parts) != 4:
        raise bad_request(f"Invalid bbox value {value!r}", "Expected 'minx,miny,maxx,maxy'")
    try:
        minx, miny, maxx, maxy = coordinates = [float(part) for part in parts]
    except ValueError:
        raise bad_request(f"Invalid bbox value {value!r}", "All 4 values must be numbers")
    # `float()` also accepts "nan"/"inf": GEOS raises an uncaught `GEOSException` (a 500) on NaN.
    if not all(math.isfinite(coordinate) for coordinate in coordinates):
        raise bad_request(f"Invalid bbox value {value!r}", "All 4 values must be finite numbers")
    if not (-180 <= minx <= 180 and -180 <= maxx <= 180):
        raise bad_request(f"Invalid bbox value {value!r}", "Longitudes (minx, maxx) must be between -180 and 180")
    if not (-90 <= miny <= 90 and -90 <= maxy <= 90):
        raise bad_request(f"Invalid bbox value {value!r}", "Latitudes (miny, maxy) must be between -90 and 90")
    if miny > maxy:
        raise bad_request(
            f"Invalid bbox value {value!r}",
            "miny must be <= maxy (minx > maxx is allowed: the box then crosses the antimeridian)",
        )
    spans = [(minx, maxx)] if minx <= maxx else [(minx, 180.0), (-180.0, maxx)]
    boxes = [Polygon.from_bbox((west, miny, east, maxy)) for west, east in spans]
    for box in boxes:
        box.srid = 4326
    return boxes


def filter_bbox(queryset, geometry_field: str, value: str, exclude: bool = False):
    """Rows whose `geometry_field` intersects the `minx,miny,maxx,maxy` box (or, with `exclude`, rows that have
    a `geometry_field` that doesn't).

    Tested in planar longitude/latitude, on the column cast to `geometry`: the org unit columns are PostGIS
    `geography`, where polygon edges are great circles - a box's south/north edges then bulge towards the
    pole, a box of 180 degrees or more is ambiguous (a 500, or silently the wrong rows) and point-in-polygon
    gets confused by points lined up with a vertex. The cast can't use the `geography` GiST index, but the
    request is scoped to the user's account first and a lon/lat box test is cheap."""
    as_geometry = f"{geometry_field}_as_geometry"
    # PostGIS' `geometry(geography)` rather than a typed `::geometry(GEOMETRY,4326)` cast, which would reject the
    # 3D `location` column; `.alias()`, not `.annotate()`: the cast is only filtered on, never selected
    as_geometry_value = Func(F(geometry_field), function="geometry", output_field=GeometryField(srid=4326))
    queryset = queryset.alias(**{as_geometry: as_geometry_value})
    in_box = reduce(or_, (Q(**{f"{as_geometry}__intersects": box}) for box in parse_bbox(value)))
    if exclude:
        return queryset.filter(**{f"{geometry_field}__isnull": False}).exclude(in_box)
    return queryset.filter(in_box)


def resolve_reference_geometry(org_unit_id: str, operator_name: str, user=None):
    """Fetch the geometry (`simplified_geom`, falling back to `geom`) of the org unit referenced by a
    `*__within_org_unit` filter, raising the spec'd 400 error if it has neither.

    Scoped to `user` (via `filter_for_user`) so that an org unit id belonging to another account is
    indistinguishable from one that doesn't exist at all - otherwise a user with zero access to that
    account could still tell the two apart (and probe its geometry) purely from the response."""
    queryset = OrgUnit.objects.filter_for_user(user) if user is not None else OrgUnit.objects.all()
    try:
        reference = queryset.only("id", "geom", "simplified_geom").get(pk=org_unit_id)
    except (OrgUnit.DoesNotExist, ValueError, TypeError):
        raise bad_request(f"Org unit {org_unit_id} does not exist")

    geometry = reference.simplified_geom or reference.geom
    if geometry is None:
        raise bad_request(
            f"Org unit {org_unit_id} has no geometry",
            f"Operator {operator_name!r} requires the referenced org unit to have a geom or simplified_geom.",
        )
    return geometry


class _BboxFilterBase(django_filters.CharFilter):
    """Shared base for `bbox`/`outside_bbox`: both parse the same `minx,miny,maxx,maxy` box, they just
    apply it as a `filter()` (intersects) vs. an `exclude()` (does not intersect)."""

    def __init__(self, *args, geometry_field: str, **kwargs):
        super().__init__(*args, **kwargs)
        self.geometry_field = geometry_field
        self.extra["help_text"] = self.extra.get("help_text", "") + BBOX_HELP


class WithinOrIntersectsBboxFilter(_BboxFilterBase):
    """`<field>__within_or_intersects_bbox=minx,miny,maxx,maxy` -> keep rows whose geometry is inside the bounding
    box or overlaps it (for a point: inside it or on its edge)."""

    def filter(self, qs, value):
        if value in (None, ""):
            return qs
        return filter_bbox(qs, self.geometry_field, value)


class OutsideBboxFilter(_BboxFilterBase):
    """`<field>__outside_bbox=minx,miny,maxx,maxy` -> keep rows that HAVE a `geometry_field` value but it
    does NOT intersect the bounding box (e.g. points recorded outside a country's box - a cheap
    approximate counterpart to `__outside_org_unit` that doesn't require the reference org unit to carry
    its own geometry, just a known real-world bbox). Rows where `geometry_field` is null are excluded
    rather than treated as "outside": there's nothing to compare."""

    def filter(self, qs, value):
        if value in (None, ""):
            return qs
        return filter_bbox(qs, self.geometry_field, value, exclude=True)


class _OrgUnitContainmentFilter(django_filters.CharFilter):
    """Shared base for `within_org_unit`/`outside_org_unit`: both resolve the same reference geometry,
    they just apply it as a `filter()` vs. an `exclude()`."""

    def __init__(self, *args, geometry_field: str, **kwargs):
        super().__init__(*args, **kwargs)
        self.geometry_field = geometry_field
        # an org unit id - a `CharFilter` only so that any bad id gets the same "does not exist" 400
        document_as(self, OpenApiTypes.INT)

    @property
    def _requesting_user(self):
        request = getattr(self.parent, "request", None)
        return getattr(request, "user", None)


class WithinOrgUnitFilter(_OrgUnitContainmentFilter):
    """`<field>__within_org_unit=<org unit id>` -> keep rows whose geometry is contained within the
    referenced org unit's geometry."""

    def filter(self, qs, value):
        if value in (None, ""):
            return qs
        reference_geometry = resolve_reference_geometry(value, self.field_name, user=self._requesting_user)
        return qs.filter(**{f"{self.geometry_field}__within": reference_geometry})


class OutsideOrgUnitFilter(_OrgUnitContainmentFilter):
    """`<field>__outside_org_unit=<org unit id>` -> keep rows that HAVE a `geometry_field` value but it's
    NOT contained within the referenced org unit's geometry (e.g. a district's org units whose recorded
    location falls outside the district's own shape - typically a data quality issue). Rows where
    `geometry_field` is null are excluded rather than treated as "outside": there's nothing to compare."""

    def filter(self, qs, value):
        if value in (None, ""):
            return qs
        reference_geometry = resolve_reference_geometry(value, self.field_name, user=self._requesting_user)
        return qs.filter(**{f"{self.geometry_field}__isnull": False}).exclude(
            **{f"{self.geometry_field}__within": reference_geometry}
        )
