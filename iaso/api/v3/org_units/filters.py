from django.db.models import Q
from django_filters import rest_framework as django_filters

from iaso.api.v3.common.filterset import CORE_EXTRA_ALLOWED_PARAMS, BaseV3FilterSet
from iaso.api.v3.common.spatial_filters import BboxFilter, OutsideOrgUnitFilter, WithinOrgUnitFilter
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


class OrgUnitFilterSetV3(BaseV3FilterSet):
    """FilterSet backing `/api/v3/orgunits/`.

    See the field x lookup table in the plan / PR description for the rationale of what is (and isn't)
    exposed here - in short: exact/`__in`/`__startswith` on indexed-but-not-trigram text fields (no
    `__icontains`), `__icontains` on genuinely free-text fields, one level of relation nesting, and a core
    subset of spatial operators (`__bbox`, `__within_org_unit`, `__outside_org_unit`).
    """

    extra_allowed_params = EXTRA_ALLOWED_PARAMS

    # -- id --
    id = django_filters.NumberFilter(field_name="id", lookup_expr="exact")
    id__in = django_filters.BaseInFilter(field_name="id", lookup_expr="in")

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
    created_at__gte = django_filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_at__lte = django_filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="lte")
    updated_at__gte = django_filters.IsoDateTimeFilter(field_name="updated_at", lookup_expr="gte")
    updated_at__lte = django_filters.IsoDateTimeFilter(field_name="updated_at", lookup_expr="lte")
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
        """Keep only the descendants of the given org unit (excluding itself)."""
        try:
            ancestor = OrgUnit.objects.only("id", "path").get(pk=value)
        except OrgUnit.DoesNotExist:
            return queryset.none()
        if ancestor.path is None:
            return queryset.none()
        return queryset.filter(path__descendants=str(ancestor.path), path__depth__gt=len(ancestor.path))
