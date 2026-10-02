"""Queries used to compute the promptness stats.

The computation is done in 3 steps:

1. `get_target_org_units()`: the org units expected to submit the form, each annotated with whether it has a valid
   submission for the period, and whether it has one before the end of the deadline day.
2. `annotate_counts()`: for each org unit of a queryset, count the target org units in its hierarchy (itself included),
   per status, and compute the percentages.
3. `get_rows_queryset()` / `get_totals()`: apply `annotate_counts()` on the rows of the response and on the parent
   org unit.
"""

from typing import List, Optional

from django.db.models import (
    Case,
    DecimalField,
    Exists,
    F,
    IntegerField,
    OuterRef,
    Q,
    QuerySet,
    Subquery,
    Value,
    When,
)
from django.db.models.functions import Cast, Round

from iaso.models import Form, Group, Instance, OrgUnit, OrgUnitType

from .constants import SUBMISSION_TIMESTAMP_FIELD
from .period import PromptnessPeriod


class SubqueryCount(Subquery):
    """Number of rows returned by a subquery (0 when empty)."""

    template = "(SELECT COUNT(*) FROM (%(subquery)s) AS counted_rows)"
    output_field = IntegerField()


def get_valid_submissions(form: Form, period: PromptnessPeriod) -> QuerySet[Instance]:
    """Submissions taken into account: for this form and period, not deleted and with a file."""
    return (
        Instance.objects.filter(form=form, period=period.value, deleted=False)
        .exclude(file__isnull=True)
        .exclude(file="")
    )


def get_target_org_units(form: Form, period: PromptnessPeriod) -> QuerySet[OrgUnit]:
    """`VALID` org units expected to submit the form, annotated with `has_submission` and `submitted_on_time`.

    An org unit is expected to submit the form if its type is one of the form's org unit types, or if it belongs to
    one of the form's org unit groups. Its status depends on its earliest valid submission:
    - no submission: `MISSING` (`has_submission` is `False`)
    - submitted before the end of the deadline day: `ON_TIME` (`submitted_on_time` is `True`)
    - submitted after: `LATE` (`has_submission` is `True`, `submitted_on_time` is `False`)

    The earliest submission is before the deadline if and only if at least one submission is before the deadline:
    both annotations are `EXISTS`, which stop at the first matching submission, instead of looking for the earliest
    one.
    """
    targeted_by_type = Q(org_unit_type__in=form.org_unit_types.all())
    group_members = Group.org_units.through.objects.filter(group__in=form.org_unit_groups.all())
    targeted_by_group = Q(id__in=group_members.values("orgunit_id"))

    submissions = get_valid_submissions(form, period).filter(org_unit=OuterRef("pk"))
    submissions_on_time = submissions.filter(**{f"{SUBMISSION_TIMESTAMP_FIELD}__lt": period.deadline_end})

    return OrgUnit.objects.filter(
        targeted_by_type | targeted_by_group, validation_status=OrgUnit.VALIDATION_VALID
    ).annotate(
        has_submission=Exists(submissions),
        submitted_on_time=Exists(submissions_on_time),
    )


def percentage_of_expected(field_name: str) -> Case:
    """`field_name` / `expected` * 100, rounded to 1 decimal. `None` when nothing is expected."""
    # Cast to numeric: Postgres can only round numeric values to a given number of decimals
    numeric_count = Cast(F(field_name), output_field=DecimalField(max_digits=12, decimal_places=2))
    return Case(
        When(expected=0, then=Value(None)),
        default=Round(numeric_count * 100 / F("expected"), 1),
        output_field=DecimalField(max_digits=5, decimal_places=1),
    )


def annotate_counts(org_units: QuerySet[OrgUnit], target_org_units: QuerySet[OrgUnit]) -> QuerySet[OrgUnit]:
    """Annotate each org unit with the counts of the target org units in its hierarchy (itself included):

    - `expected`: target org units
    - `received`: target org units with a valid submission
    - `on_time`: target org units with a valid submission before the end of the deadline day
    - `late`: `received - on_time`
    - `missing`: `expected - received`
    - `completeness_percent`, `on_time_percent`, `late_percent`, `missing_percent`
    """
    targets_in_hierarchy = target_org_units.filter(path__descendants=OuterRef("path")).values("id")

    return (
        org_units.annotate(
            expected=SubqueryCount(targets_in_hierarchy),
            received=SubqueryCount(targets_in_hierarchy.filter(has_submission=True)),
            on_time=SubqueryCount(targets_in_hierarchy.filter(submitted_on_time=True)),
        )
        .annotate(
            late=F("received") - F("on_time"),
            missing=F("expected") - F("received"),
        )
        .annotate(
            completeness_percent=percentage_of_expected("received"),
            on_time_percent=percentage_of_expected("on_time"),
            late_percent=percentage_of_expected("late"),
            missing_percent=percentage_of_expected("missing"),
        )
    )


def get_rows_queryset(
    parent_org_unit: OrgUnit,
    org_unit_types: Optional[List[OrgUnitType]],
    target_org_units: QuerySet[OrgUnit],
) -> QuerySet[OrgUnit]:
    """Rows of the response, annotated with the counts (see `annotate_counts()`) and `has_children`.

    Rows are the `VALID` direct children of `parent_org_unit`, or, when `org_unit_types` is given, its `VALID`
    descendants having one of these types. The ordering is left to the view.
    """
    rows = OrgUnit.objects.filter(validation_status=OrgUnit.VALIDATION_VALID)
    if org_unit_types:
        rows = rows.hierarchy(parent_org_unit).exclude(id=parent_org_unit.id).filter(org_unit_type__in=org_unit_types)
    else:
        rows = rows.filter(parent=parent_org_unit)

    valid_children = OrgUnit.objects.filter(parent=OuterRef("pk"), validation_status=OrgUnit.VALIDATION_VALID)
    rows = rows.annotate(has_children=Exists(valid_children))

    return annotate_counts(rows, target_org_units).select_related("parent")


def get_totals(parent_org_unit: OrgUnit, target_org_units: QuerySet[OrgUnit]) -> OrgUnit:
    """The parent org unit, annotated with the counts for its whole hierarchy (see `annotate_counts()`)."""
    parent_queryset = OrgUnit.objects.filter(id=parent_org_unit.id)
    return annotate_counts(parent_queryset, target_org_units).get()
