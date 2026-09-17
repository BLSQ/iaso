from datetime import timedelta

from django.db.models import Q
from django_filters import rest_framework as django_filters

from iaso.api.v3.common.errors import bad_request
from iaso.api.v3.common.filterset import CORE_EXTRA_ALLOWED_PARAMS, BaseV3FilterSet
from iaso.api.v3.common.spatial_filters import (
    BboxFilter,
    OutsideBboxFilter,
    OutsideOrgUnitFilter,
    WithinOrgUnitFilter,
)
from iaso.models import OrgUnit, OrgUnitType


#: query params handled at the view level (search shortcut, output params) rather than as FilterSet fields:
#: the shared core (pagination/format/fields, see CORE_EXTRA_ALLOWED_PARAMS) plus org-units-specific ones.
EXTRA_ALLOWED_PARAMS = CORE_EXTRA_ALLOWED_PARAMS | frozenset(
    {
        "search",
        "default_version",
        "roots_for_user",
        "extra_fields",
    }
)


class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    """`django_filters.BaseInFilter` alone doesn't validate its comma-separated values as numbers (its
    default `field_class` is a plain `forms.Field`) - a non-numeric token (`id__in=abc`) reaches the ORM
    unvalidated and blows up with an uncaught `ValueError` (`Field 'id' expected a number but got 'abc'`)
    instead of a 400. Mixing in `NumberFilter` gives the per-token form field a `DecimalField`, so each
    value is validated before it ever reaches the queryset."""


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
    subset of spatial operators (`__bbox`, `__outside_bbox`, `__within_org_unit`, `__outside_org_unit`).
    """

    extra_allowed_params = EXTRA_ALLOWED_PARAMS

    # -- id --
    id = django_filters.NumberFilter(field_name="id", lookup_expr="exact")
    id__in = NumberInFilter(field_name="id", lookup_expr="in")

    # -- text --
    name = django_filters.CharFilter(field_name="name", lookup_expr="exact")
    # case-insensitive only, not accent-insensitive for now: that needs the `unaccent` postgres extension,
    # which means a migration - deliberately deferred (see the `pg_trgm`/`unaccent` discussion in the PR).
    name__icontains = django_filters.CharFilter(field_name="name", lookup_expr="icontains")
    name__startswith = django_filters.CharFilter(field_name="name", lookup_expr="startswith")

    # -- indexed text, no icontains (a plain btree index doesn't help LIKE '%x%') --
    source_ref = django_filters.CharFilter(field_name="source_ref", lookup_expr="exact")
    source_ref__in = django_filters.BaseInFilter(field_name="source_ref", lookup_expr="in")
    source_ref__startswith = django_filters.CharFilter(field_name="source_ref", lookup_expr="startswith")
    code = django_filters.CharFilter(field_name="code", lookup_expr="exact")
    code__in = django_filters.BaseInFilter(field_name="code", lookup_expr="in")

    # -- enum --
    validation_status = django_filters.ChoiceFilter(
        field_name="validation_status", choices=OrgUnit.VALIDATION_STATUS_CHOICES
    )
    validation_status__in = django_filters.BaseInFilter(field_name="validation_status", lookup_expr="in")

    # -- FK / integer --
    org_unit_type_id = django_filters.NumberFilter(field_name="org_unit_type_id")
    parent_id = django_filters.NumberFilter(field_name="parent_id")
    group_id = django_filters.NumberFilter(field_name="groups__id")
    source_id = django_filters.NumberFilter(field_name="version__data_source_id")
    version_id = django_filters.NumberFilter(field_name="version_id")
    project_id = django_filters.NumberFilter(field_name="org_unit_type__projects__id")

    # -- one level of relation nesting --
    org_unit_type__name__icontains = django_filters.CharFilter(
        field_name="org_unit_type__name", lookup_expr="icontains"
    )
    org_unit_type__category = django_filters.ChoiceFilter(
        field_name="org_unit_type__category", choices=OrgUnitType.CATEGORIES
    )
    parent__name__icontains = django_filters.CharFilter(field_name="parent__name", lookup_expr="icontains")
    parent__source_ref = django_filters.CharFilter(field_name="parent__source_ref", lookup_expr="exact")

    # -- dates --
    created_at__gte = SafeIsoDateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_at__lte = SafeIsoDateTimeFilter(field_name="created_at", lookup_expr="lte")
    updated_at__gte = SafeIsoDateTimeFilter(field_name="updated_at", lookup_expr="gte")
    updated_at__lte = SafeIsoDateTimeFilter(field_name="updated_at", lookup_expr="lte")
    opening_date__gte = django_filters.DateFilter(field_name="opening_date", lookup_expr="gte")
    opening_date__lte = django_filters.DateFilter(field_name="opening_date", lookup_expr="lte")
    closed_date__gte = django_filters.DateFilter(field_name="closed_date", lookup_expr="gte")
    closed_date__lte = django_filters.DateFilter(field_name="closed_date", lookup_expr="lte")

    # -- booleans --
    has_shape = django_filters.BooleanFilter(method="filter_has_shape")
    has_location = django_filters.BooleanFilter(method="filter_has_location")
    # per-field null checks (has_shape/has_location above are the friendlier "geom or simplified_geom"/
    # "location" shortcuts; use these when you need to isolate one geometry field specifically, e.g.
    # simplified_geom__isnull=false to find org units missing only the simplified shape).
    geom__isnull = django_filters.BooleanFilter(field_name="geom", lookup_expr="isnull")
    simplified_geom__isnull = django_filters.BooleanFilter(field_name="simplified_geom", lookup_expr="isnull")
    catchment__isnull = django_filters.BooleanFilter(field_name="catchment", lookup_expr="isnull")
    location__isnull = django_filters.BooleanFilter(field_name="location", lookup_expr="isnull")

    # -- hierarchy (ltree `path`, no recursive query needed) --
    # Two "search modes" off the same `ancestor_id` concept, named so they read next to each other in the
    # docs instead of requiring the caller to already know `parent_id=X` means "direct children of X":
    # `ancestor_id=X` (all descendants, any depth) vs. `ancestor_id__direct_children=X` (one level down
    # only - a plain `parent_id` equality under the hood, no ltree scan needed for this variant).
    ancestor_id = django_filters.NumberFilter(method="filter_ancestor_id")
    ancestor_id__direct_children = django_filters.NumberFilter(field_name="parent_id")
    depth = django_filters.NumberFilter(field_name="path", lookup_expr="depth")

    # -- spatial (core subset) --
    geom__bbox = BboxFilter(geometry_field="geom")
    simplified_geom__bbox = BboxFilter(geometry_field="simplified_geom")
    location__bbox = BboxFilter(geometry_field="location")
    geom__outside_bbox = OutsideBboxFilter(geometry_field="geom")
    simplified_geom__outside_bbox = OutsideBboxFilter(geometry_field="simplified_geom")
    location__outside_bbox = OutsideBboxFilter(geometry_field="location")
    geom__within_org_unit = WithinOrgUnitFilter(geometry_field="geom", org_unit_model=OrgUnit)
    location__within_org_unit = WithinOrgUnitFilter(geometry_field="location", org_unit_model=OrgUnit)
    geom__outside_org_unit = OutsideOrgUnitFilter(geometry_field="geom", org_unit_model=OrgUnit)
    location__outside_org_unit = OutsideOrgUnitFilter(geometry_field="location", org_unit_model=OrgUnit)

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
            raise bad_request(f"Org unit {value!r} does not exist")
        if ancestor.path is None:
            return queryset.none()
        return queryset.filter(path__descendants=str(ancestor.path), path__depth__gt=len(ancestor.path))
