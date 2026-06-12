import django_filters

from django.db.models import Q

from iaso.api.common import NumberInFilter
from iaso.models import OrgUnitType
from iaso.models.org_unit import OrgUnitTypeQuerySet


class OrgUnitTypeDropdownFilter(django_filters.FilterSet):
    source_version_id = django_filters.NumberFilter(field_name="org_units__version_id")
    project = django_filters.NumberFilter(field_name="projects__id", label="Project ID")
    project_ids = NumberInFilter(field_name="projects__id")
    app_id = django_filters.CharFilter(method="filter_app_id")

    class Meta:
        model = OrgUnitType
        fields = ["source_version_id", "project", "project_ids", "app_id"]

    def filter_app_id(self, queryset: OrgUnitTypeQuerySet, name, value):
        return queryset.filter_for_user_and_app_id(self.request.user, value)


class OrgUnitTypeFilter(django_filters.FilterSet):
    project = django_filters.NumberFilter(field_name="projects__id", label="Project ID")
    project_ids = NumberInFilter(field_name="projects__id")
    search = django_filters.CharFilter(method="filter_search", label="Search")
    app_id = django_filters.CharFilter(method="filter_app_id", label="App ID")

    class Meta:
        model = OrgUnitType
        fields = ["project", "project_ids", "search", "app_id"]

    def filter_search(self, queryset, name, value):
        if value:
            return queryset.filter(Q(name__icontains=value) | Q(short_name__icontains=value))
        return queryset

    def filter_app_id(self, queryset: OrgUnitTypeQuerySet, name, value):
        return queryset.filter_for_user_and_app_id(self.request.user, value)
