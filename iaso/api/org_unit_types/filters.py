import django_filters

from iaso.models import OrgUnitType


class OrgUnitTypeDropdownFilter(django_filters.rest_framework.FilterSet):
    source_version_id = django_filters.NumberFilter(field_name="org_units__version_id")

    class Meta:
        model = OrgUnitType
        fields = ["source_version_id"]
