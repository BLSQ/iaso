from django.db.models import Q
from django.db.models.query import QuerySet
from django.utils.translation import gettext as _
import django_filters

from plugins.polio.budget.models import BudgetProcess


class BudgetCampaignFilter(django_filters.rest_framework.FilterSet):
    countries = django_filters.CharFilter(method="filter_countries", label=_("Countries IDs (comma-separated)"))
    search = django_filters.CharFilter(method="search_in_multiple_fields", label=_("Search"))

    class Meta:
        model = BudgetProcess
        fields = ["current_state_key"]

    def filter_countries(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        ids = [val for val in value.split(",") if val.isnumeric()]
        return queryset.filter(rounds__campaign__country__id__in=ids)

    def search_in_multiple_fields(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        query = Q(rounds__campaign__obr_name__icontains=value) | Q(rounds__campaign__country__name__icontains=value)
        return queryset.filter(query)
