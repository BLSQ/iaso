import django_filters

from django.db.models import Q
from django.db.models.query import QuerySet
from django.utils.translation import gettext as _
from rest_framework.exceptions import ValidationError

from plugins.polio.budget.models import BudgetProcess


class BudgetProcessFilter(django_filters.rest_framework.FilterSet):
    countries = django_filters.CharFilter(method="filter_countries", label=_("Countries IDs (comma-separated)"))
    org_unit_groups = django_filters.CharFilter(
        method="filter_org_unit_groups", label=_("Org unit group IDs (comma-separated)")
    )
    search = django_filters.CharFilter(method="search_in_multiple_fields", label=_("Search"))

    class Meta:
        model = BudgetProcess
        fields = ["current_state_key"]

    @staticmethod
    def parse_comma_separated_numeric_values(value: str, field_name: str) -> list:
        ids = [val for val in value.split(",") if val.isnumeric()]
        if not ids:
            raise ValidationError({field_name: [f"Invalid value. `{value}` must be numeric and comma-separated"]})
        return [int(val) for val in ids]

    def filter_countries(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        ids = self.parse_comma_separated_numeric_values(value, name)
        return queryset.filter(rounds__campaign__country__id__in=ids)

    def filter_org_unit_groups(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        ids = self.parse_comma_separated_numeric_values(value, name)
        return queryset.filter(rounds__campaign__country__groups__in=ids)

    def search_in_multiple_fields(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        query = Q(rounds__campaign__obr_name__icontains=value) | Q(rounds__campaign__country__name__icontains=value)
        return queryset.filter(query)
