import django_filters
from rest_framework.exceptions import ValidationError

from django.conf import settings
from django.db.models import Q
from django.db.models.query import QuerySet
from django.utils.translation import gettext_lazy as _
from django.contrib.gis.geos import GEOSGeometry
from django.db.models.functions import Cast
from django.contrib.gis.db.models import PointField

from iaso.models import OrgUnitChangeRequest, OrgUnit


class MobileOrgUnitChangeRequestListFilter(django_filters.rest_framework.FilterSet):
    last_sync = django_filters.IsoDateTimeFilter(field_name="updated_at", lookup_expr="gte")

    class Meta:
        model = OrgUnitChangeRequest
        fields = []


class OrgUnitChangeRequestListFilter(django_filters.rest_framework.FilterSet):
    org_unit_id = django_filters.NumberFilter(field_name="org_unit_id", label=_("Org unit ID"))
    org_unit_type_id = django_filters.CharFilter(method="filter_org_unit_type_id", label=_("Org unit type ID"))
    parent_id = django_filters.NumberFilter(method="filter_parent_id", label=_("Parent ID"))
    groups = django_filters.CharFilter(method="filter_groups", label=_("Groups IDs (comma-separated)"))
    project = django_filters.NumberFilter(field_name="org_unit__org_unit_type__projects", label=_("Project ID"))
    created_at = django_filters.DateFromToRangeFilter()

    forms = django_filters.CharFilter(method="filter_forms", label=_("Forms IDs (comma-separated)"))
    users = django_filters.CharFilter(method="filter_users", label=_("Users IDs (comma-separated)"))
    user_roles = django_filters.CharFilter(method="filter_user_roles", label=_("User roles IDs (comma-separated)"))
    with_location = django_filters.CharFilter(method="filter_with_location", label=_("With or without location"))

    @staticmethod
    def parse_comma_separated_numeric_values(value: str, field_name: str) -> list:
        """
        Parses a comma-separated string of numeric values and returns a list of integers.
        Raises a ValidationError if the input is not valid.
        """
        ids = [val for val in value.split(",") if val.isnumeric()]
        if not ids:
            raise ValidationError({field_name: ["Invalid value."]})
        return [int(val) for val in ids]

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
            return queryset.filter(Q(old_parent_id__in=descendants_qs) | Q(new_parent_id__in=descendants_qs))
        except OrgUnit.DoesNotExist:
            raise ValidationError({"parent_id": [f"OrgUnit with id {value} does not exist."]})

    def filter_org_unit_type_id(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        org_unit_type_ids = self.parse_comma_separated_numeric_values(value, name)
        return queryset.filter(
            Q(old_org_unit_type__id__in=org_unit_type_ids) | Q(new_org_unit_type__id__in=org_unit_type_ids)
        )

    def filter_groups(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        groups_ids = self.parse_comma_separated_numeric_values(value, name)
        return queryset.filter(Q(old_groups__in=groups_ids) | Q(new_groups__in=groups_ids))

    def filter_forms(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        forms_ids = self.parse_comma_separated_numeric_values(value, name)
        return queryset.filter(
            Q(old_reference_instances__form_id__in=forms_ids) | Q(new_reference_instances__form_id__in=forms_ids)
        )

    def filter_users(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        users_ids = self.parse_comma_separated_numeric_values(value, name)
        return queryset.filter(Q(created_by_id__in=users_ids) | Q(updated_by__in=users_ids))

    def filter_user_roles(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        users_roles_ids = self.parse_comma_separated_numeric_values(value, name)
        return queryset.filter(
            Q(created_by__iaso_profile__user_roles__id__in=users_roles_ids)
            | Q(updated_by__iaso_profile__user_roles__id__in=users_roles_ids)
        )

    def filter_with_location(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        """
        `value` is intended to be boolean string "true" or "false".
        """

        has_location = Q(new_location__isnull=False) | Q(old_location__isnull=False)

        if value == "true":
            queryset = queryset.filter(has_location)

        if value == "false":
            queryset = queryset.exclude(has_location)

        return queryset
