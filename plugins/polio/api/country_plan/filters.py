import django_filters

from plugins.polio.models.country_plan import CountryPlan


class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    """
    A filter that allows filtering by a comma-separated list of numbers.
    e.g., ?country_blocks=1,2,3
    """


class CountryPlanFilter(django_filters.FilterSet):
    """
    Filter for the Country Plan model.
    """

    country = django_filters.NumberFilter(field_name="country__id")
    country_blocks = NumberInFilter(field_name="country__groups__id", lookup_expr="in")

    class Meta:
        model = CountryPlan
        fields = ["country", "country_blocks"]
