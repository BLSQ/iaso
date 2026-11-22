import django_filters

from django.db.models import Exists, OuterRef

from iaso.models import OrgUnit, OrgUnitType


class OrgUnitTypeDropdownFilter(django_filters.rest_framework.FilterSet):
    source_version_id = django_filters.NumberFilter(method="filter_source_version_id")

    class Meta:
        model = OrgUnitType
        fields = ["source_version_id"]

    def filter_source_version_id(self, queryset, name, value):
        # EXISTS stops at the first org unit of each type, a JOIN would go through every org unit of the version
        return queryset.filter(Exists(OrgUnit.objects.filter(org_unit_type=OuterRef("pk"), version_id=value)))
