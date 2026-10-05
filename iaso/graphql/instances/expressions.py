"""SQL for the computed `Instance` fields and filters - each only reaches the query when it is selected or used."""

from django.contrib.gis.db.models import GeometryField
from django.contrib.gis.geos import GEOSGeometry
from django.db.models import BooleanField, Case, CharField, Exists, F, FloatField, Func, OuterRef, Value, When

from iaso.models import Instance, OrgUnitReferenceInstance


def location_coordinate(function: str) -> Func:
    """`ST_X`/`ST_Y`/`ST_Z` of `Instance.location`, already a lon/lat `geometry` (unlike the org unit columns)."""
    return Func(F("location"), function=function, output_field=FloatField())


def location_overlaps(geometry: GEOSGeometry) -> Func:
    """`location &&& <the bounding box of geometry>`: the only operator the GiST index on `Instance.location` serves.
    It's an N-D index (`gist_geometry_ops_nd`, the column is 3D): `ST_DWithin`, `ST_Intersects` and `ST_Within`
    go through the 2D `&&`, which it doesn't serve - alone, they read every submission of the account."""
    return Func(
        F("location"),
        Value(geometry, output_field=GeometryField(srid=4326)),
        template="(%(expressions)s)",
        arg_joiner=" &&& ",
        output_field=BooleanField(),
    )


def is_reference_instance() -> Exists:
    """Same as the legacy `/api/instances/` `_is_reference_instance` annotation, read by the model property."""
    return Exists(
        OrgUnitReferenceInstance.objects.filter(org_unit_id=OuterRef("org_unit_id"), instance_id=OuterRef("pk"))
    )


def status() -> Case:
    """`DUPLICATED` when the form is `single_per_period` and another non-deleted submission has the same form, org
    unit and period; else `EXPORTED` once exported; else `READY`.

    The legacy `with_status()` looks for the duplicates among the whole filtered queryset (a `GROUP BY` over it);
    this one only probes the duplicates of each row returned, on the `org_unit_id` index - a page costs a page. The
    duplicates it sees don't depend on the other filters: the deleted ones never count.
    """
    duplicates = (
        Instance.objects.filter(
            form_id=OuterRef("form_id"), org_unit_id=OuterRef("org_unit_id"), period=OuterRef("period"), deleted=False
        )
        .exclude(pk=OuterRef("pk"))
        .exclude(period="")
    )
    return Case(
        When(Exists(duplicates), form__single_per_period=True, then=Value(Instance.STATUS_DUPLICATED)),
        When(last_export_success_at__isnull=False, then=Value(Instance.STATUS_EXPORTED)),
        default=Value(Instance.STATUS_READY),
        output_field=CharField(),
    )
