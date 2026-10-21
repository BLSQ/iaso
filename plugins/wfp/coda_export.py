"""Export of the ETL data in the "CODA 2.0 Full data fields" format requested by WFP.

One row per visit computed by the ETL (`Visit`), with the beneficiary, health center, cycle (= `Journey`),
anthropometric, assistance and medical details of that visit.

Most columns come from the ETL tables, so the exported figures match the dashboards. The columns that the ETL does
not compute (medical step, counselling, ...) are read from the answers of the submissions of the visit: the
anthropometric submission anchoring the visit and the submissions that follow it until the next one, which is how
the ETL groups submissions into visits (`ETL._group_into_visits`). Their question names differ between countries
and form versions, so they are matched loosely (case, underscores and spaces are ignored) against a list of
candidate names. Answers are filtered according to the PII configuration of their form, like everywhere else.
"""

import datetime
import re
import typing

from dataclasses import dataclass, field

import xlsxwriter

from django.db.models import Prefetch

from iaso.models import Instance, OrgUnit
from iaso.utils.pii import filter_submission_json

from .common import _extract_rations
from .models import Beneficiary, Journey, Visit


BATCH_SIZE = 500

NON_FOOD_ASSISTANCE = {"Mosquito Net", "Soap", "ORS", "Vitamin", "albendazole", "Measles vaccination", "ART"}


def _normalize(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(name).lower())


@dataclass
class VisitContext:
    """Everything known about a visit when building its row."""

    beneficiary: Beneficiary
    journey: Journey
    visit: Visit
    cycle_number: int
    previous_visit: typing.Optional[Visit]
    is_last_visit: bool
    answers: typing.List[dict]  # filtered answers of the visit's submissions, anchor first
    anchor: typing.Optional[Instance]
    assistance_instance: typing.Optional[Instance]
    org_units: typing.Dict[int, OrgUnit]
    reference_org_unit: typing.Optional[OrgUnit]
    _normalized: typing.Optional[typing.List[dict]] = field(default=None)

    def answer(self, *candidates: str):
        """First non-empty answer to one of the candidate questions, across the submissions of the visit."""
        if self._normalized is None:
            self._normalized = [{_normalize(k): v for k, v in answers.items()} for answers in self.answers]
        keys = [_normalize(c) for c in candidates]
        for answers in self._normalized:
            for key in keys:
                value = answers.get(key)
                if value not in (None, ""):
                    return value
        return None

    def ancestor(self, org_unit: typing.Optional[OrgUnit], level: int) -> typing.Optional[str]:
        """Name of the ancestor of `org_unit` at `level` of the pyramid (0 = root, i.e. the country)."""
        if org_unit is None or not org_unit.path:
            return None
        path = [int(i) for i in org_unit.path]
        if level >= len(path):
            return None
        ancestor = self.org_units.get(path[level])
        return ancestor.name if ancestor else None


def _date(value):
    if isinstance(value, datetime.datetime):
        return value.date()
    return value


def _age(ctx: VisitContext):
    birth_date, visit_date = ctx.beneficiary.birth_date, _date(ctx.visit.date)
    if not birth_date or not visit_date:
        return None
    months = (visit_date.year - birth_date.year) * 12 + visit_date.month - birth_date.month
    if visit_date.day < birth_date.day:
        months -= 1
    # children in months, women in years
    return months if ctx.journey.programme_type != "PLW" else months // 12


def _yes_no(value: typing.Optional[bool]):
    if value is None:
        return None
    return "yes" if value else "no"


def _rations(ctx: VisitContext):
    items = []
    for answers in ctx.answers:
        items.extend(_extract_rations(answers))
    return [item for item in items if item.get("type")]


def _food_steps(ctx: VisitContext):
    return [step for step in ctx.visit.step_set.all() if step.assistance_type not in NON_FOOD_ASSISTANCE]


def _has_step(ctx: VisitContext, assistance_type: str) -> bool:
    return any(step.assistance_type == assistance_type for step in ctx.visit.step_set.all())


def _answer(*candidates):
    return lambda ctx: ctx.answer(*candidates)


# (step, field, value) in the order of the "CODA 2.0 Full data fields" specification
COLUMNS: typing.List[typing.Tuple[str, str, typing.Callable[[VisitContext], typing.Any]]] = [
    ("Beneficiary details", "beneficiary unique Identification", lambda ctx: str(ctx.beneficiary.entity.uuid)),
    ("Beneficiary details", "birth date", lambda ctx: ctx.beneficiary.birth_date),
    ("Beneficiary details", "gender", lambda ctx: ctx.beneficiary.gender),
    ("Beneficiary details", "registration date", lambda ctx: ctx.journey.start_date),
    ("Beneficiary details", "age (months for children, years for women)", _age),
    ("Beneficiary details", "State", lambda ctx: ctx.ancestor(ctx.reference_org_unit, 1)),
    ("Beneficiary details", "county", lambda ctx: ctx.ancestor(ctx.reference_org_unit, 2)),
    ("Beneficiary details", "Payam", lambda ctx: ctx.ancestor(ctx.reference_org_unit, 3)),
    ("Beneficiary details", "Boma", lambda ctx: ctx.ancestor(ctx.reference_org_unit, 4)),
    ("Beneficiary details", "Is twin?", lambda ctx: ctx.answer("is_twin", "twin", "twins")),
    (
        "Beneficiary details",
        "familyStatus",
        lambda ctx: ctx.answer("family_status", "residence_status", "displacement_status", "status"),
    ),
    (
        "Health Center details",
        "health center name",
        lambda ctx: ctx.visit.org_unit.name if ctx.visit.org_unit else None,
    ),
    (
        "Health Center details",
        "CP name",
        lambda ctx: ctx.answer("cp_name", "partner", "partner_name", "cooperating_partner"),
    ),
    ("Health Center details", "state", lambda ctx: ctx.ancestor(ctx.visit.org_unit, 1)),
    ("Health Center details", "County", lambda ctx: ctx.ancestor(ctx.visit.org_unit, 2)),
    ("Health Center details", "Payam", lambda ctx: ctx.ancestor(ctx.visit.org_unit, 3)),
    ("Cycle details", "date and time", lambda ctx: ctx.visit.date),
    ("Cycle details", "Cycle number", lambda ctx: ctx.cycle_number),
    ("Cycle details", "visit number", lambda ctx: ctx.visit.number),
    ("Cycle details", "programme", lambda ctx: ctx.journey.nutrition_programme),
    ("Cycle details", "treatment protocol", lambda ctx: ctx.beneficiary.guidelines),
    ("Cycle details", "Is  registration visit", lambda ctx: _yes_no(ctx.previous_visit is None)),
    ("Cycle details", "Is_folow_up_visit", lambda ctx: _yes_no(ctx.previous_visit is not None)),
    ("Cycle details", "Is_discharge_visit", lambda ctx: _yes_no(ctx.is_last_visit and bool(ctx.journey.exit_type))),
    (
        "Cycle details",
        "days elapsed since beginning of Cycle",
        lambda ctx: (_date(ctx.visit.date) - ctx.journey.start_date).days
        if ctx.visit.date and ctx.journey.start_date
        else None,
    ),
    (
        "Cycle details",
        "is continuing in the same facility?",
        lambda ctx: _yes_no(ctx.previous_visit.org_unit_id == ctx.visit.org_unit_id) if ctx.previous_visit else None,
    ),
    (
        "Cycle details",
        "change Facility Reason",
        lambda ctx: ctx.answer("change_facility_reason", "reason_change_facility", "transfer_reason"),
    ),
    ("Anthropometric step", "time_date", lambda ctx: ctx.anchor.source_created_at if ctx.anchor else None),
    ("Anthropometric step", "admissionCriteria", lambda ctx: ctx.journey.admission_criteria),
    ("Anthropometric step", "MUAC", lambda ctx: ctx.visit.muac_size),
    ("Anthropometric step", "oedema", lambda ctx: ctx.visit.oedema),
    ("Anthropometric step", "weight", lambda ctx: ctx.answer("weight_kgs", "weight", "mother_weight")),
    ("Anthropometric step", "height", lambda ctx: ctx.answer("height", "height_cm", "length", "length_cm")),
    ("Anthropometric step", "WHZ", lambda ctx: ctx.visit.whz_color or ctx.answer("whz_score", "whz")),
    ("Anthropometric step", "HAZ", lambda ctx: ctx.answer("haz", "haz_score")),
    ("Anthropometric step", "WAZ", lambda ctx: ctx.answer("waz", "waz_score")),
    (
        "Anthropometric step",
        "discharge Criteria",
        lambda ctx: ctx.journey.exit_type if ctx.is_last_visit else None,
    ),
    (
        "Anthropometric step for Women",
        "is Pregnant?",
        lambda ctx: _yes_no(ctx.journey.physiology_status == "pregnant")
        if ctx.journey.programme_type == "PLW"
        else None,
    ),
    (
        "Anthropometric step for Women",
        "pregnancy Age?",
        lambda ctx: ctx.answer("pregnancy_age", "gestational_age", "months_pregnant", "pregnancy_months"),
    ),
    (
        "Anthropometric step for Women",
        "is Child Wasted?",
        lambda ctx: ctx.answer("is_child_wasted", "child_wasted")
        or (_yes_no(True) if ctx.journey.admission_criteria == "child_wasted" else None),
    ),
    ("Anthropometric step", "parents Alive?", lambda ctx: ctx.answer("parents_alive", "are_parents_alive")),
    (
        "Assistance step",
        "date_time",
        lambda ctx: ctx.assistance_instance.source_created_at if ctx.assistance_instance else None,
    ),
    ("Assistance step", "Assistance givien", lambda ctx: _yes_no(bool(ctx.visit.step_set.all()))),
    (
        "Assistance step",
        "quantity",
        lambda ctx: sum(step.quantity_given or 0 for step in _food_steps(ctx)) if _food_steps(ctx) else None,
    ),
    (
        "Assistance step",
        "rationType",
        lambda ctx: ", ".join(sorted({str(item["type"]) for item in _rations(ctx)})) or None,
    ),
    ("Assistance step", "soap", lambda ctx: _yes_no(_has_step(ctx, "Soap"))),
    ("Assistance step", "net", lambda ctx: _yes_no(_has_step(ctx, "Mosquito Net"))),
    ("Assistance step", "counsel Optimal", _answer("counsel_optimal", "counselling_optimal")),
    ("Assistance step", "counsel IYCF", _answer("counsel_iycf", "counselling_iycf")),
    ("Assistance step", "counsel WASH", _answer("counsel_wash", "counselling_wash")),
    ("Assistance step", "counsel Therapeutic food", _answer("counsel_therapeutic_food", "counsel_therapeutic")),
    ("Assistance step", "counse lARV", _answer("counsel_arv", "counselling_arv")),
    ("Assistance step", "education Session", _answer("education_session", "health_education")),
    ("Assistance step", "counselling lYCF", _answer("counselling_iycf", "iycf_counselling")),
    ("Assistance step", "counsel Other", _answer("counsel_other", "counselling_other")),
    ("Medical step", "fever", _answer("fever")),
    ("Medical step", "malaria", _answer("malaria", "malaria_test", "malaria_result")),
    ("Medical step", "opt Out?", _answer("opt_out", "optout")),
    ("Medical step", "is Breastfeeding?", _answer("is_breastfeeding", "breastfeeding")),
    ("Medical step", "is Treatment for malaria?", _answer("is_treatment_for_malaria", "malaria_treatment")),
    ("Medical step", "vomit?", _answer("vomit", "vomiting")),
    ("Medical step", "passing Urine?", _answer("passing_urine")),
    ("Medical step", "Is there contact with TB?", _answer("contact_with_tb", "tb_contact", "is_contact_tb")),
    ("Medical step", "immunization status", _answer("immunization_status", "immunisation_status")),
    ("Medical step", "is Chest Indrawing", _answer("is_chest_indrawing", "chest_indrawing")),
    ("Medical step", "temperature", _answer("temperature", "temp")),
    ("Medical step", "palmor Pallor", _answer("palmar_pallor", "palmor_pallor", "pallor")),
    ("Medical step", "eyes Sunken", _answer("eyes_sunken", "sunken_eyes")),
    ("Medical step", "eyes Infection", _answer("eyes_infection", "eye_infection")),
    ("Medical step", "vad", _answer("vad", "vitamin_a_deficiency")),
    ("Medical step", "ears Discharge", _answer("ears_discharge", "ear_discharge")),
    ("Medical step", "mouth", _answer("mouth", "mouth_ulcers")),
    ("Medical step", "lymph", _answer("lymph", "lymph_nodes")),
    ("Medical step", "skin", _answer("skin", "skin_condition")),
    ("Medical step", "hiv", _answer("hiv", "hiv_status")),
    ("Medical step", "dermatosis Level", _answer("dermatosis_level", "dermatosis")),
    ("Medical step", "is Disabled", _answer("is_disabled", "disabled", "disability")),
    ("Medical step", "respiratory Rate", _answer("respiratory_rate", "breaths_per_minute")),
    ("Medical step", "dehydration", _answer("dehydration")),
    ("Medical step", "medications", _answer("medications", "medication", "medicine_given")),
    ("Medical step", "complications1", _answer("complications1", "complications")),
    ("Medical step", "appetite", _answer("appetite", "appetite_test")),
    ("Medical step", "sick", _answer("sick", "is_sick")),
    ("Medical step", "first Visit Medical", _answer("first_visit_medical")),
    ("Medical step", "cough", _answer("cough")),
    ("Medical step", "deworming", _answer("deworming", "anti_helminth_given", "ab_given")),
    ("Medical step", "diarrhoea", _answer("diarrhoea", "diarrhea")),
    ("Medical step", "fever Time", _answer("fever_time", "fever_duration")),
    ("Medical step", "lesions", _answer("lesions", "skin_lesions")),
    ("Medical step", "malaria No Test Reason", _answer("malaria_no_test_reason")),
    ("Medical step", "malaria No Treat Reason", _answer("malaria_no_treat_reason")),
    ("Medical step", "malaria Treated Type", _answer("malaria_treated_type", "malaria_treatment_type")),
    ("Medical step", "medication Types", _answer("medication_types", "medication_type")),
]


def _visit_groups(instances: typing.List[Instance], anchor_ids: typing.Set[int]) -> typing.Dict[int, list]:
    """Group the submissions of an entity by visit, like the ETL: an anchor and the submissions until the next one."""
    groups: typing.Dict[int, list] = {}
    current = None
    for instance in instances:
        if instance.id in anchor_ids:
            current = groups.setdefault(instance.id, [])
        if current is not None:
            current.append(instance)
    return groups


def iter_rows(beneficiaries, user) -> typing.Iterator[list]:
    """Rows of the export, for a queryset of `Beneficiary` (processed by batches to keep memory low)."""
    ids = list(beneficiaries.order_by("id").values_list("id", flat=True))
    for start in range(0, len(ids), BATCH_SIZE):
        batch = list(
            Beneficiary.objects.filter(id__in=ids[start : start + BATCH_SIZE])
            .select_related("entity__attributes__org_unit", "entity__attributes__form")
            .prefetch_related(
                Prefetch("journey_set", queryset=Journey.objects.order_by("start_date", "id")),
                Prefetch(
                    "journey_set__visit_set",
                    queryset=Visit.objects.select_related("org_unit")
                    .prefetch_related("step_set")
                    .order_by("date", "id"),
                ),
            )
            .order_by("id")
        )
        instances_by_entity: typing.Dict[int, list] = {}
        for instance in (
            Instance.objects.filter(entity_id__in=[b.entity_id for b in batch], deleted=False)
            .select_related("form")
            .order_by("entity_id", "source_created_at", "created_at")
        ):
            instances_by_entity.setdefault(instance.entity_id, []).append(instance)

        org_unit_ids = set()
        for beneficiary in batch:
            reference = beneficiary.entity.attributes
            if reference and reference.org_unit and reference.org_unit.path:
                org_unit_ids.update(int(i) for i in reference.org_unit.path)
            for journey in beneficiary.journey_set.all():
                for visit in journey.visit_set.all():
                    if visit.org_unit and visit.org_unit.path:
                        org_unit_ids.update(int(i) for i in visit.org_unit.path)
        org_units = OrgUnit.objects.filter(id__in=org_unit_ids).only("id", "name").in_bulk()

        for beneficiary in batch:
            instances = instances_by_entity.get(beneficiary.entity_id, [])
            journeys = list(beneficiary.journey_set.all())
            anchor_ids = {visit.instance_id for journey in journeys for visit in journey.visit_set.all()}
            groups = _visit_groups(instances, anchor_ids)
            reference = beneficiary.entity.attributes
            for cycle_number, journey in enumerate(journeys, start=1):
                visits = list(journey.visit_set.all())
                for index, visit in enumerate(visits):
                    group = groups.get(visit.instance_id, [])
                    assistance = next(
                        (i for i in group if any(step.instance_id == i.id for step in visit.step_set.all())), None
                    )
                    ctx = VisitContext(
                        beneficiary=beneficiary,
                        journey=journey,
                        visit=visit,
                        cycle_number=cycle_number,
                        previous_visit=visits[index - 1] if index > 0 else None,
                        is_last_visit=index == len(visits) - 1,
                        # the reference form last: beneficiary level questions (twin, family status...) are there
                        answers=[filter_submission_json(i.json or {}, i.form, user) for i in group]
                        + ([filter_submission_json(reference.json or {}, reference.form, user)] if reference else []),
                        anchor=group[0] if group else None,
                        assistance_instance=assistance,
                        org_units=org_units,
                        reference_org_unit=reference.org_unit if reference else None,
                    )
                    yield [value(ctx) for _, _, value in COLUMNS]


def _cell(value):
    if isinstance(value, datetime.datetime):
        return value.replace(tzinfo=None)
    if isinstance(value, (dict, list)):
        return str(value)
    return value


def build_xlsx(beneficiaries, user, path: str) -> None:
    """Write the export as an Excel file at `path`: a first header row with the steps, a second with the fields.

    Rows are streamed to disk (constant memory mode), so large accounts don't need to fit in memory.
    """
    workbook = xlsxwriter.Workbook(path, {"constant_memory": True})
    sheet = workbook.add_worksheet("CODA 2.0 Full data fields")
    step_format = workbook.add_format({"bold": True, "bg_color": "#D9E1F2", "border": 1})
    field_format = workbook.add_format({"bold": True, "bg_color": "#F2F2F2", "border": 1, "text_wrap": True})
    date_format = workbook.add_format({"num_format": "yyyy-mm-dd"})
    datetime_format = workbook.add_format({"num_format": "yyyy-mm-dd hh:mm"})

    # in constant memory mode, rows must be written in order
    sheet.set_column(0, len(COLUMNS) - 1, 18)
    sheet.freeze_panes(2, 1)
    for column, (step, _, _) in enumerate(COLUMNS):
        sheet.write(0, column, step, step_format)
    for column, (_, field_name, _) in enumerate(COLUMNS):
        sheet.write(1, column, field_name, field_format)

    for row_index, row in enumerate(iter_rows(beneficiaries, user), start=2):
        for column, value in enumerate(row):
            value = _cell(value)
            if isinstance(value, datetime.datetime):
                sheet.write_datetime(row_index, column, value, datetime_format)
            elif isinstance(value, datetime.date):
                sheet.write_datetime(row_index, column, value, date_format)
            elif value is not None:
                sheet.write(row_index, column, value)

    workbook.close()
