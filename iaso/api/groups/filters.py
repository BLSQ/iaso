import django_filters

from django.utils.translation import gettext_lazy as _
from django_filters.widgets import CSVWidget

from iaso.models import Group


class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    pass


class GroupListFilter(django_filters.rest_framework.FilterSet):
    search = django_filters.CharFilter(field_name="name", lookup_expr="icontains", label=_("Search by name"))
    source_version_id = django_filters.NumberFilter(label=_("Version ID"))
    data_source_id = django_filters.NumberFilter(field_name="source_version__data_source_id", label=_("Data Source ID"))
    project_ids = NumberInFilter(
        field_name="source_version__data_source__projects__id",
        widget=CSVWidget,
        label=_("Project IDs (comma-separated)"),
    )

    class Meta:
        model = Group
        fields = []
