from django.db.models import Q
from django_filters import rest_framework as django_filters

from iaso.api.fhir.constants import FHIR_STATUS_CHOICES, STATUS_MAPPING
from iaso.models import OrgUnit


class FHIRLocationFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(field_name="name", lookup_expr="icontains")
    status = django_filters.ChoiceFilter(choices=FHIR_STATUS_CHOICES, method="filter_status")
    identifier = django_filters.CharFilter(method="filter_identifier")
    type = django_filters.CharFilter(field_name="org_unit_type__short_name")

    class Meta:
        model = OrgUnit
        fields = ["name", "status", "identifier", "type"]

    def filter_identifier(self, queryset, name, value):
        if value:
            return queryset.filter(Q(source_ref=value) | Q(uuid=value) | Q(aliases__contains=[value]))
        return queryset

    def filter_status(self, queryset, name, value):
        if value in STATUS_MAPPING:
            return queryset.filter(validation_status=STATUS_MAPPING[value])
        return queryset
