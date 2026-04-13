import django_filters

from django.conf import settings
from django.db.models import Q
from django.db.models.query import QuerySet
from django.utils.translation import gettext_lazy as _

from hat.audit.models import Modification
from iaso.api.common import parse_comma_separated_numeric_values


class ProfileLogsListFilter(django_filters.rest_framework.FilterSet):
    class Meta:
        model = Modification
        fields = []

    # using CharFilter as NumberFilter errors for some reason
    user_ids = django_filters.CharFilter(method="filter_user_ids", label=_("User IDs"))
    modified_by = django_filters.CharFilter(method="filter_modified_by", label=_("Modified by"))
    org_unit_id = django_filters.CharFilter(method="filter_org_unit_id", label=_("Location"))
    created_at = django_filters.DateFromToRangeFilter()

    def filter_user_ids(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        user_ids = [user_id for user_id in parse_comma_separated_numeric_values(value, name)]
        # There's always a new_value, even on delete
        return queryset.filter(new_value__0__fields__user__in=user_ids)

    def filter_modified_by(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        user_ids = parse_comma_separated_numeric_values(value, name)
        return queryset.filter(user__id__in=user_ids)

    def filter_org_unit_id(self, queryset: QuerySet, name: str, value: str) -> QuerySet:
        return queryset.filter(
            Q(past_value__0__fields__org_units__contains=int(value))
            | Q(new_value__0__fields__org_units__contains=int(value))
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.form.fields["created_at"].fields[0].input_formats = settings.API_DATE_INPUT_FORMATS
        self.form.fields["created_at"].fields[-1].input_formats = settings.API_DATE_INPUT_FORMATS
