import django_filters

from plugins.polio.models.performance_dashboard import PerformanceDashboard


class PerformanceDashboardFilter(django_filters.FilterSet):
    """
    Filter for the NationalLogisticsPlan model.
    """

    country = django_filters.NumberFilter(field_name="country__id")
    country_block = django_filters.NumberFilter(field_name="country__parent__id")

    class Meta:
        model = PerformanceDashboard
        fields = ["status", "antigen"]
