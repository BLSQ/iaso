import django_filters

from iaso.models import Project


class ProjectsFilter(django_filters.rest_framework.FilterSet):
    app_id = django_filters.CharFilter(field_name="app_id", lookup_expr="exact")

    class Meta:
        model = Project
        fields = []
