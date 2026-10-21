"""Raw data export: the ETL tables and the submissions they were computed from, in one Excel workbook.

Sheets:
- README: how to join the sheets.
- beneficiaries, journeys, visits, steps: the ETL tables (`plugins/wfp/models.py`) for the selected beneficiaries.
- one sheet per IASO form: the submissions of the entities of these beneficiaries, one column per question.

The identifiers tie everything together: `entity_id` / `beneficiary_id` on every row, `instance_id` on the ETL rows
pointing to the submission they come from. Answers are filtered according to the PII configuration of their form.
"""

import datetime
import json
import re
import typing

import xlsxwriter

from django.db import connection

from iaso.models import Form, Instance
from iaso.utils.pii import filter_submission_json, get_allowed_fields, is_field_allowed

from .models import Journey, Step, Visit


README = [
    ("Sheet", "Content", "Identifiers"),
    (
        "beneficiaries",
        "One row per beneficiary computed by the ETL (anonymised).",
        "beneficiary_id (ETL id), entity_id and entity_uuid (IASO entity)",
    ),
    (
        "journeys",
        "One row per programme enrolment (admission to exit).",
        "journey_id, beneficiary_id -> beneficiaries, instance_id -> the admission submission in its form sheet",
    ),
    (
        "visits",
        "One row per visit, anchored on an anthropometric submission.",
        "visit_id, journey_id -> journeys, beneficiary_id, instance_id -> the anthropometric submission",
    ),
    (
        "steps",
        "One row per assistance item given during a visit.",
        "step_id, visit_id -> visits, beneficiary_id, instance_id -> the submission it was read from",
    ),
    (
        "one sheet per form",
        "The submissions of the entities of these beneficiaries, one column per question. Sheet named after the "
        "form id (see the 'forms' sheet for the full names).",
        "instance_id (submission id, matches instance_id of the ETL sheets), entity_id, entity_uuid, beneficiary_id",
    ),
    (
        "forms",
        "The forms exported, with the name of their sheet.",
        "form_id (IASO form id), sheet",
    ),
    ("", "", ""),
    (
        "Notes",
        "The ETL ids (beneficiary_id, journey_id, visit_id, step_id) change each time the ETL recomputes a "
        "beneficiary: use them to join the sheets of one export, and entity_uuid / instance uuid across exports.",
        "Questions containing personal data are left out unless you have the permission to see them.",
    ),
]

BENEFICIARY_COLUMNS = [
    "beneficiary_id",
    "entity_id",
    "entity_uuid",
    "entity_type",
    "birth_date",
    "gender",
    "guidelines",
]
JOURNEY_COLUMNS = [
    "journey_id",
    "beneficiary_id",
    "entity_id",
    "instance_id",
    "nutrition_programme",
    "programme_type",
    "physiology_status",
    "admission_type",
    "admission_criteria",
    "muac_size",
    "whz_score",
    "start_date",
    "end_date",
    "duration",
    "exit_type",
    "initial_weight",
    "discharge_weight",
    "weight_gain",
    "weight_loss",
]
VISIT_COLUMNS = [
    "visit_id",
    "journey_id",
    "beneficiary_id",
    "entity_id",
    "instance_id",
    "number",
    "date",
    "org_unit_id",
    "org_unit_name",
    "muac_size",
    "whz_color",
    "oedema",
    "entry_point",
]
STEP_COLUMNS = [
    "step_id",
    "visit_id",
    "beneficiary_id",
    "entity_id",
    "instance_id",
    "assistance_type",
    "quantity_given",
    "ration_size",
]
SUBMISSION_COLUMNS = [
    "instance_id",
    "instance_uuid",
    "entity_id",
    "entity_uuid",
    "beneficiary_id",
    "form_id",
    "form_version",
    "org_unit_id",
    "org_unit_name",
    "period",
    "device_created_at",
    "server_created_at",
    "server_updated_at",
    "created_by",
]


class _Writer:
    """Writes rows in order on a worksheet, formatting dates (xlsxwriter's constant memory mode needs this order)."""

    def __init__(self, workbook, name, headers, formats):
        self.sheet = workbook.add_worksheet(name)
        self.formats = formats
        self.row = 0
        self.sheet.freeze_panes(1, 0)
        self.sheet.set_column(0, max(len(headers) - 1, 0), 16)
        for column, header in enumerate(headers):
            self.sheet.write(0, column, header, formats["header"])
        self.row = 1

    def write(self, values):
        for column, value in enumerate(values):
            if value is None or value == "":
                continue
            if isinstance(value, datetime.datetime):
                self.sheet.write_datetime(self.row, column, value.replace(tzinfo=None), self.formats["datetime"])
            elif isinstance(value, datetime.date):
                self.sheet.write_datetime(self.row, column, value, self.formats["date"])
            elif isinstance(value, (dict, list)):
                self.sheet.write_string(self.row, column, json.dumps(value, ensure_ascii=False))
            elif isinstance(value, bool):
                self.sheet.write_boolean(self.row, column, value)
            elif isinstance(value, (int, float)):
                self.sheet.write_number(self.row, column, value)
            else:
                self.sheet.write_string(self.row, column, str(value))
        self.row += 1


def _sheet_name(form: Form, used: typing.Set[str]) -> str:
    """Excel sheet names: at most 31 characters, unique, without []:*?/\\."""
    base = re.sub(r"[\[\]:*?/\\]", "_", form.form_id or form.name or f"form_{form.id}")[:24]
    name = base
    if name.lower() in used or name.lower() in {"readme", "forms", "beneficiaries", "journeys", "visits", "steps"}:
        name = f"{base}_{form.id}"[:31]
    used.add(name.lower())
    return name


def _question_columns(form: Form, instance_ids_sql, params, allowed) -> typing.List[str]:
    """The questions answered in the submissions, in the order of the form, then the other answers found."""
    with connection.cursor() as cursor:
        cursor.execute(
            f"SELECT DISTINCT jsonb_object_keys(json::jsonb) FROM iaso_instance "
            f"WHERE form_id = %s AND jsonb_typeof(json::jsonb) = 'object' AND id IN ({instance_ids_sql})",
            [form.id, *params],
        )
        found = {row[0] for row in cursor.fetchall()}
    ordered = [f["name"] for f in form.possible_fields or [] if f.get("name") in found]
    ordered += sorted(found - set(ordered))
    return [name for name in ordered if name != "_version" and is_field_allowed(name, allowed)]


def build_raw_xlsx(beneficiaries, user, path: str) -> None:
    """Write the raw data export of a `Beneficiary` queryset at `path`."""
    workbook = xlsxwriter.Workbook(path, {"constant_memory": True, "strings_to_urls": False})
    formats = {
        "header": workbook.add_format({"bold": True, "bg_color": "#006699", "font_color": "#FFFFFF", "border": 1}),
        "date": workbook.add_format({"num_format": "yyyy-mm-dd"}),
        "datetime": workbook.add_format({"num_format": "yyyy-mm-dd hh:mm:ss"}),
    }

    readme = workbook.add_worksheet("README")
    readme.set_column(0, 0, 20)
    readme.set_column(1, 2, 90)
    wrap = workbook.add_format({"text_wrap": True, "valign": "top"})
    for row, values in enumerate(README):
        for column, value in enumerate(values):
            readme.write(row, column, value, formats["header"] if row == 0 else wrap)

    beneficiaries = beneficiaries.order_by("id")
    beneficiary_ids = beneficiaries.values("id")

    writer = _Writer(workbook, "beneficiaries", BENEFICIARY_COLUMNS, formats)
    for b in beneficiaries.select_related("entity__entity_type").iterator(chunk_size=2000):
        writer.write(
            [
                b.id,
                b.entity_id,
                str(b.entity.uuid) if b.entity else None,
                b.entity.entity_type.name if b.entity else None,
                b.birth_date,
                b.gender,
                b.guidelines,
            ]
        )

    writer = _Writer(workbook, "journeys", JOURNEY_COLUMNS, formats)
    for j in (
        Journey.objects.filter(beneficiary_id__in=beneficiary_ids)
        .select_related("beneficiary")
        .order_by("beneficiary_id", "start_date", "id")
        .iterator(chunk_size=2000)
    ):
        writer.write(
            [
                j.id,
                j.beneficiary_id,
                j.beneficiary.entity_id,
                j.instance_id,
                j.nutrition_programme,
                j.programme_type,
                j.physiology_status,
                j.admission_type,
                j.admission_criteria,
                j.muac_size,
                j.whz_score,
                j.start_date,
                j.end_date,
                j.duration,
                j.exit_type,
                j.initial_weight,
                j.discharge_weight,
                j.weight_gain,
                j.weight_loss,
            ]
        )

    writer = _Writer(workbook, "visits", VISIT_COLUMNS, formats)
    for v in (
        Visit.objects.filter(journey__beneficiary_id__in=beneficiary_ids)
        .select_related("journey__beneficiary", "org_unit")
        .order_by("journey__beneficiary_id", "date", "id")
        .iterator(chunk_size=2000)
    ):
        writer.write(
            [
                v.id,
                v.journey_id,
                v.journey.beneficiary_id,
                v.journey.beneficiary.entity_id,
                v.instance_id,
                v.number,
                v.date,
                v.org_unit_id,
                v.org_unit.name if v.org_unit else None,
                v.muac_size,
                v.whz_color,
                v.oedema,
                v.entry_point,
            ]
        )

    writer = _Writer(workbook, "steps", STEP_COLUMNS, formats)
    for s in (
        Step.objects.filter(visit__journey__beneficiary_id__in=beneficiary_ids)
        .select_related("visit__journey__beneficiary")
        .order_by("visit__journey__beneficiary_id", "visit_id", "id")
        .iterator(chunk_size=2000)
    ):
        writer.write(
            [
                s.id,
                s.visit_id,
                s.visit.journey.beneficiary_id,
                s.visit.journey.beneficiary.entity_id,
                s.instance_id,
                s.assistance_type,
                s.quantity_given,
                s.ration_size,
            ]
        )

    # Submissions of the entities of these beneficiaries, one sheet per form
    beneficiary_by_entity = dict(beneficiaries.values_list("entity_id", "id"))
    instances = Instance.objects.filter(
        entity_id__in=beneficiaries.values("entity_id"), deleted=False, form__isnull=False
    )
    instance_ids_sql, params = instances.values("id").query.sql_with_params()
    forms = Form.objects_include_deleted.filter(id__in=instances.values("form_id")).order_by("name", "id")

    used_names: typing.Set[str] = set()
    form_sheets = []
    for form in forms:
        allowed = get_allowed_fields(form, user)
        questions = _question_columns(form, instance_ids_sql, params, allowed)
        sheet_name = _sheet_name(form, used_names)
        form_sheets.append((form, sheet_name, len(questions)))
        writer = _Writer(workbook, sheet_name, SUBMISSION_COLUMNS + questions, formats)
        for instance in (
            instances.filter(form=form)
            .select_related("entity", "org_unit", "created_by")
            .order_by("entity_id", "source_created_at", "created_at", "id")
            .iterator(chunk_size=1000)
        ):
            answers = filter_submission_json(instance.json or {}, form, user) or {}
            writer.write(
                [
                    instance.id,
                    instance.uuid,
                    instance.entity_id,
                    str(instance.entity.uuid) if instance.entity else None,
                    beneficiary_by_entity.get(instance.entity_id),
                    form.form_id,
                    (instance.json or {}).get("_version"),
                    instance.org_unit_id,
                    instance.org_unit.name if instance.org_unit else None,
                    instance.period,
                    instance.source_created_at,
                    instance.created_at,
                    instance.updated_at,
                    instance.created_by.username if instance.created_by else None,
                ]
                + [answers.get(question) for question in questions]
            )

    writer = _Writer(workbook, "forms", ["form_id", "iaso_form_id", "name", "sheet", "questions"], formats)
    for form, sheet_name, question_count in form_sheets:
        writer.write([form.form_id, form.id, form.name, sheet_name, question_count])

    workbook.close()
