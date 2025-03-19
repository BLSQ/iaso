import django_filters

from django.utils.translation import gettext_lazy as _

from iaso.api.common import parse_comma_separated_numeric_values
from iaso.models import OrgUnitChangeRequestConfiguration


class OrgUnitChangeRequestConfigurationListFilter(django_filters.rest_framework.FilterSet):
    project_id = django_filters.NumberFilter(field_name="project", label=_("Project ID"))
    org_unit_type_id = django_filters.NumberFilter(field_name="org_unit_type", label=_("Org unit type ID"))
    created_by = django_filters.CharFilter(
        method="filter_created_by", label=_("Created by - Users IDs (comma-separated)")
    )

    class Meta:
        model = OrgUnitChangeRequestConfiguration
        fields = ["type"]

    @staticmethod
    def filter_created_by(queryset, name, value):
        user_ids = parse_comma_separated_numeric_values(value, name)
        return queryset.filter(created_by_id__in=user_ids)


class MobileOrgUnitChangeRequestConfigurationListFilter(django_filters.rest_framework.FilterSet):
    include_creation = django_filters.BooleanFilter(method="filter_include_creation", label=_("Include creation"))

    def __init__(self, *args, **kwargs):
        # This is ugly but seems to be the way: https://stackoverflow.com/a/58608986
        if "include_creation" not in kwargs["data"]:
            kwargs["data"]._mutable = True
            kwargs["data"]["include_creation"] = False
            kwargs["data"]._mutable = False
        super(MobileOrgUnitChangeRequestConfigurationListFilter, self).__init__(*args, **kwargs)

    class Meta:
        model = OrgUnitChangeRequestConfiguration
        fields = []

    @staticmethod
    def filter_include_creation(queryset, name, value):
        if value:
            return queryset

        return queryset.exclude(type=OrgUnitChangeRequestConfiguration.Type.CREATION)
