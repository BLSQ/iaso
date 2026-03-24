from typing import Optional

import django_filters

from django.db.models import Q
from django.shortcuts import get_object_or_404

from iaso.models import OrgUnit, Profile
from iaso.utils import search_by_ids_refs


class ProfileListFilter(django_filters.rest_framework.FilterSet):
    ids = django_filters.BaseInFilter(field_name="user__id", lookup_expr="in")
    teams = django_filters.BaseInFilter(field_name="user__teams__id", lookup_expr="in", distinct=True)
    user_roles = django_filters.BaseInFilter(field_name="user_roles__pk", lookup_expr="in", distinct=True)
    projects = django_filters.BaseInFilter(field_name="projects__pk", lookup_expr="in", distinct=True)
    permissions = django_filters.BaseInFilter(
        field_name="user__user_permissions__codename", lookup_expr="in", distinct=True
    )
    org_unit_types = django_filters.CharFilter(method="filter_org_unit_type")
    search = django_filters.CharFilter(method="filter_search")

    location = django_filters.CharFilter(method="filter_location")

    has_email = django_filters.BooleanFilter(method="filter_has_email")

    class Meta:
        model = Profile
        fields = []

    def filter_org_unit_type(self, queryset, name, value):
        if value == "unassigned":
            return queryset.filter(org_units__org_unit_type__isnull=True).distinct()
        try:
            value = int(value)
        except ValueError:
            return queryset.none()
        return queryset.filter(org_units__org_unit_type__pk=value).distinct()

    def filter_search(self, queryset, name, value):
        if value.startswith("ids:"):
            return queryset.filter(id__in=search_by_ids_refs.parse_ids("ids:", value))
        if value.startswith("refs:"):
            return queryset.filter(dhis2_id__in=search_by_ids_refs.parse_ids("refs:", value))
        return queryset.filter(
            Q(user__username__icontains=value)
            | Q(user__tenant_user__main_user__username__icontains=value)
            | Q(user__first_name__icontains=value)
            | Q(user__last_name__icontains=value)
            | Q(organization__icontains=value)
        ).distinct()

    def filter_location(self, queryset, name, value):
        parent_ou: bool = self.request.query_params.get("ouParent", "").lower() == "true"
        children_ou: bool = self.request.query_params.get("ouChildren", "").lower() == "true"
        location = value

        if location and not (parent_ou or children_ou):
            return queryset.filter(
                org_units__pk=location,
            ).distinct()

        parent: Optional[OrgUnit] = None

        if parent_ou or children_ou:
            ou = get_object_or_404(OrgUnit, pk=location)
            if parent_ou and ou.parent is not None:
                parent = ou.parent

            org_unit_filter = Q(org_units__pk=location)

            if parent_ou and not children_ou:
                if parent:
                    org_unit_filter |= Q(org_units__pk=parent.pk)
                return queryset.filter(org_unit_filter).distinct()

            if children_ou and not parent_ou:
                descendant_ous = OrgUnit.objects.hierarchy(ou)
                org_unit_filter |= Q(org_units__in=descendant_ous)
                return queryset.filter(org_unit_filter).distinct()

            if parent_ou and children_ou:
                descendant_ous = OrgUnit.objects.hierarchy(ou)
                org_unit_filter |= Q(org_units__in=descendant_ous)
                if parent:
                    org_unit_filter |= Q(org_units__pk=parent.pk)
                return queryset.filter(org_unit_filter).distinct()

        return queryset.none()

    def filter_has_email(self, queryset, name, value):
        if value:
            return queryset.filter(user__email__isnull=False).exclude(user__email="").distinct()
        return queryset.filter(Q(user__email__isnull=True) | Q(user__email="")).distinct()
