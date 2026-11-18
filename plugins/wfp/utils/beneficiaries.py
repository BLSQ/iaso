"""Beneficiaries of the dashboard page: the org units of restricted users, the counts and the journeys of a page."""

from django.db.models import Count, Max, Prefetch, Q

from iaso.models import Group, OrgUnit

from ..models import Beneficiary, Journey, Visit


def restricted_org_units(user):
    """Org units of a user restricted to some org units (e.g. the facilities of a partner), None if not restricted."""
    if user.is_superuser or not user.iaso_profile.org_units.exists():
        return None
    return OrgUnit.objects.filter_for_user(user)


def partner_org_units(user, group_id):
    """Org units of a cooperation partner (an org unit group the user can see)."""
    return OrgUnit.objects.filter(groups__in=Group.objects.filter_for_user(user).filter(id=group_id))


def visit_scope(user, group_id=None, facility_id=None):
    """Org units whose visits are shown and exported, None for all of them.

    The cooperation partner (`group_id`) and the facility, intersected with each other and with the org units of the
    user when they are restricted. The ids must already be validated.
    """
    org_units = restricted_org_units(user)

    if group_id:
        in_group = partner_org_units(user, group_id)
        org_units = in_group if org_units is None else in_group.filter(id__in=org_units.values("id"))

    if facility_id:
        facility = OrgUnit.objects.filter_for_user(user).filter(id=facility_id)
        org_units = facility if org_units is None else facility.filter(id__in=org_units.values("id"))
    return org_units


def visits_in(org_units=None):
    """Visits made in `org_units`, all of them for None."""
    visits = Visit.objects.all()
    if org_units is not None:
        visits = visits.filter(org_unit_id__in=org_units.values("id"))
    return visits


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
