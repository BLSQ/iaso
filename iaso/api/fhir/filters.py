from django.db import models as django_models
from django_filters import rest_framework as django_filters

from iaso.models import OrgUnit


class FHIRLocationFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name="name", lookup_expr="icontains")
    status = django_filters.CharFilter(method="filter_status")
    identifier = django_filters.CharFilter(method="filter_identifier")
    type = django_filters.CharFilter(field_name="org_unit_type__short_name")

    class Meta:
        model = OrgUnit
        fields = ["name", "status", "identifier", "type"]

    def filter_identifier(self, queryset, name, value):
        return queryset.filter(
            django_models.Q(source_ref=value) | django_models.Q(uuid=value) | django_models.Q(aliases__contains=[value])
        )

    def filter_status(self, queryset, name, value):
        status_mapping = {
            "active": OrgUnit.VALIDATION_VALID,
            "inactive": OrgUnit.VALIDATION_NEW,
            "suspended": OrgUnit.VALIDATION_REJECTED,
        }
        if value in status_mapping:
            return queryset.filter(validation_status=status_mapping[value])
        return queryset
