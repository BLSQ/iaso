from typing import Optional

import django_filters

from django.db import models
from django.db.models import Q, QuerySet
from django.utils.translation import gettext_lazy as _
from django_filters.rest_framework import FilterSet
from django_filters.widgets import QueryArrayWidget

from iaso.api.common import NumberInFilter
from iaso.models import Instance, OrgUnit
from iaso.models.common import ValidationWorkflowArtefactStatus


class ValidationWorkflowInstanceQueue(models.TextChoices):
    AWAITING_MY_ACTION = "awaiting_my_action", _("Awaiting my action")
    AWAITING_OTHERS = "awaiting_others", _("Awaiting others")
    HANDLED_BY_ME = "handled_by_me", _("Handled by me")
    REJECTED = "rejected", _("Rejected")


# Relies on the annotations added by ValidationWorkflowInstanceViewSet._annotate_for_queue
QUEUE_FILTERS = {
    ValidationWorkflowInstanceQueue.AWAITING_MY_ACTION.value: Q(annotate_requires_user_action=True),
    ValidationWorkflowInstanceQueue.AWAITING_OTHERS.value: Q(
        general_validation_status=ValidationWorkflowArtefactStatus.PENDING, annotate_requires_user_action=False
    ),
    ValidationWorkflowInstanceQueue.HANDLED_BY_ME.value: Q(annotate_handled_by_me=True),
    ValidationWorkflowInstanceQueue.REJECTED.value: Q(
        general_validation_status=ValidationWorkflowArtefactStatus.REJECTED
    ),
}


class ValidationWorkflowInstancesListFilters(FilterSet):
    status = django_filters.ChoiceFilter(
        field_name="general_validation_status", choices=ValidationWorkflowArtefactStatus.choices
    )
    validation_workflows = NumberInFilter(field_name="form__validation_workflow", widget=QueryArrayWidget)
    forms = NumberInFilter(field_name="form_id", widget=QueryArrayWidget)
    projects = NumberInFilter(field_name="project_id", widget=QueryArrayWidget)
    requires_user_action = django_filters.BooleanFilter(field_name="annotate_requires_user_action")
    org_units = NumberInFilter(method="filter_org_unit_ids", label=_("Org unit IDs (comma-separated)"))
    queue = django_filters.ChoiceFilter(
        method="filter_queue", choices=ValidationWorkflowInstanceQueue.choices, label=_("Validation queue")
    )

    class Meta:
        model = Instance
        fields = []

    @staticmethod
    def filter_org_unit_ids(queryset: QuerySet, _: str, value: Optional[list[int]]) -> QuerySet:
        if value is None:
            return queryset
        org_units = OrgUnit.objects.hierarchy(OrgUnit.objects.filter(id__in=value))
        return queryset.filter(org_unit__id__in=org_units.values_list("id", flat=True))

    @staticmethod
    def filter_queue(queryset: QuerySet, _: str, value: Optional[str]) -> QuerySet:
        if not value:
            return queryset
        return queryset.filter(QUEUE_FILTERS[value])
