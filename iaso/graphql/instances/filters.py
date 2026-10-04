"""`instances(filters: InstanceFilter)` - the `InstanceV3FilterSet` of the v3 design (`/api/v3/instances/`, not
built in REST yet), one flat input, all AND-ed, each filter at most once.

Same lookup rules as `/api/v3/orgunits/`: each field only gets the lookups its index can serve - `In` on the
indexed ids, `Gte`/`Lte` on the indexed timestamps and `period`, `IContains` only through a small related table
(`form`) or the org unit name v3 already allows. No lookup on the unindexed `uuid`/`export_id`/`correlation_id`,
no filter on the submitted `json` content.
"""

import math

from functools import reduce
from operator import or_
from typing import Any, Dict, List

from django.contrib.gis.geos import Point, Polygon
from django.contrib.gis.measure import D
from django.db.models import Q, QuerySet
from graphql import GraphQLError

from iaso.models import Instance

from ..common import (
    FilterMethod,
    apply_filters as apply_lookups_and_methods,
    bbox_polygons,
    containment_filter,
    visible_org_unit,
)
from .expressions import is_reference_instance, location_overlaps, status


#: `locationNear` is for "around this point", not a substitute for a bbox: the bigger the radius, the more rows the
#: exact distance is computed for
MAX_NEAR_METERS = 100_000
METERS_PER_DEGREE = 111_320

LOOKUPS = {
    "id": "id",
    "idIn": "id__in",
    "formId": "form_id",
    "formIdIn": "form_id__in",
    "formNameIContains": "form__name__icontains",
    "orgUnitId": "org_unit_id",
    "orgUnitIdIn": "org_unit_id__in",
    "orgUnitNameIContains": "org_unit__name__icontains",
    "orgUnitSourceRef": "org_unit__source_ref",
    "orgUnitTypeId": "org_unit__org_unit_type_id",
    "orgUnitTypeIdIn": "org_unit__org_unit_type_id__in",
    "orgUnitValidationStatus": "org_unit__validation_status",
    "orgUnitValidationStatusIn": "org_unit__validation_status__in",
    "period": "period",
    "periodIn": "period__in",
    "periodGte": "period__gte",
    "periodLte": "period__lte",
    "createdAtGte": "created_at__gte",
    "createdAtLte": "created_at__lte",
    "updatedAtGte": "updated_at__gte",
    "updatedAtLte": "updated_at__lte",
    "sourceCreatedAtGte": "source_created_at__gte",
    "sourceCreatedAtLte": "source_created_at__lte",
    "sourceUpdatedAtGte": "source_updated_at__gte",
    "sourceUpdatedAtLte": "source_updated_at__lte",
    "createdById": "created_by_id",
    "createdByIdIn": "created_by_id__in",
    "lastModifiedById": "last_modified_by_id",
    "projectId": "project_id",
    "projectIdIn": "project_id__in",
    "deviceId": "device_id",
    "entityId": "entity_id",
    "planningId": "planning_id",
    "planningIdIn": "planning_id__in",
    "accuracyLte": "accuracy__lte",
    "deleted": "deleted",
}


def _status_in(queryset: QuerySet, value: List[str], user) -> QuerySet:
    if set(value) == {Instance.STATUS_DUPLICATED}:
        # only a single-per-period form has duplicates: the per-row probe skips every other form's submissions
        queryset = queryset.filter(form__single_per_period=True)
    return queryset.alias(computed_status=status()).filter(computed_status__in=value)


def _status(queryset: QuerySet, value: str, user) -> QuerySet:
    return _status_in(queryset, [value], user)


def _has_location(queryset: QuerySet, value: bool, user) -> QuerySet:
    return queryset.filter(location__isnull=not value)


def _is_reference_instance(queryset: QuerySet, value: bool, user) -> QuerySet:
    return queryset.filter(is_reference_instance()) if value else queryset.exclude(is_reference_instance())


def _org_unit_ancestor_id(queryset: QuerySet, value: int, user) -> QuerySet:
    """The org unit itself included, like the legacy `orgUnitParentId` (unlike `orgUnits`' `ancestorId`): the
    submissions "of a region" include the ones attached to the region itself."""
    ancestor = visible_org_unit(user, value, "path")
    if ancestor.path is None:
        return queryset.none()
    return queryset.filter(org_unit__path__descendants=str(ancestor.path))


def _location_near(queryset: QuerySet, value: Dict[str, float], user) -> QuerySet:
    longitude, latitude, meters = value["longitude"], value["latitude"], value["distanceMeters"]
    if not (
        math.isfinite(longitude) and -180 <= longitude <= 180 and math.isfinite(latitude) and -90 <= latitude <= 90
    ):
        raise GraphQLError("Invalid locationNear: longitude must be between -180 and 180, latitude between -90 and 90")
    if not 0 < meters <= MAX_NEAR_METERS:
        raise GraphQLError(f"Invalid locationNear: distanceMeters must be between 0 and {MAX_NEAR_METERS}")
    point = Point(longitude, latitude, srid=4326)
    # the index narrows to a box around the point, wide enough at this latitude (a degree of longitude shrinks with
    # cos(latitude)), then the exact distance on the sphere for what it lets through
    degrees = meters / (METERS_PER_DEGREE * max(math.cos(math.radians(latitude)), 0.01))
    box = Polygon.from_bbox((longitude - degrees, latitude - degrees, longitude + degrees, latitude + degrees))
    box.srid = 4326
    return queryset.filter(location_overlaps(box), location__distance_lte=(point, D(m=meters)))


def _location_bbox(outside: bool) -> FilterMethod:
    """For a point, overlapping the box is being in it (or on its edge): the index answers alone."""

    def apply(queryset: QuerySet, value: Dict[str, float], user) -> QuerySet:
        in_box = reduce(or_, (Q(location_overlaps(box)) for box in bbox_polygons(value)))
        if outside:
            return queryset.filter(location__isnull=False).exclude(in_box)
        return queryset.filter(in_box)

    return apply


def _location_within_org_unit(queryset: QuerySet, value: int, user) -> QuerySet:
    """Against the org unit's `simplified_geom`, else its `geom`: the index narrows to its bounding box first."""
    reference = visible_org_unit(user, value, "geom", "simplified_geom")
    geometry = reference.simplified_geom or reference.geom
    if geometry is None:
        raise GraphQLError(f"Org unit {value} has no geom or simplified_geom")
    return queryset.filter(location_overlaps(geometry), location__within=geometry)


METHODS: Dict[str, FilterMethod] = {
    "status": _status,
    "statusIn": _status_in,
    "hasLocation": _has_location,
    "isReferenceSubmission": _is_reference_instance,
    "orgUnitAncestorId": _org_unit_ancestor_id,
    "locationNear": _location_near,
    "locationWithinBbox": _location_bbox(outside=False),
    "locationOutsideBbox": _location_bbox(outside=True),
    "locationWithinOrgUnit": _location_within_org_unit,
    "locationOutsideOrgUnit": containment_filter("location", outside=True),
}


def apply_filters(queryset: QuerySet, filters: Dict[str, Any], user) -> QuerySet:
    if filters.get("deleted") is None:
        queryset = queryset.filter(deleted=False)  # the deleted submissions only when asked for, like v1
    return apply_lookups_and_methods(queryset, filters, user, LOOKUPS, METHODS)
