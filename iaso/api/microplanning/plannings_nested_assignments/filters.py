from __future__ import annotations

import django_filters

from iaso.api.common import NumberInFilter
from iaso.models import Assignment, OrgUnit
from iaso.models.microplanning.assignments import AssignmentQuerySet


class OrgUnitFilterSet(django_filters.FilterSet):
    teams = NumberInFilter(field_name="team__id")
    users = NumberInFilter(field_name="user__id")
    org_units = NumberInFilter(field_name="org_unit__id")
    parent_org_unit = django_filters.ModelChoiceFilter(method="filter_parent_org_unit", queryset=OrgUnit.objects.none())

    class Meta:
        model = Assignment
        fields = ["teams", "users", "org_units"]

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        user = self.request.user
        if user:
            self.form.fields["parent_org_unit"].queryset = OrgUnit.objects.filter_for_user(user)

    @staticmethod
    def filter_parent_org_unit(queryset, name, value: OrgUnit | None) -> AssignmentQuerySet:
        if not value:
            return queryset

        return queryset.filter(org_unit__parent=value)
