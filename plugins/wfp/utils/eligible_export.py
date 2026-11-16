"""Export of the eligible beneficiaries: those with an ongoing journey (no exit yet), one sheet per programme.

One row per ongoing journey, built from its last visit that counts for the period (given by a start and an end date,
by default from the 26th of the previous month to the 25th of the current month, or today if it is before):
- the visit was made during the period;
- its submission was synchronised to the server by the end of the period (the cut-off);
- the beneficiary was found normal at that visit: green colour (stored by the ETL, else read from the submission of
  the visit like the ETL does), else a normal MUAC.

The identifiers (progress ID, case ID, FCN) and the camp are answers of the reference (registration) form; the INF
is the org unit of the visit. The pregnant and breastfeeding women are split in one sheet per physiology status.
Answers are filtered according to the PII configuration of their form, like in the other exports. The answers are
read with the helpers of the ETL (`plugins.wfp.common`), so that both agree.
"""

import datetime
import re
import typing

from dataclasses import dataclass, field

import xlsxwriter

from django.db.models import Prefetch
from django.utils import timezone

from iaso.models import Instance
from iaso.utils.pii import filter_submission_json

from ..common import _first_of, _safe_float, _to_date, extract_pbwg_physiology, extract_whz_color
from ..models import Beneficiary, Journey, Visit


BATCH_SIZE = 500

U5 = "U5"
PBWG = "PBWG"
# MUAC (in cm) from which a beneficiary is normal, when neither the ETL nor the form gives a colour
NORMAL_MUAC = {U5: 12.5, PBWG: 23.0}


def current_period(today: datetime.date) -> tuple[datetime.date, datetime.date]:
    """From the 26th of the previous month to the 25th of the current month (both included)."""
    end = today.replace(day=25)
    previous_month = today.replace(day=1) - datetime.timedelta(days=1)
    return previous_month.replace(day=26), end


@dataclass
class Row:
    """What is known about an eligible journey when building its row."""

    beneficiary: Beneficiary
    journey: Journey
    visit: Visit
    synced_at: typing.Optional[datetime.datetime]
    nutritional_status: str
    reference_answers: dict  # filtered answers of the reference (registration) form
    visit_answers: dict  # filtered answers of the submission of the visit
    # filtered answers of the submissions of the other visits of the journey, the most recent first (e.g. the EDD is
    # only asked at the first visit)
    journey_answers: list[dict] = field(default_factory=list)

    def answer(self, *candidates: str, sources: str = "all"):
        """First non-empty answer to one of the candidate questions.

        `sources`: "all" (the reference form, the submission of the visit, then the other visits of the journey),
        "reference" or "visit" (the submission of the visit only).
        """
        all_answers = {
            "all": [self.reference_answers, self.visit_answers, *self.journey_answers],
            "reference": [self.reference_answers],
            "visit": [self.visit_answers],
        }[sources]
        return next((value for answers in all_answers if (value := _first_of(answers, *candidates)) is not None), None)

    @property
    def visit_date(self) -> typing.Optional[datetime.date]:
        return _to_date(self.visit.date)

    def age_in_months(self) -> typing.Optional[int]:
        birth_date = self.beneficiary.birth_date
        visit_date = self.visit_date

        if not birth_date or not visit_date:
            return None

        months = (visit_date.year - birth_date.year) * 12
        months += visit_date.month - birth_date.month

        if visit_date.day < birth_date.day:
            months -= 1
        return months

    def age_in_years(self) -> typing.Optional[int]:
        months = self.age_in_months()

        if months is None:
            return None
        return months // 12

    def camp(self):
        org_unit = self.visit.org_unit
        return self.answer("camp", "camp_name") or (org_unit.parent.name if org_unit and org_unit.parent else None)

    def inf(self):
        return self.visit.org_unit.name if self.visit.org_unit else None

    def physiology_status(self) -> typing.Optional[str]:
        """ "pregnant" or "breastfeeding" at the exported visit (it can change during a journey), else of the journey."""
        return (
            extract_pbwg_physiology(self.visit_answers)
            or self.journey.physiology_status
            or extract_pbwg_physiology(self.reference_answers)
        )

    def child_birth_date(self):
        if self.physiology_status() == "pregnant":
            return None
        return self.answer(
            "_final_child_dob", "_new_child_dob", "child_dob__date__", "child_dob", "child_birth_date", "dob_child"
        )

    def expected_delivery_date(self):
        if self.physiology_status() != "pregnant":
            return None
        return self.answer("pregnancy_edd")


def _progress_id(row: Row):
    return row.answer("progress_id", "progressid")


def _case_id(row: Row):
    return row.answer("case_id", sources="reference")


def _fcn(row: Row):
    # both spellings exist in the registration forms
    return row.answer("fcn_number", "fnc_number")


IDENTIFIERS: list[tuple[str, typing.Callable[[Row], typing.Any]]] = [
    ("Entity ID", lambda row: row.beneficiary.entity_id),
    ("UUID", lambda row: str(row.beneficiary.entity.uuid)),
    ("Progress ID", _progress_id),
    ("Case ID", _case_id),
    ("FCN", _fcn),
]
CHILD_BIRTH_DATE = "Child Birth Date"
EDD = "Expected Date of Delivery (EDD)"

COLUMNS: dict[str, list[tuple[str, typing.Callable[[Row], typing.Any]]]] = {
    U5: [
        *IDENTIFIERS,
        ("Date of Birth", lambda row: row.beneficiary.birth_date),
        ("Age (months)", Row.age_in_months),
        ("Sex", lambda row: row.beneficiary.gender),
        ("Actual Visit Date", lambda row: row.visit_date),
        ("Data Synchronisation Date", lambda row: row.synced_at),
        ("Nutritional Status", lambda row: row.nutritional_status),
        ("Name of INF", Row.inf),
        ("Beneficiary Location/Camp", Row.camp),
    ],
    PBWG: [
        *IDENTIFIERS,
        ("Age (years)", Row.age_in_years),
        ("Actual Visit Date", lambda row: row.visit_date),
        ("Data Synchronisation Date", lambda row: row.synced_at),
        ("Nutritional Status", lambda row: row.nutritional_status),
        ("Name of INF", Row.inf),
        ("Beneficiary Location/Camp", Row.camp),
        (CHILD_BIRTH_DATE, Row.child_birth_date),
        (EDD, Row.expected_delivery_date),
    ],
}

PHYSIOLOGY_STATUS_LABELS = {"pregnant": "Pregnant", "breastfeeding": "Breastfeeding"}


def sheet_columns(kind: str, physiology_status: str) -> list[tuple[str, typing.Callable[[Row], typing.Any]]]:
    """The columns of a sheet: no child birth date for pregnant women, no EDD for breastfeeding ones."""
    hidden = {"pregnant": CHILD_BIRTH_DATE, "breastfeeding": EDD}.get(physiology_status) if kind == PBWG else None
    return [column for column in COLUMNS[kind] if column[0] != hidden]


def _kind(journey: Journey) -> str:
    return PBWG if journey.programme_type == "PLW" else U5


def nutritional_status(visit: Visit, kind: str, answers: typing.Optional[dict] = None) -> typing.Optional[str]:
    """ "Green" or "Normal" when the beneficiary was found normal at the visit, None otherwise.

    From the colour stored by the ETL, else the one of the submission of the visit (`answers`, for visits processed
    before the ETL read it), else the MUAC of the visit compared to the usual thresholds.
    """
    if visit.oedema:
        return None
    colour = visit.whz_color or extract_whz_color(answers or {})
    if colour:
        return "Green" if colour == "Green" else None
    muac = _safe_float(visit.muac_size)
    if muac is None:
        return None
    return "Normal" if muac >= NORMAL_MUAC[kind] else None


def eligible_beneficiaries(beneficiaries):
    """The beneficiaries of the queryset having at least one ongoing journey."""
    return beneficiaries.filter(id__in=Journey.objects.filter(exit_type__isnull=True).values("beneficiary_id"))


def iter_rows(
    beneficiaries,
    user,
    org_units=None,
    start_date: typing.Optional[datetime.date] = None,
    end_date: typing.Optional[datetime.date] = None,
    today: typing.Optional[datetime.date] = None,
) -> typing.Iterator[tuple[str, str, Row]]:
    """(programme, kind, row) of each eligible journey of the queryset of `Beneficiary`, by batches.

    With `org_units` (a queryset of `OrgUnit`), only the visits made in them are considered. The period (both dates
    included) defaults, for each missing date, to the current one (see `current_period`), ending today at the latest.
    """
    today = today or timezone.localdate()
    default_start, default_end = current_period(today)
    start, end = start_date or default_start, end_date or min(default_end, today)
    cut_off = timezone.make_aware(datetime.datetime.combine(end + datetime.timedelta(days=1), datetime.time.min))
    visits = Visit.objects.select_related("org_unit__parent").order_by("-date", "-id")
    if org_units is not None:
        visits = visits.filter(org_unit_id__in=org_units.values("id"))
    ids = list(eligible_beneficiaries(beneficiaries).order_by("id").values_list("id", flat=True))
    for batch_start in range(0, len(ids), BATCH_SIZE):
        batch = list(
            Beneficiary.objects.filter(id__in=ids[batch_start : batch_start + BATCH_SIZE])
            .select_related("entity__attributes__form")
            .prefetch_related(
                Prefetch(
                    "journey_set",
                    queryset=Journey.objects.filter(exit_type__isnull=True).order_by("start_date", "id"),
                ),
                Prefetch("journey_set__visit_set", queryset=visits.filter(date__lt=cut_off)),
            )
            .order_by("id")
        )
        candidates = []
        instance_ids = set()
        for beneficiary in batch:
            for journey in beneficiary.journey_set.all():
                kind = _kind(journey)
                journey_visits = [
                    visit for visit in journey.visit_set.all() if visit.date and _to_date(visit.date) >= start
                ]
                candidates.append((beneficiary, journey, kind, journey_visits))
                instance_ids.update(visit.instance_id for visit in journey.visit_set.all() if visit.instance_id)
        instances = Instance.objects.filter(id__in=instance_ids).select_related("form").in_bulk()

        for beneficiary, journey, kind, journey_visits in candidates:
            # the last visit (the visits are ordered from the most recent) synchronised by the cut-off
            visit, instance = next(
                (
                    (visit, instances.get(visit.instance_id))
                    for visit in journey_visits
                    if visit.instance_id in instances and instances[visit.instance_id].created_at < cut_off
                ),
                (None, None),
            )
            # the raw answers: the colour decides who is exported but isn't exported itself
            status = nutritional_status(visit, kind, instance.json or {}) if visit else None
            if not status:
                continue
            reference = beneficiary.entity.attributes
            reference_answers = filter_submission_json(reference.json or {}, reference.form, user) if reference else {}
            visit_answers = filter_submission_json(instance.json or {}, instance.form, user)
            journey_answers = [
                filter_submission_json(other.json or {}, other.form, user)
                for other in (instances.get(v.instance_id) for v in journey.visit_set.all() if v.id != visit.id)
                if other
            ]
            row = Row(
                beneficiary,
                journey,
                visit,
                instance.created_at,
                status,
                reference_answers,
                visit_answers,
                journey_answers,
            )
            yield journey.nutrition_programme or "Unknown programme", kind, row


def _cell(value):
    if isinstance(value, datetime.datetime):
        return timezone.localtime(value).replace(tzinfo=None) if timezone.is_aware(value) else value
    if isinstance(value, str):
        try:
            # dates answered by the forms, also as ISO datetimes ("2026-09-26T00:00:00.000+06:00")
            match = re.fullmatch(r"(\d{4}-\d{2}-\d{2})(T[\d:.]+([+-]\d{2}:\d{2}|Z)?)?", value)
            return datetime.date.fromisoformat(match.group(1)) if match else value
        except ValueError:
            return value
    if isinstance(value, (dict, list)):
        return str(value)
    return value


def _sheet_name(programme: str, kind: str, physiology_status: str, kinds_of_programme: set[str]) -> str:
    parts = [programme]
    if len(kinds_of_programme) > 1:
        parts.append(kind)
    if kind == PBWG:
        parts.append(PHYSIOLOGY_STATUS_LABELS.get(physiology_status, "Unknown status"))
    return re.sub(r"[\[\]:*?/\\]", "-", " ".join(parts))[:31]


def build_eligible_xlsx(
    beneficiaries,
    user,
    path: str,
    org_units=None,
    start_date: typing.Optional[datetime.date] = None,
    end_date: typing.Optional[datetime.date] = None,
    today: typing.Optional[datetime.date] = None,
) -> None:
    """Write the export as an Excel file at `path`: one sheet per programme (and physiology status for women)."""
    sheets: dict[tuple[str, str, str], list[list]] = {}
    for programme, kind, row in iter_rows(beneficiaries, user, org_units, start_date, end_date, today):
        physiology_status = (row.physiology_status() or "") if kind == PBWG else ""
        columns = sheet_columns(kind, physiology_status)
        sheets.setdefault((programme, kind, physiology_status), []).append([_cell(value(row)) for _, value in columns])

    workbook = xlsxwriter.Workbook(path)
    header_format = workbook.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1, "text_wrap": True})
    date_format = workbook.add_format({"num_format": "yyyy-mm-dd"})
    datetime_format = workbook.add_format({"num_format": "yyyy-mm-dd hh:mm"})

    if not sheets:
        workbook.add_worksheet("Eligible beneficiaries").write(0, 0, "No eligible beneficiaries")
    kinds_by_programme: dict[str, set[str]] = {}
    for programme, kind, _ in sheets:
        kinds_by_programme.setdefault(programme, set()).add(kind)
    for (programme, kind, physiology_status), rows in sorted(sheets.items()):
        sheet = workbook.add_worksheet(_sheet_name(programme, kind, physiology_status, kinds_by_programme[programme]))
        columns = sheet_columns(kind, physiology_status)
        sheet.set_column(0, len(columns) - 1, 20)
        sheet.freeze_panes(1, 0)
        for column, (title, _) in enumerate(columns):
            sheet.write(0, column, title, header_format)
        for row_index, row in enumerate(rows, start=1):
            for column, value in enumerate(row):
                if isinstance(value, datetime.datetime):
                    sheet.write_datetime(row_index, column, value, datetime_format)
                elif isinstance(value, datetime.date):
                    sheet.write_datetime(row_index, column, value, date_format)
                elif value is not None:
                    sheet.write(row_index, column, value)
        sheet.autofilter(0, 0, len(rows), len(columns) - 1)
    workbook.close()
