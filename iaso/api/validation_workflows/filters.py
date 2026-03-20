import django_filters

from django.db.models import Q
from django_filters.rest_framework import FilterSet

from iaso.api.utils.filters import NumberInFilter
from iaso.models import Instance, ValidationWorkflow


class ValidationWorkflowListFilter(FilterSet):
    forms = NumberInFilter(label="Related form ids", field_name="form_set__pk", lookup_expr="in", distinct=True)
    name = django_filters.CharFilter(field_name="name", lookup_expr="icontains")

    class Meta:
        model = ValidationWorkflow
        fields = []


class MobileValidationWorkflowListFilter(FilterSet):
    last_sync = django_filters.IsoDateTimeFilter(method="filter_last_sync")
    app_id = django_filters.CharFilter(field_name="projects__app_id")

    class Meta:
        model = Instance
        fields = []

    def filter_last_sync(self, queryset, name, value):
        """
        Filter by last updated for the instance and last updated for the history.
        """
        if value:
            return queryset.filter(Q(updated_at__gte=value) | Q(validationnode__updated_at__gte=value))
        return queryset
