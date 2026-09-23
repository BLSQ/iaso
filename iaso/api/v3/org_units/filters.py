from datetime import timedelta

from django.db.models import Q
from django_filters import rest_framework as django_filters

from iaso.api.common.filters import NumberInFilter
from iaso.api.v3.common.errors import bad_request
from iaso.api.v3.common.filterset import BaseV3FilterSet, IntegerFilter
from iaso.api.v3.common.spatial_filters import (
    OutsideBboxFilter,
    OutsideOrgUnitFilter,
    WithinOrgUnitFilter,
    WithinOrIntersectsBboxFilter,
)
from iaso.models import OrgUnit, OrgUnitType


#: Postgres' `timestamptz` rejects a UTC offset displacement of 16 hours or more ("time zone displacement
#: out of range") - a raw, uncaught `django.db.utils.DataError` if an otherwise-valid-looking ISO 8601
#: datetime carries one (e.g. `created_at__gte=1715-10-23T22:51:28-16:01`). `IsoDateTimeFilter` happily
#: parses it (Python's `datetime` has no such limit), so the check has to happen here, before the value
#: reaches the database.
POSTGRES_MAX_TZ_OFFSET = timedelta(hours=16)


class SafeIsoDateTimeFilter(django_filters.IsoDateTimeFilter):
    def filter(self, qs, value):
        if value not in (None, "") and value.utcoffset() is not None:
            if abs(value.utcoffset()) >= POSTGRES_MAX_TZ_OFFSET:
                raise bad_request(
                    f"Invalid value for {self.field_name!r}",
                    f"Time zone offset in {value.isoformat()!r} must be within 16 hours of UTC.",
                )
        return super().filter(qs, value)


class OrgUnitFilterSetV3(BaseV3FilterSet):
    """FilterSet backing `/api/v3/orgunits/`.

    See the field x lookup table in the plan / PR description for the rationale of what is (and isn't)
    exposed here - in short: exact/`__in`/`__startswith` on indexed-but-not-trigram text fields (no
    `__icontains`), `__icontains` on genuinely free-text fields, one level of relation nesting, and a core
    subset of spatial operators (`__within_or_intersects_bbox`, `__outside_bbox`, `__within_org_unit`,
    `__outside_org_unit`).
    """

    #: handled in `OrgUnitViewSetV3` rather than as filters (the shared core params are added by the base class).
    extra_allowed_params = frozenset({"search", "default_version", "roots_for_user", "extra_fields"})
    renamed_params = {
        "geom__bbox": "geom__within_or_intersects_bbox",
        "simplified_geom__bbox": "simplified_geom__within_or_intersects_bbox",
        "location__bbox": "location__within_bbox",
    }

    # -- id --
    id = IntegerFilter(field_name="id", lookup_expr="exact", help_text="Exact id match")
    id__in = NumberInFilter(
        field_name="id",
        lookup_expr="in",
        help_text="Comma-separated list of ids - load several org units by id in one request.",
    )

    # -- text --
    name = django_filters.CharFilter(field_name="name", lookup_expr="exact", help_text="Exact name match")
    # case-insensitive only, not accent-insensitive for now: that needs the `unaccent` postgres extension,
    # which means a migration - deliberately deferred (see the `pg_trgm`/`unaccent` discussion in the PR).
    name__icontains = django_filters.CharFilter(
        field_name="name", lookup_expr="icontains", help_text="Case-insensitive substring match on name"
    )
    name__startswith = django_filters.CharFilter(
        field_name="name", lookup_expr="startswith", help_text="Name starts with"
    )

    # -- indexed text, no icontains (a plain btree index doesn't help LIKE '%x%') --
    source_ref = django_filters.CharFilter(
        field_name="source_ref", lookup_expr="exact", help_text="Exact external (DHIS2) reference match"
    )
    source_ref__in = django_filters.BaseInFilter(
        field_name="source_ref", lookup_expr="in", help_text="Comma-separated list of source_ref values"
    )
    source_ref__startswith = django_filters.CharFilter(
        field_name="source_ref", lookup_expr="startswith", help_text="source_ref starts with"
    )
    code = django_filters.CharFilter(field_name="code", lookup_expr="exact", help_text="Exact DHIS2 code match")
    code__in = django_filters.BaseInFilter(
        field_name="code", lookup_expr="in", help_text="Comma-separated list of code values"
    )

    # -- enum --
    validation_status = django_filters.ChoiceFilter(
        field_name="validation_status",
        choices=OrgUnit.VALIDATION_STATUS_CHOICES,
        help_text="Exact validation status match",
    )
    validation_status__in = django_filters.BaseInFilter(
        field_name="validation_status", lookup_expr="in", help_text="Comma-separated list of validation statuses"
    )

    # -- FK / integer --
    org_unit_type_id = IntegerFilter(field_name="org_unit_type_id", help_text="Exact org unit type id")
    parent_id = IntegerFilter(
        field_name="parent_id",
        help_text="Exact parent org unit id - only its direct children (one level down), not further descendants. Equivalent to `ancestor_id__direct_children`; use `ancestor_id` instead for all descendants at any depth.",
    )
    group_id = IntegerFilter(field_name="groups__id", help_text="Org units belonging to this group id")
    source_id = IntegerFilter(
        field_name="version__data_source_id", help_text="Exact data source id (via the org unit's version)"
    )
    version_id = IntegerFilter(field_name="version_id", help_text="Exact source version id")
    project_id = IntegerFilter(
        field_name="org_unit_type__projects__id", help_text="Org units whose type is linked to this project id"
    )

    # -- one level of relation nesting --
    org_unit_type__name__icontains = django_filters.CharFilter(
        field_name="org_unit_type__name",
        lookup_expr="icontains",
        help_text="Org unit type name contains (case-insensitive)",
    )
    org_unit_type__category = django_filters.ChoiceFilter(
        field_name="org_unit_type__category", choices=OrgUnitType.CATEGORIES, help_text="Exact org unit type category"
    )
    parent__name__icontains = django_filters.CharFilter(
        field_name="parent__name", lookup_expr="icontains", help_text="Parent name contains (case-insensitive)"
    )
    parent__source_ref = django_filters.CharFilter(
        field_name="parent__source_ref", lookup_expr="exact", help_text="Exact parent source_ref match"
    )

    # -- dates --
    source_created_at__gte = SafeIsoDateTimeFilter(
        field_name="source_created_at",
        lookup_expr="gte",
        help_text="Created on the client device at/after this ISO 8601 datetime",
    )
    source_created_at__lte = SafeIsoDateTimeFilter(
        field_name="source_created_at",
        lookup_expr="lte",
        help_text="Created on the client device at/before this ISO 8601 datetime",
    )
    created_at__gte = SafeIsoDateTimeFilter(
        field_name="created_at", lookup_expr="gte", help_text="Created at/after this ISO 8601 datetime"
    )
    created_at__lte = SafeIsoDateTimeFilter(
        field_name="created_at", lookup_expr="lte", help_text="Created at/before this ISO 8601 datetime"
    )
    updated_at__gte = SafeIsoDateTimeFilter(
        field_name="updated_at", lookup_expr="gte", help_text="Updated at/after this ISO 8601 datetime"
    )
    updated_at__lte = SafeIsoDateTimeFilter(
        field_name="updated_at", lookup_expr="lte", help_text="Updated at/before this ISO 8601 datetime"
    )
    opening_date__gte = django_filters.DateFilter(
        field_name="opening_date", lookup_expr="gte", help_text="Opening date on/after this date"
    )
    opening_date__lte = django_filters.DateFilter(
        field_name="opening_date", lookup_expr="lte", help_text="Opening date on/before this date"
    )
    closed_date__gte = django_filters.DateFilter(
        field_name="closed_date", lookup_expr="gte", help_text="Closed date on/after this date"
    )
    closed_date__lte = django_filters.DateFilter(
        field_name="closed_date", lookup_expr="lte", help_text="Closed date on/before this date"
    )

    # -- booleans --
    has_shape = django_filters.BooleanFilter(method="filter_has_shape", help_text="Has a geom or simplified_geom")
    has_location = django_filters.BooleanFilter(method="filter_has_location", help_text="Has a location (point)")
    # per-field null checks (has_shape/has_location above are the friendlier "geom or simplified_geom"/
    # "location" shortcuts; use these when you need to isolate one geometry field specifically, e.g.
    # simplified_geom__isnull=false to find org units missing only the simplified shape).
    geom__isnull = django_filters.BooleanFilter(
        field_name="geom",
        lookup_expr="isnull",
        help_text="`geom` is null (true) / not null (false). Use `has_shape` instead if geom-or-simplified_geom is enough.",
    )
    simplified_geom__isnull = django_filters.BooleanFilter(
        field_name="simplified_geom",
        lookup_expr="isnull",
        help_text="`simplified_geom` is null (true) / not null (false)",
    )
    catchment__isnull = django_filters.BooleanFilter(
        field_name="catchment", lookup_expr="isnull", help_text="`catchment` is null (true) / not null (false)"
    )
    location__isnull = django_filters.BooleanFilter(
        field_name="location",
        lookup_expr="isnull",
        help_text="`location` is null (true) / not null (false). Equivalent to `has_location` with the opposite boolean.",
    )

    # -- hierarchy (ltree `path`, no recursive query needed) --
    # Two "search modes" off the same `ancestor_id` concept, named so they read next to each other in the
    # docs instead of requiring the caller to already know `parent_id=X` means "direct children of X":
    # `ancestor_id=X` (all descendants, any depth) vs. `ancestor_id__direct_children=X` (one level down
    # only - a plain `parent_id` equality under the hood, no ltree scan needed for this variant).
    ancestor_id = IntegerFilter(
        method="filter_ancestor_id",
        help_text="All descendants of this org unit id, at any depth (excluding itself) - not just its direct children. Use `ancestor_id__direct_children` instead to stop at one level down.",
    )
    ancestor_id__direct_children = IntegerFilter(
        field_name="parent_id",
        help_text="Only the direct children (one level down) of this org unit id. Equivalent to `parent_id`.",
    )
    depth = IntegerFilter(field_name="path", lookup_expr="depth", help_text="Exact ltree path depth (1 = root)")

    # -- spatial (core subset) --
    geom__within_or_intersects_bbox = WithinOrIntersectsBboxFilter(
        geometry_field="geom",
        help_text="`minx,miny,maxx,maxy` - org units whose `geom` is inside this bounding box or overlaps it",
    )
    simplified_geom__within_or_intersects_bbox = WithinOrIntersectsBboxFilter(
        geometry_field="simplified_geom",
        help_text="Same as `geom__within_or_intersects_bbox` but against `simplified_geom` (faster, lower precision)",
    )
    location__within_bbox = WithinOrIntersectsBboxFilter(
        geometry_field="location",
        help_text="`minx,miny,maxx,maxy` - org units whose `location` point is inside this bounding box (or on its edge)",
    )
    geom__outside_bbox = OutsideBboxFilter(
        geometry_field="geom",
        help_text='`minx,miny,maxx,maxy` - org units that HAVE a `geom` but it does NOT intersect this bounding box (org units with no `geom` are excluded, not treated as "outside")',
    )
    simplified_geom__outside_bbox = OutsideBboxFilter(
        geometry_field="simplified_geom",
        help_text="Same as `geom__outside_bbox` but against `simplified_geom` (faster, lower precision)",
    )
    location__outside_bbox = OutsideBboxFilter(
        geometry_field="location",
        help_text="`minx,miny,maxx,maxy` - org units that HAVE a `location` but it falls OUTSIDE this bounding box - a cheap approximate counterpart to `location__outside_org_unit` that doesn't require the reference shape to already be in the DB, just a known real-world bbox (e.g. a country's). Combine with `ancestor_id` to scope to one org unit's descendants specifically.",
    )
    geom__within_org_unit = WithinOrgUnitFilter(
        geometry_field="geom", help_text="Org units whose `geom` is contained within the referenced org unit's geometry"
    )
    location__within_org_unit = WithinOrgUnitFilter(
        geometry_field="location",
        help_text="Org units whose `location` point falls within the referenced org unit's geometry",
    )
    geom__outside_org_unit = OutsideOrgUnitFilter(
        geometry_field="geom",
        help_text="Org units that HAVE a `geom` but it's NOT contained within the referenced org unit's geometry (org units with no `geom` are excluded, not treated as \"outside\")",
    )
    location__outside_org_unit = OutsideOrgUnitFilter(
        geometry_field="location",
        help_text="Org units that HAVE a `location` but it falls OUTSIDE the referenced org unit's geometry - typically a data quality check, e.g. a facility whose recorded GPS point falls outside its own district's shape. Combine with `ancestor_id=<same id>` to scope to that org unit's descendants specifically.",
    )

    class Meta:
        model = OrgUnit
        fields: list = []  # all filters are declared explicitly above, nothing auto-generated

    def filter_has_shape(self, queryset, name, value):
        has_shape_q = Q(geom__isnull=False) | Q(simplified_geom__isnull=False)
        return queryset.filter(has_shape_q) if value else queryset.exclude(has_shape_q)

    def filter_has_location(self, queryset, name, value):
        return queryset.filter(location__isnull=not value)

    def filter_ancestor_id(self, queryset, name, value):
        """Keep only the descendants of the given org unit (excluding itself).

        Scoped to the requesting user (`filter_for_user`), same as `within_org_unit`/`outside_org_unit`:
        a nonexistent id and one belonging to another account both get the same "does not exist" 400,
        instead of one silently returning an empty result set and the other raising."""
        try:
            ancestor = OrgUnit.objects.filter_for_user(self.request.user).only("id", "path").get(pk=value)
        except OrgUnit.DoesNotExist:
            raise bad_request(f"Org unit {value} does not exist")
        if ancestor.path is None:
            return queryset.none()
        return queryset.filter(path__descendants=str(ancestor.path), path__depth__gt=len(ancestor.path))
