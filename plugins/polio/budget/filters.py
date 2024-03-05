import django_filters
from django.db.models.query import QuerySet
from django.utils.translation import gettext as _

from plugins.polio.budget.models import BudgetProcess


class BudgetCampaignFilter(django_filters.rest_framework.FilterSet):
    countries = django_filters.CharFilter(method="filter_countries", label=_("Countries IDs (comma-separated)"))

    class Meta:
        model = BudgetProcess
        fields = ["current_state_key"]

    def filter_countries(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        ids = [val for val in value.split(",") if val.isnumeric()]
        return queryset.filter(rounds__campaign__country__id__in=ids)
