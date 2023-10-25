import django_filters
from rest_framework.exceptions import ValidationError

from django.db.models import Q
from django.db.models.query import QuerySet
from django.utils.translation import gettext_lazy as _

from iaso.models import OrgUnitChangeRequest


class MobileOrgUnitChangeRequestListFilter(django_filters.rest_framework.FilterSet):
    last_sync = django_filters.IsoDateTimeFilter(field_name="updated_at", lookup_expr="gte")

    class Meta:
        model = OrgUnitChangeRequest
        fields = []


class OrgUnitChangeRequestListFilter(django_filters.rest_framework.FilterSet):
    org_unit_id = django_filters.NumberFilter(field_name="org_unit_id", label=_("Org unit ID"))
    org_unit_type_id = django_filters.NumberFilter(method="filter_org_unit_type_id", label=_("Org unit type ID"))
    parent_id = django_filters.NumberFilter(method="filter_parent_id", label=_("Parent ID"))
    groups = django_filters.CharFilter(method="filter_groups", label=_("Groups"))
    project = django_filters.NumberFilter(field_name="org_unit__org_unit_type__projects", label=_("Project"))

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
