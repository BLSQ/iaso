import django_filters

from iaso.models import OrgUnitChangeRequest


class OrgUnitChangeRequestListFilter(django_filters.rest_framework.FilterSet):
    org_unit_id = django_filters.NumberFilter(field_name="org_unit_id")
    org_unit_type_id = django_filters.NumberFilter(field_name="org_unit__org_unit_type_id")
    parent_id = django_filters.NumberFilter(field_name="org_unit__parent_id")

    class Meta:
        model = OrgUnitChangeRequest
        fields = [
            "status",
            "org_unit_id",
            "org_unit_type_id",
            "parent_id",
        ]
