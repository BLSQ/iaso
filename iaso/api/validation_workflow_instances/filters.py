import django_filters

from django_filters.rest_framework import FilterSet
from django_filters.widgets import QueryArrayWidget

from iaso.api.common import NumberInFilter
from iaso.models import Instance
from iaso.models.common import ValidationWorkflowArtefactStatus


class ValidationWorkflowInstancesListFilters(FilterSet):
    status = django_filters.ChoiceFilter(
        field_name="general_validation_status", choices=ValidationWorkflowArtefactStatus.choices
    )
    validation_workflows = NumberInFilter(field_name="form__validation_workflow", widget=QueryArrayWidget)
    forms = NumberInFilter(field_name="form_id", widget=QueryArrayWidget)
    requires_user_action = django_filters.BooleanFilter(field_name="annotate_requires_user_action")

    class Meta:
        model = Instance
        fields = []
