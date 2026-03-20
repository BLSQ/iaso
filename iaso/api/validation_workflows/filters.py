import django_filters

from django_filters.rest_framework import FilterSet

from iaso.api.utils.filters import NumberInFilter
from iaso.models import ValidationWorkflow


class ValidationWorkflowListFilter(FilterSet):
    forms = NumberInFilter(label="Related form ids", field_name="form_set__pk", lookup_expr="in", distinct=True)
    name = django_filters.CharFilter(field_name="name", lookup_expr="icontains")

    class Meta:
        model = ValidationWorkflow
        fields = []
