import django_filters

from django_filters.rest_framework import FilterSet

from iaso.api.common import NumberInFilter
from iaso.models import Instance
from iaso.models.common import ValidationWorkflowArtefactStatus


class ValidationWorkflowInstancesListFilters(FilterSet):
    status = django_filters.ChoiceFilter(
        field_name="general_validation_status", choices=ValidationWorkflowArtefactStatus.choices
    )
    validation_workflows = NumberInFilter(field_name="form__validation_workflow", lookup_expr="in")
    forms = NumberInFilter(field_name="form", lookup_expr="in")
    requires_user_action = django_filters.BooleanFilter(field_name="annotate_requires_user_action")

    class Meta:
        model = Instance
        fields = []
