"""Queries used to compute the promptness stats.

The computation is done in 3 steps:

1. `get_target_org_units()`: the org units expected to submit the form, each annotated with whether it has a valid
   submission for the period, and whether it has one before the end of the deadline day.
2. `annotate_counts()`: the targets in the hierarchy of the parent org unit are computed once, in a materialized CTE.
   Each org unit of a queryset is then joined to the targets of its hierarchy (itself included), to count them per
   status and compute the percentages.
3. `annotate_rows()` / `get_totals()`: apply `annotate_counts()` on the rows of the response (see `get_rows()`) and on
   the parent org unit.
"""

from typing import List, NamedTuple, Optional

from django.db.models import (
    BooleanField,
    Case,
    Count,
    DecimalField,
    Exists,
    ExpressionWrapper,
    F,
    Func,
    IntegerField,
    OuterRef,
    Q,
    QuerySet,
    Value,
    When,
)
from django.db.models.functions import Cast, Round
from django.db.models.sql.constants import LOUTER
from django_cte import With

from iaso.models import Form, Group, Instance, OrgUnit, OrgUnitType

from .period import PromptnessPeriod


class PathOrgUnitIds(Func):
    """Ids of the org units of an ltree path, i.e. the org unit and all its ancestors: one row per id.

    In iaso, the path of an org unit is the list of the ids of its ancestors, from the root, followed by its own id
    (e.g. `1.12.120`).
    """

    template = "unnest(string_to_array(%(expressions)s::text, '.'))::integer"
    output_field = IntegerField()


def get_valid_submissions(form: Form, period: PromptnessPeriod) -> QuerySet[Instance]:
    """Submissions taken into account: for this form and period, not deleted and with a file.

    These filters are the condition of the partial index `iaso_instance_promptness_idx`: they
    must stay the same, otherwise Postgres can't use the index.
    """
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
    submissions_on_time = submissions.filter(
        created_at__lt=period.deadline_end
    )  # upload date, not creation on mobile date

    return OrgUnit.objects.filter(
        targeted_by_type | targeted_by_group, validation_status=OrgUnit.VALIDATION_VALID
    ).annotate(
        has_submission=Exists(submissions),
        submitted_on_time=Exists(submissions_on_time),
    )


def percentage_of_expected(field_name: str) -> Case:
    """`field_name` / `expected` * 100, rounded half up to 1 decimal (Postgres `round()` on `numeric`), as a `Decimal`.
    `None` when nothing is expected."""
    # Cast to numeric: Postgres can only round numeric values to a given number of decimals
    numeric_count = Cast(F(field_name), output_field=DecimalField(max_digits=12, decimal_places=2))
    return Case(
        When(expected=0, then=Value(None)),
        default=Round(numeric_count * 100 / F("expected"), 1),
        output_field=DecimalField(max_digits=5, decimal_places=1),
    )


class TargetsCTEs(NamedTuple):
    """CTEs of the targets in the hierarchy of a parent org unit, see `get_targets_ctes()`"""

    targets: With
    target_paths: With


def get_targets_ctes(target_org_units: QuerySet[OrgUnit], parent_org_unit: OrgUnit) -> TargetsCTEs:
    """The targets in the hierarchy of `parent_org_unit` (itself included), with their status, as 2 CTEs.

    `targets`, materialized: one row per target. The targets and their submissions are computed once, instead of once
    per org unit they are counted for. Columns:
    - `id`, `path`
    - `submitted_id`: the id of the target if it has a valid submission, `NULL` otherwise
    - `on_time_id`: the id of the target if it has a valid submission before the end of the deadline day, `NULL`
      otherwise

    `target_paths`: the rows of `targets`, repeated once per org unit of their path (the target and each of its
    ancestors), in a `path_org_unit_id` column. An org unit can then be joined to the targets of its hierarchy with an
    equality on `path_org_unit_id` (a hash join), instead of a comparison of the paths (`@>`, which compares every org
    unit with every target).

    `COUNT()` ignores the `NULL` values: counting `id`, `submitted_id` and `on_time_id` gives the number of targets, of
    targets with a submission and of targets with a submission on time.
    """
    targets = With(
        target_org_units.hierarchy(parent_org_unit)
        .values("id", "path")
        .annotate(
            submitted_id=Case(When(has_submission=True, then=F("id"))),
            on_time_id=Case(When(submitted_on_time=True, then=F("id"))),
        ),
        name="promptness_targets",
        materialized=True,
    )
    target_paths = With(
        targets.queryset()
        .annotate(path_org_unit_id=PathOrgUnitIds("path"))
        .values("id", "path_org_unit_id", "submitted_id", "on_time_id"),
        name="promptness_target_paths",
    )
    return TargetsCTEs(targets=targets, target_paths=target_paths)


def annotate_counts(org_units: QuerySet[OrgUnit], targets_ctes: TargetsCTEs) -> QuerySet[OrgUnit]:
    """Annotate each org unit with the counts of the targets in its hierarchy (itself included):

    - `expected`: target org units
    - `received`: target org units with a valid submission
    - `on_time`: target org units with a valid submission before the end of the deadline day
    - `late`: `received - on_time`
    - `missing`: `expected - received`
    - `completeness_percent`, `on_time_percent`, `late_percent`, `missing_percent`

    `targets_ctes` are built by `get_targets_ctes()`, for a parent org unit whose hierarchy contains `org_units`.
    """
    target_paths = targets_ctes.target_paths
    # Each org unit is joined to the targets of its hierarchy (the org unit is the target, or one of its ancestors),
    # then the targets are counted per org unit. LEFT JOIN: the org units without any target are kept, with counts at 0.
    org_units_with_targets = target_paths.join(org_units, id=target_paths.col.path_org_unit_id, _join_type=LOUTER)

    return (
        org_units_with_targets.with_cte(targets_ctes.targets)
        .with_cte(target_paths)
        .annotate(
            expected=Count(target_paths.col.id),
            received=Count(target_paths.col.submitted_id),
            on_time=Count(target_paths.col.on_time_id),
        )
        .annotate(
            is_applicable=ExpressionWrapper(Q(expected__gt=0), output_field=BooleanField()),  # order NA rows last
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


def get_rows(parent_org_unit: OrgUnit, org_unit_types: Optional[List[OrgUnitType]]) -> QuerySet[OrgUnit]:
    """Rows of the response, without their counts.

    Rows are the `VALID` direct children of `parent_org_unit`, or, when `org_unit_types` is given, its `VALID`
    descendants having one of these types. Counting them is cheap: there is no targets CTE yet
    """
    rows = OrgUnit.objects.filter(validation_status=OrgUnit.VALIDATION_VALID)
    if org_unit_types:
        return rows.hierarchy(parent_org_unit).exclude(id=parent_org_unit.id).filter(org_unit_type__in=org_unit_types)
    return rows.filter(parent=parent_org_unit)


def annotate_rows(
    rows: QuerySet[OrgUnit], parent_org_unit: OrgUnit, target_org_units: QuerySet[OrgUnit]
) -> QuerySet[OrgUnit]:
    """The rows of `get_rows()`, annotated with the counts (see `annotate_counts()`) and `has_children`.

    The rows keep their number: each row is joined to the targets of its hierarchy (LEFT JOIN), then grouped by row.
    The ordering is left to the view.
    """
    valid_children = OrgUnit.objects.filter(parent=OuterRef("pk"), validation_status=OrgUnit.VALIDATION_VALID)
    rows = rows.annotate(has_children=Exists(valid_children))

    targets_ctes = get_targets_ctes(target_org_units, parent_org_unit)
    return (
        annotate_counts(rows, targets_ctes)
        .select_related("parent")
        # Only the columns used by `PromptnessStatsRowSerializer`
        .only("id", "name", "org_unit_type", "parent__id", "parent__name")
    )


def get_totals(parent_org_unit: OrgUnit, target_org_units: QuerySet[OrgUnit]) -> OrgUnit:
    """The parent org unit, annotated with the counts for its whole hierarchy (see `annotate_counts()`)."""
    parent_queryset = OrgUnit.objects.filter(id=parent_org_unit.id).only(
        "id"
    )  # only the id for PromptnessStatsTotalsSerializer
    targets_ctes = get_targets_ctes(target_org_units, parent_org_unit)
    return annotate_counts(parent_queryset, targets_ctes).get()
