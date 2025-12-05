import django_filters

from plugins.polio.models.performance_thresholds import PerformanceThresholds


class PerformanceThresholdFilter(django_filters.FilterSet):
    """
    Filter for the Performance Thresholds model.
    """

    indicator = django_filters.CharFilter(field_name="indicator")

    class Meta:
        model = PerformanceThresholds
        fields = ["indicator"]
