import django_filters

from django.conf import settings

from plugins.polio.models.base import SpreadSheetImport


class PreparednessDashboardFilter(django_filters.rest_framework.FilterSet):
    campaign = django_filters.CharFilter(field_name="obr_name", lookup_expr="exact")


class PreparednessScoreFilter(django_filters.rest_framework.FilterSet):
    date = django_filters.DateFilter(method="filter_date", input_formats=settings.API_DATE_INPUT_FORMATS)

    def filter_date(self, queryset, name, value):
        """This filter returns a quersyet with a single object in it.
        Ideally we cached data on the reference date. But if for some reason the snapshot failed, we want the closest cache entry BEFORE the date.
        That's because it's used to see the score of campaigns that missed the preparedness objectives on the reference date.
        If we pick a later date, we risk showing cache data that meets the objectives
        """

        queryset = queryset.filter(created_at__lte=value)
        return queryset.order_by("-created_at")[:1]

    class Meta:
        model = SpreadSheetImport
        fields = ["url"]
