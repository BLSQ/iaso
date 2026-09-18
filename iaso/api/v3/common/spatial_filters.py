"""Spatial filters shared by v3 endpoints.

Core subset only (per product decision): bounding-box intersection/exclusion (`__bbox`/`__outside_bbox`)
and containment inside/outside another org unit's geometry (`__within_org_unit`/`__outside_org_unit`).
Point-in-arbitrary-polygon (`__contains`) and radius search (`__near`) are still deferred to a follow-up.
"""

import django_filters

from django.contrib.gis.geos import Polygon
from django.core.exceptions import ValidationError as DjangoValidationError

from .errors import bad_request


def parse_bbox(value: str) -> Polygon:
    """Parse a `minx,miny,maxx,maxy` string into a GEOS Polygon (SRID 4326)."""
    parts = value.split(",")
    if len(parts) != 4:
        raise bad_request(f"Invalid bbox value {value!r}", "Expected 'minx,miny,maxx,maxy'")
    try:
        minx, miny, maxx, maxy = (float(part) for part in parts)
    except ValueError:
        raise bad_request(f"Invalid bbox value {value!r}", "All 4 values must be numbers")
    try:
        polygon = Polygon.from_bbox((minx, miny, maxx, maxy))
    except DjangoValidationError as e:
        raise bad_request(f"Invalid bbox value {value!r}", str(e))
    polygon.srid = 4326
    return polygon


def resolve_reference_geometry(org_unit_model, org_unit_id: str, operator_name: str, user=None):
    """Fetch the geometry (`simplified_geom`, falling back to `geom`) of the org unit referenced by a
    `*__within_org_unit` filter, raising the spec'd 400 error if it has neither.

    Scoped to `user` (via `filter_for_user`) so that an org unit id belonging to another account is
    indistinguishable from one that doesn't exist at all - otherwise a user with zero access to that
    account could still tell the two apart (and probe its geometry) purely from the response."""
    queryset = org_unit_model.objects.filter_for_user(user) if user is not None else org_unit_model.objects.all()
    try:
        reference = queryset.only("id", "geom", "simplified_geom").get(pk=org_unit_id)
    except (org_unit_model.DoesNotExist, ValueError, TypeError):
        raise bad_request(f"Org unit {org_unit_id!r} does not exist")

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


class BboxFilter(_BboxFilterBase):
    """`<field>__bbox=minx,miny,maxx,maxy` -> keep rows whose geometry intersects the bounding box."""

    def filter(self, qs, value):
        if value in (None, ""):
            return qs
        polygon = parse_bbox(value)
        return qs.filter(**{f"{self.geometry_field}__intersects": polygon})


class OutsideBboxFilter(_BboxFilterBase):
    """`<field>__outside_bbox=minx,miny,maxx,maxy` -> keep rows that HAVE a `geometry_field` value but it
    does NOT intersect the bounding box (e.g. points recorded outside a country's box - a cheap
    approximate counterpart to `__outside_org_unit` that doesn't require the reference org unit to carry
    its own geometry, just a known real-world bbox). Rows where `geometry_field` is null are excluded
    rather than treated as "outside": there's nothing to compare."""

    def filter(self, qs, value):
        if value in (None, ""):
            return qs
        polygon = parse_bbox(value)
        return qs.filter(**{f"{self.geometry_field}__isnull": False}).exclude(
            **{f"{self.geometry_field}__intersects": polygon}
        )


class _OrgUnitContainmentFilter(django_filters.CharFilter):
    """Shared base for `within_org_unit`/`outside_org_unit`: both resolve the same reference geometry,
    they just apply it as a `filter()` vs. an `exclude()`."""

    def __init__(self, *args, geometry_field: str, org_unit_model, **kwargs):
        super().__init__(*args, **kwargs)
        self.geometry_field = geometry_field
        self.org_unit_model = org_unit_model

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
        reference_geometry = resolve_reference_geometry(
            self.org_unit_model, value, self.field_name, user=self._requesting_user
        )
        return qs.filter(**{f"{self.geometry_field}__within": reference_geometry})


class OutsideOrgUnitFilter(_OrgUnitContainmentFilter):
    """`<field>__outside_org_unit=<org unit id>` -> keep rows that HAVE a `geometry_field` value but it's
    NOT contained within the referenced org unit's geometry (e.g. a district's org units whose recorded
    location falls outside the district's own shape - typically a data quality issue). Rows where
    `geometry_field` is null are excluded rather than treated as "outside": there's nothing to compare."""

    def filter(self, qs, value):
        if value in (None, ""):
            return qs
        reference_geometry = resolve_reference_geometry(
            self.org_unit_model, value, self.field_name, user=self._requesting_user
        )
        return qs.filter(**{f"{self.geometry_field}__isnull": False}).exclude(
            **{f"{self.geometry_field}__within": reference_geometry}
        )
