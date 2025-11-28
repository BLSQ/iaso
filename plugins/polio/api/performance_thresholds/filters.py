import django_filters

from plugins.polio.models.performance_thresholds import PerformanceThresholds


class PerformanceThresholdFilter(django_filters.FilterSet):
    """
    Filter for the Performance Thresholds model.
    """

    class Meta:
        model = PerformanceThresholds
        fields = ["indicator", "timeline"]
