import django_filters

from django.db.models import Q
from django.db.models.query import QuerySet

from iaso.models import OrgUnitChangeRequest


class OrgUnitChangeRequestListFilter(django_filters.rest_framework.FilterSet):
    groups = django_filters.CharFilter(method="filter_groups")
    org_unit_id = django_filters.NumberFilter(field_name="org_unit_id")
    org_unit_type_id = django_filters.NumberFilter(method="filter_org_unit_type_id")
    parent_id = django_filters.NumberFilter(method="org_unit__parent_id")
    project = django_filters.CharFilter(field_name="org_unit__org_unit_type__projects")

    class Meta:
        model = OrgUnitChangeRequest
        fields = [
            "groups",
            "org_unit_id",
            "org_unit_type_id",
            "parent_id",
            "project",
            "status",
        ]

    def filter_parent_id(self, queryset: QuerySet, name, value: str) -> QuerySet:
        """
        Id of the parent OrgUnit to filter on, either the current one or in the change.
        """
        if not value.isnumeric():
            return queryset
        return queryset.filter(Q(org_unit__parent_id=value) | Q(parent_id=value))

    def filter_org_unit_type_id(self, queryset: QuerySet, name, value: str) -> QuerySet:
        """
        Id of the OrgUnitType to filter on, either the current one or in the change.
        """
        if not value.isnumeric():
            return queryset
        return queryset.filter(Q(org_unit__org_unit_type_id=value) | Q(org_unit_type_id=value))

    def filter_groups(self, queryset: QuerySet, name, value: str) -> QuerySet:
        """
        List of int, comma separated.
        Ids of the group to filter on, either the currents ones or in the change.
        """
        groups_ids = [val for val in value.split(",") if val.isnumeric()]
        if not groups_ids:
            return queryset
        return queryset.filter(Q(org_unit__groups__in=groups_ids) | Q(groups__in=groups_ids))
