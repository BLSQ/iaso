import django_filters

from iaso.models.missions import MissionType


class MissionFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="search_filter")
    mission_type = django_filters.ChoiceFilter(choices=MissionType.choices)

    def search_filter(self, queryset, name, value):
        if value:
            return queryset.filter(name__icontains=value)
        return queryset
