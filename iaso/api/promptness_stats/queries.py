"""Queries used to compute the promptness stats."""

from typing import List, Optional

from django.db.models import QuerySet

from iaso.models import Form, OrgUnit, OrgUnitType

from .period import PromptnessPeriod


def get_target_org_units(form: Form) -> QuerySet[OrgUnit]:
    """`VALID` org units expected to submit the form: their type is in `form.org_unit_types`
    or they belong to one of `form.org_unit_groups`."""
    raise NotImplementedError


def get_rows_queryset(
    form: Form,
    period: PromptnessPeriod,
    parent_org_unit: OrgUnit,
    org_unit_types: Optional[List[OrgUnitType]],
    order: List[str],
) -> QuerySet[OrgUnit]:
    """Rows of the response: direct children of `parent_org_unit` (or its descendants of `org_unit_types`), `VALID` only,
    annotated with `expected`, `on_time`, `late`, `missing` and `has_children`, and ordered by `order`."""
    raise NotImplementedError


def get_totals(form: Form, period: PromptnessPeriod, parent_org_unit: OrgUnit) -> dict:
    """Counts (`expected`, `on_time`, `late`, `missing`) for the whole hierarchy of `parent_org_unit`."""
    raise NotImplementedError
