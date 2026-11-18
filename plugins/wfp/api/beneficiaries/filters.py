"""Filters and ordering of the beneficiaries API, shared by the list and its xlsx exports."""

import django_filters

from django import forms
from django.db.models import F, Q

from iaso.models import OrgUnit
from plugins.wfp.models import NUTRITION_PROGRAMMES, Beneficiary, Journey
from plugins.wfp.utils.beneficiaries import partner_org_units, visit_scope, visits_in


class IdFilter(django_filters.NumberFilter):
    """The id of an object: a positive integer (decimals and negative numbers are rejected)."""

    field_class = forms.IntegerField

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("min_value", 1)
        super().__init__(*args, **kwargs)


class BeneficiaryFilter(django_filters.FilterSet):
    """Beneficiaries of the page, restricted to the visits of `org_units` (the partner, facility and user scope).

    `visit_date_after` / `visit_date_before` keep the beneficiaries visited in the period (in the scope) for a journey
    they didn't exit yet.

    This filterset is meant to be used only in `BeneficiaryViewSet`: when filtering, the visit scope is handed to
    the view (`set_visit_scope`), reached through `request.parser_context["view"]`, as its counts,
    journeys and exports are restricted to the same visits.
    """

    entity_type = IdFilter(field_name="entity__entity_type_id")
    programme = django_filters.ChoiceFilter(choices=NUTRITION_PROGRAMMES, method="filter_programme")
    org_unit_group = IdFilter(method="filter_scope", help_text="The cooperation partner")
    facility = IdFilter(method="filter_scope", help_text="An integrated nutrition facility of the partner")
    q = django_filters.CharFilter(method="filter_search", help_text="Entity id, start of the UUID or progress id")
    visit_date = django_filters.DateFromToRangeFilter(method="filter_visit_date")

    class Meta:
        model = Beneficiary
        fields = []

    def filter_queryset(self, queryset):
        data = self.form.cleaned_data
        self.org_units = visit_scope(self.request.user, data.get("org_unit_group"), data.get("facility"))

        # this FilterSet is used to filter both the Beneficiary queryset and the Visit queryset, the latter is used later by the view
        self.request.parser_context["view"].set_visit_scope(self.org_units)
        if self.org_units is not None:
            queryset = queryset.filter(id__in=visits_in(self.org_units).values("journey__beneficiary_id"))
        return super().filter_queryset(queryset)

    def filter_scope(self, queryset, name, value):
        # skipping any filtering now, because the scope is applied by `filter_queryset`.
        return queryset

    def filter_programme(self, queryset, name, value):
        # Subquery rather than a join, so that the counts of the page still cover all the journeys.
        return queryset.filter(id__in=Journey.objects.filter(nutrition_programme=value).values("beneficiary_id"))

    def filter_search(self, queryset, name, value):
        value = value.strip()
        criteria = Q(progress_id__istartswith=value) | Q(entity__uuid__startswith=value)
        if value.isdigit():
            criteria |= Q(entity_id=value)
        return queryset.filter(criteria)

    def filter_visit_date(self, queryset, name, value):
        # `org_units` is set by `filter_queryset`, before the filters are applied.
        visits = visits_in(self.org_units).filter(journey__exit_type__isnull=True)
        if value.start:
            visits = visits.filter(date__date__gte=value.start)
        if value.stop:
            visits = visits.filter(date__date__lte=value.stop)
        return queryset.filter(id__in=visits.values("journey__beneficiary_id"))


class FacilityFilter(django_filters.FilterSet):
    """Facilities of a cooperation partner that the user can see, none without `org_unit_group`."""

    org_unit_group = IdFilter(method="filter_org_unit_group", help_text="The cooperation partner")

    class Meta:
        model = OrgUnit
        fields = []

    def filter_queryset(self, queryset):
        if not self.form.cleaned_data.get("org_unit_group"):
            return queryset.none()
        return super().filter_queryset(queryset)

    def filter_org_unit_group(self, queryset, name, value):
        return queryset.filter(id__in=partner_org_units(self.request.user, value).values("id"))


ORDER_FIELDS = (
    "entity_id",
    "progress_id",
    "birth_date",
    "gender",
    "journeys_count",
    "visits_count",
    "last_visit_date",
)


def ordering_from_param(order: str):
    """The ordering of the `order` query param (e.g. "-last_visit_date,entity_id"), most recent visits by default."""
    ordering = []
    for key in (order or "-last_visit_date").split(","):
        field_name = key.lstrip("-")
        if field_name not in ORDER_FIELDS:
            continue

        expression = F(field_name)
        ordering.append(expression.desc(nulls_last=True) if key.startswith("-") else expression.asc(nulls_last=True))
    return ordering + ["-id"]
