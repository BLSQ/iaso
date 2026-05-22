import django_filters

from iaso.api.utils.filters import NumberInFilter
from plugins.polio.models.country_plan import CountryPlan


class CountryPlanFilter(django_filters.FilterSet):
    """
    Filter for the Country Plan model.
    """

    country = django_filters.NumberFilter(field_name="country__id")
    country_blocks = NumberInFilter(field_name="country__groups__id", lookup_expr="in")

    class Meta:
        model = CountryPlan
        fields = ["country", "country_blocks"]
