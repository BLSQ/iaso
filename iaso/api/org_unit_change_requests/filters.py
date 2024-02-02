import django_filters
from rest_framework.exceptions import ValidationError

from django.conf import settings
from django.db.models import Q
from django.db.models.query import QuerySet
from django.utils.translation import gettext_lazy as _

from iaso.models import OrgUnitChangeRequest, OrgUnit


class MobileOrgUnitChangeRequestListFilter(django_filters.rest_framework.FilterSet):
    last_sync = django_filters.IsoDateTimeFilter(field_name="updated_at", lookup_expr="gte")

    class Meta:
        model = OrgUnitChangeRequest
        fields = []


class OrgUnitChangeRequestListFilter(django_filters.rest_framework.FilterSet):
    org_unit_id = django_filters.NumberFilter(field_name="org_unit_id", label=_("Org unit ID"))
    org_unit_type_id = django_filters.NumberFilter(method="filter_org_unit_type_id", label=_("Org unit type ID"))
    parent_id = django_filters.NumberFilter(method="filter_parent_id", label=_("Parent ID"))
    groups = django_filters.CharFilter(method="filter_groups", label=_("Groups IDs (comma-separated)"))
    project = django_filters.NumberFilter(field_name="org_unit__org_unit_type__projects", label=_("Project ID"))
    created_at = django_filters.DateFromToRangeFilter()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.form.fields["created_at"].fields[0].input_formats = settings.API_DATE_INPUT_FORMATS
        self.form.fields["created_at"].fields[-1].input_formats = settings.API_DATE_INPUT_FORMATS

    class Meta:
        model = OrgUnitChangeRequest
        fields = ["status"]

    def filter_parent_id(self, queryset: QuerySet, _, value: str) -> QuerySet:
        try:
            parent = OrgUnit.objects.get(id=value)
            parent_qs = OrgUnit.objects.filter(id=parent.id)
            descendants_qs = OrgUnit.objects.hierarchy(parent_qs).values_list("id", flat=True)
            return queryset.filter(Q(org_unit_id__in=descendants_qs) | Q(new_parent_id__in=descendants_qs))
        except OrgUnit.DoesNotExist:
            raise ValidationError({"parent_id": [f"OrgUnit with id {value} does not exist."]})

    def filter_org_unit_type_id(self, queryset: QuerySet, _, value: str) -> QuerySet:
        return queryset.filter(Q(org_unit__org_unit_type_id=value) | Q(new_org_unit_type_id=value))

    def filter_groups(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        """
        `value` is intended to be a comma-separated list of numeric chars.
        """
        groups_ids = [val for val in value.split(",") if val.isnumeric()]
        if not groups_ids:
            raise ValidationError({name: ["Invalid value."]})
        return queryset.filter(Q(org_unit__groups__in=groups_ids) | Q(new_groups__in=groups_ids))
