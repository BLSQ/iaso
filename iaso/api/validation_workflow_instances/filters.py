import django_filters

from django.utils.translation import gettext_lazy as _
from django_filters.rest_framework import FilterSet
from django_filters.widgets import QueryArrayWidget

from iaso.api.common import NumberInFilter
from iaso.models import Instance, OrgUnit
from iaso.models.common import ValidationWorkflowArtefactStatus


class ValidationWorkflowInstancesListFilters(FilterSet):
    status = django_filters.ChoiceFilter(
        field_name="general_validation_status", choices=ValidationWorkflowArtefactStatus.choices
    )
    validation_workflows = NumberInFilter(field_name="form__validation_workflow", widget=QueryArrayWidget)
    forms = NumberInFilter(field_name="form_id", widget=QueryArrayWidget)
    projects = NumberInFilter(field_name="project_id", widget=QueryArrayWidget)
    requires_user_action = django_filters.BooleanFilter(field_name="annotate_requires_user_action")
    org_units = NumberInFilter(method="filter_org_unit_ids", label=_("Org unit IDs (comma-separated)"))

    class Meta:
        model = Instance
        fields = []

    @staticmethod
    def filter_org_unit_ids(queryset, name, value):
        if value is None:
            return queryset
        org_units = OrgUnit.objects.hierarchy(OrgUnit.objects.filter(id__in=value))
        return queryset.filter(org_unit__id__in=org_units.values_list("id", flat=True))
