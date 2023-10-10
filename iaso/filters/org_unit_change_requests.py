import django_filters
from rest_framework.exceptions import ValidationError

from django.db.models import Q
from django.db.models.query import QuerySet

from iaso.models import OrgUnitChangeRequest


class OrgUnitChangeRequestListFilter(django_filters.rest_framework.FilterSet):
    org_unit_id = django_filters.NumberFilter(field_name="org_unit_id")
    project = django_filters.NumberFilter(field_name="org_unit__org_unit_type__projects")
    # Methods.
    groups = django_filters.CharFilter(method="filter_groups")
    org_unit_type_id = django_filters.CharFilter(method="filter_org_unit_type_id")
    parent_id = django_filters.CharFilter(method="filter_parent_id")

    class Meta:
        model = OrgUnitChangeRequest
        # Searchable model fields.
        fields = ["status"]

    def filter_parent_id(self, queryset: QuerySet, _, value: str) -> QuerySet:
        """
        Filter by "Parent OrgUnit", either the current or the new one.
        """
        if not value.isnumeric():
            raise ValidationError(detail="`parent_id` is invalid.")
        return queryset.filter(Q(org_unit__parent_id=value) | Q(parent_id=value))

    def filter_org_unit_type_id(self, queryset: QuerySet, _, value: str) -> QuerySet:
        """
        Filter by "OrgUnitType", either the current or the new one.
        """
        if not value.isnumeric():
            raise ValidationError(detail="`org_unit_type_id` is invalid.")
        return queryset.filter(Q(org_unit__org_unit_type_id=value) | Q(org_unit_type_id=value))

    def filter_groups(self, queryset: QuerySet, _, value: str) -> QuerySet:
        """
        Filter by "Group IDs", either actual groups or the new ones.
        `value` is intended to be a comma-separated list of numeric chars.
        """
        groups_ids = [val for val in value.split(",") if val.isnumeric()]
        if not groups_ids:
            raise ValidationError(detail="`groups` is invalid.")
        return queryset.filter(Q(org_unit__groups__in=groups_ids) | Q(groups__in=groups_ids))
