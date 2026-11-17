"""Filters of the beneficiaries page, shared by its JSON API and the exports.

They take the user and a dict of filters rather than a request, so that a background export rebuilds exactly the
selection the user made on the page.
"""

from django.db.models import Count, Max, Prefetch, Q
from django.db.models.fields.json import KeyTextTransform
from django.utils.dateparse import parse_date

from iaso.models import Group, OrgUnit

from .models import Beneficiary, Journey, Visit


FILTER_KEYS = (
    "entity_type",
    "programme",
    "org_unit_group",
    "facility",
    "q",
    "visit_date_after",
    "visit_date_before",
)


def filters_from_params(params) -> dict[str, str]:
    """The filters of the beneficiaries page found in `params` (a QueryDict or a dict), as stripped strings."""
    return {key: str(params.get(key) or "").strip() for key in FILTER_KEYS if params.get(key)}


def restricted_org_units(user):
    """Org units of a user restricted to some org units (e.g. the facilities of a partner), None if not restricted."""
    if user.is_superuser or not user.iaso_profile.org_units.exists():
        return None
    return OrgUnit.objects.filter_for_user(user)


def facility_scope(user, filters):
    """Org units whose visits are shown and exported, None for all of them.

    The selected cooperation partner (`org_unit_group`) and integrated nutrition facility (`facility`), intersected
    with each other and with the org units of the user when they are restricted.
    """
    org_units = restricted_org_units(user)

    group_id = filters.get("org_unit_group", "")
    if group_id.isdigit():
        in_group = OrgUnit.objects.filter(groups__in=Group.objects.filter_for_user(user).filter(id=group_id))
        org_units = in_group if org_units is None else in_group.filter(id__in=org_units.values("id"))

    facility_id = filters.get("facility", "")
    if facility_id.isdigit():
        facility = OrgUnit.objects.filter_for_user(user).filter(id=facility_id)
        org_units = facility if org_units is None else facility.filter(id__in=org_units.values("id"))
    return org_units


def filtered_beneficiaries(account, filters, org_units=None):
    """Beneficiaries of the account matching the filters of the beneficiaries page (shared with its exports).

    With an org unit scope, only the beneficiaries with at least one visit in these org units are kept.
    """
    queryset = (
        Beneficiary.objects.filter(entity__account=account)
        .select_related("entity__entity_type")
        .annotate(progress_id=KeyTextTransform("progress_id", "entity__attributes__json"))
    )

    if org_units is not None:
        queryset = queryset.filter(
            id__in=Visit.objects.filter(org_unit_id__in=org_units.values("id")).values("journey__beneficiary_id")
        )

    entity_type_id = filters.get("entity_type", "")
    if entity_type_id.isdigit():
        queryset = queryset.filter(entity__entity_type_id=entity_type_id)

    programme = filters.get("programme", "")
    if programme:
        # Subquery rather than a join, so that the counts of the page still cover all the journeys.
        queryset = queryset.filter(
            id__in=Journey.objects.filter(nutrition_programme=programme).values("beneficiary_id")
        )

    search = filters.get("q", "")
    if search:
        criteria = Q(progress_id__istartswith=search)
        criteria |= Q(entity_id=search) if search.isdigit() else Q(entity__uuid__startswith=search)
        queryset = queryset.filter(criteria)

    after = parse_date(filters.get("visit_date_after", "") or "")
    before = parse_date(filters.get("visit_date_before", "") or "")
    if after or before:
        visits = Visit.objects.filter(journey__exit_type__isnull=True)
        if org_units is not None:
            visits = visits.filter(org_unit_id__in=org_units.values("id"))
        if after:
            visits = visits.filter(date__date__gte=after)
        if before:
            visits = visits.filter(date__date__lte=before)
        queryset = queryset.filter(id__in=visits.values("journey__beneficiary_id"))
    return queryset


def with_counts(beneficiaries, org_units=None):
    """Annotate the journeys and visits counts and the last visit date of beneficiaries (in the org units if any)."""
    in_scope = Q() if org_units is None else Q(journey__visit__org_unit_id__in=org_units.values("id"))
    return beneficiaries.annotate(
        journeys_count=Count("journey", filter=in_scope, distinct=True),
        visits_count=Count("journey__visit", filter=in_scope, distinct=True),
        last_visit_date=Max("journey__visit__date", filter=in_scope),
    )


VISIT_ORDERS = {"date", "-date", "number", "-number"}


def visit_ordering(order: str = ""):
    """The ordering of the visits of a journey for `order` ("date", "-date", "number" or "-number"), by date by default."""
    order = order if order in VISIT_ORDERS else "date"
    return [order, "-id" if order.startswith("-") else "id"]


def attach_journeys(beneficiaries, org_units=None, visits_order: str = "") -> None:
    """Set `journeys` on each beneficiary (e.g. of a page), with their visits and steps prefetched.

    With an org unit scope, only its visits (and the journeys having some) are attached.
    The visits of each journey are ordered by `visits_order` (see `visit_ordering`).
    """
    journeys = Journey.objects.all()
    visits = Visit.objects.all()
    if org_units is not None:
        visits = visits.filter(org_unit_id__in=org_units.values("id"))
        journeys = journeys.filter(id__in=visits.values("journey_id"))
    with_journeys = Beneficiary.objects.filter(id__in=[b.id for b in beneficiaries]).prefetch_related(
        Prefetch("journey_set", queryset=journeys.order_by("start_date", "id")),
        Prefetch(
            "journey_set__visit_set",
            queryset=visits.select_related("org_unit")
            .prefetch_related("step_set")
            .order_by(*visit_ordering(visits_order)),
        ),
    )
    journeys_by_beneficiary = {b.id: list(b.journey_set.all()) for b in with_journeys}
    for beneficiary in beneficiaries:
        beneficiary.journeys = journeys_by_beneficiary.get(beneficiary.id, [])
