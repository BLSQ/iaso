import django_filters
from rest_framework.exceptions import ValidationError

from django.conf import settings
from django.db.models import Q
from django.db.models.query import QuerySet
from django.utils.translation import gettext_lazy as _

from iaso.models import OrgUnitChangeRequest, OrgUnit, PotentialPayment


class PaymentsListFilter(django_filters.rest_framework.FilterSet):
    change_requests__created_at = django_filters.DateFromToRangeFilter()
    parent_id = django_filters.NumberFilter(method="filter_parent_id", label=_("Parent ID"))
    forms = django_filters.CharFilter(method="filter_forms", label=_("Forms IDs (comma-separated)"))
    users = django_filters.CharFilter(method="filter_users", label=_("Users IDs (comma-separated)"))
    user_roles = django_filters.CharFilter(method="filter_user_roles", label=_("User roles IDs (comma-separated)"))

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
        self.form.fields["change_requests__created_at"].fields[0].input_formats = settings.API_DATE_INPUT_FORMATS
        self.form.fields["change_requests__created_at"].fields[1].input_formats = settings.API_DATE_INPUT_FORMATS

    class Meta:
        model = PotentialPayment
        fields = ["user"]

    def filter_parent_id(self, queryset: QuerySet, _, value: str) -> QuerySet:
        try:
            parent = OrgUnit.objects.get(id=value)
            parent_qs = OrgUnit.objects.filter(id=parent.id)
            descendants_qs = OrgUnit.objects.hierarchy(parent_qs).values_list("id", flat=True)
            print(descendants_qs)
            return queryset.filter(Q(change_requests__org_unit__id__in=descendants_qs))
        except OrgUnit.DoesNotExist:
            raise ValidationError({"parent_id": [f"OrgUnit with id {value} does not exist."]})

    def filter_forms(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        forms_ids = self.parse_comma_separated_numeric_values(value, name)
        return queryset.filter(Q(change_requests__org_unit__reference_instances__form_id__in=forms_ids))

    def filter_users(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        users_ids = self.parse_comma_separated_numeric_values(value, name)
        return queryset.filter(change_requests__created_by__in=users_ids)

    def filter_user_roles(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        users_roles_ids = self.parse_comma_separated_numeric_values(value, name)
        return queryset.filter(Q(change_requests__created_by__iaso_profile__user_roles__id__in=users_roles_ids))

    # def filter_change_requests_created_at(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
    #     if value:
    #         start_date, end_date = value
    #         if start_date:
    #             queryset = queryset.filter(change_requests__created_at__gte=start_date)
    #         if end_date:
    #             queryset = queryset.filter(change_requests__created_at__lte=end_date)
    #     return queryset
