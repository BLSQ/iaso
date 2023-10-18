import django_filters
from rest_framework.exceptions import ValidationError

from django.db.models import Q
from django.db.models.query import QuerySet

from iaso.models import OrgUnitChangeRequest


class OrgUnitChangeRequestListFilter(django_filters.rest_framework.FilterSet):
    org_unit_id = django_filters.NumberFilter(field_name="org_unit_id")
    org_unit_type_id = django_filters.NumberFilter(method="filter_org_unit_type_id")
    parent_id = django_filters.NumberFilter(method="filter_parent_id")
    groups = django_filters.CharFilter(method="filter_groups")
    project = django_filters.NumberFilter(field_name="org_unit__org_unit_type__projects")

    class Meta:
        model = OrgUnitChangeRequest
        fields = ["status"]

    def filter_parent_id(self, queryset: QuerySet, _, value: str) -> QuerySet:
        return queryset.filter(Q(org_unit__parent_id=value) | Q(new_parent_id=value))

    def filter_org_unit_type_id(self, queryset: QuerySet, _, value: str) -> QuerySet:
        return queryset.filter(Q(org_unit__org_unit_type_id=value) | Q(new_org_unit_type_id=value))

    def filter_groups(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        """
        `value` is intended to be a comma-separated list of numeric chars.
        """
        groups_ids = [val for val in value.split(",") if val.isnumeric()]
        if not groups_ids:
            raise ValidationError({name: ["Invalid value."]})
        return queryset.filter(Q(org_unit__groups__in=groups_ids) | Q(new_groups__in=groups_ids))
