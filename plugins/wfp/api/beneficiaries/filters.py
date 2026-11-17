"""Filters and ordering of the beneficiaries API, shared by the list and its xlsx exports."""

import django_filters

from django import forms
from django.db.models import F, Q
from django.utils.functional import cached_property

from iaso.models import Group, OrgUnit
from plugins.wfp.models import NUTRITION_PROGRAMMES, Beneficiary, Journey, Visit
from plugins.wfp.utils.beneficiaries import restricted_org_units


class IdFilter(django_filters.NumberFilter):
    """The id of an object: a positive integer (decimals and negative numbers are rejected)."""

    field_class = forms.IntegerField

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("min_value", 1)
        super().__init__(*args, **kwargs)


def partner_org_units(user, group_id):
    """Org units of a cooperation partner (an org unit group the user can see)."""
    return OrgUnit.objects.filter(groups__in=Group.objects.filter_for_user(user).filter(id=group_id))


class BeneficiaryFilter(django_filters.FilterSet):
    """Beneficiaries of the page, restricted to the visits of `org_units` (the partner, facility and user scope).

    `visit_date_after` / `visit_date_before` keep the beneficiaries visited in the period (in the scope) for a journey
    they didn't exit yet.
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

    @cached_property
    def org_units(self):
        """Org units whose visits are shown and exported, None for all of them.

        The selected cooperation partner (`org_unit_group`) and facility, intersected with each other and with the
        org units of the user when they are restricted. Only available once the filters are validated.
        """
        user = self.request.user
        org_units = restricted_org_units(user)

        group_id = self.form.cleaned_data.get("org_unit_group")
        if group_id:
            in_group = partner_org_units(user, group_id)
            org_units = in_group if org_units is None else in_group.filter(id__in=org_units.values("id"))

        facility_id = self.form.cleaned_data.get("facility")
        if facility_id:
            facility = OrgUnit.objects.filter_for_user(user).filter(id=facility_id)
            org_units = facility if org_units is None else facility.filter(id__in=org_units.values("id"))
        return org_units

    def _visits(self):
        visits = Visit.objects.all()
        if self.org_units is not None:
            visits = visits.filter(org_unit_id__in=self.org_units.values("id"))
        return visits

    def filter_queryset(self, queryset):
        # Only the beneficiaries with at least one visit in the scope.
        if self.org_units is not None:
            queryset = queryset.filter(id__in=self._visits().values("journey__beneficiary_id"))
        return super().filter_queryset(queryset)

    def filter_scope(self, queryset, name, value):
        # Applied by `filter_queryset`, as both filters are combined with the org units of the user.
        return queryset

    def filter_programme(self, queryset, name, value):
        # Subquery rather than a join, so that the counts of the page still cover all the journeys.
        return queryset.filter(id__in=Journey.objects.filter(nutrition_programme=value).values("beneficiary_id"))

    def filter_search(self, queryset, name, value):
        value = value.strip()
        criteria = Q(progress_id__istartswith=value)
        criteria |= Q(entity_id=value) if value.isdigit() else Q(entity__uuid__startswith=value)
        return queryset.filter(criteria)

    def filter_visit_date(self, queryset, name, value):
        visits = self._visits().filter(journey__exit_type__isnull=True)
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
