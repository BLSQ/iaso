import csv
import datetime
import io
import json
import re

from pathlib import Path
from unittest import mock
from uuid import UUID, uuid4

import openpyxl
import pytz

from django.contrib.gis.geos import Point
from django.utils import timezone
from jinja2 import Template

from iaso import models as m
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION
from iaso.tests.utils_parquet import BaseAPITransactionTestCase


CONTROL_CHARS_RE = re.compile("[\x01-\x08\x0b\x0c\x0e-\x1f]")
ESCAPED_CONTROL_CHARS_RE = re.compile(
    "_x00[01][0-9A-F]_"
)  # closes a $$ ... $$ quoted string: the query params must not be able to end the sql given to duckdb
DOLLAR_QUOTED = "#hash $$) ; SELECT 42; --"
VALIDATION_STATUSES = [
    ValidationWorkflowArtefactStatus.APPROVED,
    ValidationWorkflowArtefactStatus.REJECTED,
    ValidationWorkflowArtefactStatus.PENDING,
    "",
]
TRICKY_ANSWERS = [
    {"text": 'a, "quoted" <b>&amp;</b>', "other": "multi\nline\r\nend", "number": 1, "the_last_column": "short"},
    {
        "text": "  leading and trailing  ",
        "other": "Élève ñ 日本",
        "number": 2,
        "status": "done",
        "the_last_column": "short",
    },
    {"text": "ctrl\x01\x0bchar", "other": DOLLAR_QUOTED, "number": 3, "the_last_column": "short"},
    {"text": True, "other": False, "number": 12, "the_last_column": "short"},
    {"text": ["a", "b"], "other": None, "number": 12.5, "the_last_column": "short"},
    # the legacy xlsx export drops the cells following a string longer than excel's limit (xlsxwriter's write_row
    # stops on the truncation "error"): keep it in the last column (jsonb orders the keys by length)
    {"text": "007", "other": "x", "number": -3, "the_last_column": "x" * 40000},
]
FORM_DESCRIPTOR = {
    "name": "data",
    "type": "survey",
    "title": "Tricky",
    "version": "2020020101",
    "children": [
        {
            "name": "group",
            "type": "group",
            "children": [
                {"name": "text", "type": "text", "label": 'Text <with> "xml" & chars'},
                {"name": "other", "type": "text", "label": "Other"},
            ],
        },
        {"name": "number", "type": "integer", "label": "Number"},
        # never answered: empty column, multilingual label
        # same name as the "Status" column (duckdb's column names are case insensitive)
        {"name": "status", "type": "text", "label": "Question status"},
        {"name": "not_answered", "type": "text", "label": {"English": "Not answered", "French": "Pas de réponse"}},
        {"name": "the_last_column", "type": "text"},
    ],
}


def csv_rows(content):
    return list(csv.reader(io.StringIO(content.decode("utf-8"))))


def load_xlsx(content):
    sheet = openpyxl.load_workbook(io.BytesIO(content)).worksheets[0]
    rows = [list(row) for row in sheet.iter_rows(values_only=True)]
    # the same widths can be grouped differently (<col min="1" max="4" ...>)
    widths = {
        column: dimension.width
        for dimension in sheet.column_dimensions.values()
        for column in range(dimension.min, dimension.max + 1)
    }
    return rows, sheet.freeze_panes, [cell.font.b for cell in sheet[1]], widths


# duckdb needs to see the committed fixtures, hence the transaction test case (like the parquet export tests)
class InstancesDuckdbExportTestCase(BaseAPITransactionTestCase):
    """The duckdb csv/xlsx export (default) must give the same content as the legacy one (engine=legacy)"""

    def setUp(self):
        self.account = m.Account.objects.create(name="Star Wars")
        source = m.DataSource.objects.create(name="Galactic Empire")
        version = m.SourceVersion.objects.create(data_source=source, number=1)
        self.account.default_version = version
        self.account.save()
        self.project = m.Project.objects.create(name="Project", app_id="project", account=self.account)
        self.user = self.create_user_with_profile(
            username="yoda",
            first_name="Yo",
            last_name="Da",
            account=self.account,
            permissions=[CORE_SUBMISSIONS_PERMISSION],
        )
        guest = self.create_user_with_profile(username="guest", account=self.account)

        org_unit_type = m.OrgUnitType.objects.create(name="Council", short_name="Cnc")
        parent = None
        for level in range(5):
            parent = m.OrgUnit.objects.create(
                name=f"level {level}",
                parent=parent,
                version=version,
                org_unit_type=org_unit_type,
                source_ref=f"ref_{level}",
                code=f"code_{level}",
                validation_status="VALID",
            )
        org_units = [parent, parent.parent, m.OrgUnit.objects.create(name="top", version=version)]

        self.form = m.Form.objects.create(name="Tricky", period_type=m.MONTH, correlatable=True)
        self.form.projects.add(self.project)
        org_unit_type.reference_forms.add(self.form)
        # the answers columns (and their labels) come from the latest version, like for any real form
        m.FormVersion.objects.create(form=self.form, version_id="2020020101", form_descriptor=FORM_DESCRIPTOR)
        self.create_validation_workflow(account=self.account, forms=[self.form], name="Tricky validation")
        entity_type = m.EntityType.objects.create(name="Beneficiary", account=self.account)

        date = datetime.datetime(2020, 2, 1, 10, 11, 12, 123456, tzinfo=pytz.UTC)
        for index, answers in enumerate(TRICKY_ANSWERS * 2):
            instance = self.create_form_instance(
                form=self.form,
                period="202001" if index % 2 else None,
                org_unit=org_units[index % len(org_units)],
                project=self.project,
                created_by=[self.user, guest, None][index % 3],
                export_id=f"export_{index}" if index % 2 else None,
                source_created_at=date + datetime.timedelta(days=index) if index % 3 else None,
                accuracy=21.5 if index % 2 else None,
                location=Point(1.51, 7.31, index) if index % 2 else None,
                correlation_id=1000 + index,
                entity=m.Entity.objects.create(
                    name=f"entity {index}", entity_type=entity_type, account=self.account, uuid=uuid4()
                )
                if index % 2
                else None,
                json={"_version": "2020020101", **answers},
                general_validation_status=VALIDATION_STATUSES[index % len(VALIDATION_STATUSES)],
            )
            if index == 1:
                instance.flag_reference_instance(instance.org_unit)
        m.Entity.objects_include_deleted.filter(name="entity 3").update(deleted_at=timezone.now())

    def get(self, file_format, engine, params=None):
        self.client.force_authenticate(self.user)
        query = {"form_ids": self.form.id, file_format: "true", "order": "id", **(params or {})}
        if engine == "legacy":
            query["engine"] = "legacy"
        response = self.client.get("/api/instances/", query)
        self.assertEqual(response.status_code, 200)
        content = b"".join(
            chunk.encode() if isinstance(chunk, str) else chunk
            for chunk in (response.streaming_content if response.streaming else response)
        )
        response.close()
        if engine != "legacy":
            # used by the UI for the download progress
            self.assertEqual(int(response["X-File-Size"]), len(content))
        return content

    def test_csv_same_content(self):
        legacy_rows = csv_rows(self.get("csv", "legacy"))
        duckdb_rows = csv_rows(self.get("csv", "duckdb"))

        self.assertEqual(len(duckdb_rows), 1 + 2 * len(TRICKY_ANSWERS))
        self.assertEqual(duckdb_rows[0][-3:], ["status", "not_answered", "the_last_column"])
        self.assertIn("Status", duckdb_rows[0])
        # same content, the quoting may differ
        self.assertEqual(duckdb_rows, legacy_rows)

    def test_xlsx_same_content(self):
        def text(value):
            """cell content as text: the duckdb export writes the numeric answers as numbers"""
            if isinstance(value, str):
                # control characters are escaped (_x0001_) by the legacy export, removed by the duckdb one (not
                # allowed in xml), carriage returns are escaped (_x000D_) by the legacy export, and normalized to
                # line feeds when reading the duckdb one
                value = CONTROL_CHARS_RE.sub("", ESCAPED_CONTROL_CHARS_RE.sub("", value)).replace("\r", "")
            if value is None or value == "":
                return None
            if isinstance(value, bool):
                return str(value)
            if isinstance(value, (int, float)):
                return float(value)
            try:
                return float(value) if re.fullmatch(r"-?(0|[1-9][0-9]*)(\.[0-9]+)?", value) else value
            except ValueError:
                return value

        legacy_rows, legacy_panes, legacy_bold, legacy_widths = load_xlsx(self.get("xlsx", "legacy"))
        duckdb_rows, duckdb_panes, duckdb_bold, duckdb_widths = load_xlsx(self.get("xlsx", "duckdb"))

        # header rows: the titles, then the question labels
        header = duckdb_rows[0]
        self.assertEqual(header, legacy_rows[0])
        self.assertEqual(header[-6:], ["text", "other", "number", "status", "not_answered", "the_last_column"])
        self.assertIn("Status", header)
        self.assertEqual(duckdb_rows[1][header.index("text")], 'Text <with> "xml" & chars')
        self.assertEqual([text(v) for v in duckdb_rows[1]], [text(v) for v in legacy_rows[1]])
        self.assertEqual(duckdb_panes, legacy_panes)
        self.assertTrue(all(duckdb_bold))
        self.assertEqual(duckdb_widths, legacy_widths)

        legacy_rows = legacy_rows[2:]
        duckdb_rows = duckdb_rows[2:]
        self.assertEqual(len(duckdb_rows), 2 * len(TRICKY_ANSWERS))

        for legacy_row, duckdb_row in zip(legacy_rows, duckdb_rows):
            self.assertEqual([text(v) for v in duckdb_row], [text(v) for v in legacy_row])

        # the answers holding only numbers are number cells, the others stay texts (like "007")
        self.assertIsInstance(duckdb_rows[3][header.index("number")], float)
        self.assertEqual(duckdb_rows[5][header.index("text")], "007")
        self.assertIsInstance(duckdb_rows[0][header.index("ID du formulaire")], int)

    def test_validation_workflow_columns(self):
        expected = [
            ("Tricky validation", VALIDATION_STATUSES[index % len(VALIDATION_STATUSES)])
            for index in range(2 * len(TRICKY_ANSWERS))
        ]
        for engine in ("legacy", "duckdb"):
            with self.subTest(file_format="csv", engine=engine):
                header, *rows = csv_rows(self.get("csv", engine))
                workflow, status = header.index("Workflow"), header.index("Validation Status")
                self.assertEqual([(row[workflow], row[status]) for row in rows], expected)
            with self.subTest(file_format="xlsx", engine=engine):
                header, _labels, *rows = load_xlsx(self.get("xlsx", engine))[0]
                workflow, status = header.index("Workflow"), header.index("Validation Status")
                # empty cells are read back as None
                self.assertEqual([(row[workflow], row[status] or "") for row in rows], expected)

    def test_validation_workflow_filters(self):
        other_workflow = self.create_validation_workflow(account=self.account, name="Other workflow")
        all_count = 2 * len(TRICKY_ANSWERS)
        approved_count = sum(
            VALIDATION_STATUSES[index % len(VALIDATION_STATUSES)] == ValidationWorkflowArtefactStatus.APPROVED
            for index in range(all_count)
        )

        def statuses(engine, params):
            header, *rows = csv_rows(self.get("csv", engine, params))
            return [row[header.index("Validation Status")] for row in rows]

        for engine in ("legacy", "duckdb"):
            with self.subTest(engine=engine):
                self.assertEqual(len(statuses(engine, {"workflow_ids": self.form.validation_workflow_id})), all_count)
                self.assertEqual(statuses(engine, {"workflow_ids": other_workflow.id}), [])
                self.assertEqual(
                    statuses(engine, {"validation_status": ValidationWorkflowArtefactStatus.APPROVED}),
                    [ValidationWorkflowArtefactStatus.APPROVED] * approved_count,
                )

    def test_no_submission(self):
        """only the header rows (from the form version) when no submission matches the filters"""
        no_match = {"search": "ids:0"}

        legacy_rows = csv_rows(self.get("csv", "legacy", no_match))
        self.assertEqual(csv_rows(self.get("csv", "duckdb", no_match)), legacy_rows)
        self.assertEqual(len(legacy_rows), 1)

        legacy_rows, *legacy_style = load_xlsx(self.get("xlsx", "legacy", no_match))
        duckdb_rows, *duckdb_style = load_xlsx(self.get("xlsx", "duckdb", no_match))
        self.assertEqual(duckdb_rows, legacy_rows)
        self.assertEqual(duckdb_style, legacy_style)
        self.assertEqual(len(duckdb_rows), 2)

    def test_no_form(self):
        self.client.force_authenticate(self.user)
        for file_format in ("csv", "xlsx"):
            response = self.client.get(f"/api/instances/?{file_format}=true")
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.json(), {"error": "There is no form"})

    def test_xlsx_rows_beyond_excel_limit_are_ignored(self):
        with mock.patch("iaso.exports.tabular.XLSX_MAX_ROWS", 5):
            rows, *__ = load_xlsx(self.get("xlsx", "duckdb"))

        # the 2 header rows, then the first submissions
        self.assertEqual(len(rows), 5)
        first_ids = list(m.Instance.objects.filter(form=self.form).order_by("id").values_list("id", flat=True)[:3])
        self.assertEqual([row[0] for row in rows[2:]], first_ids)

    def test_filter_values_with_dollar_quotes(self):
        json_content = json.dumps({"==": [{"var": "other"}, DOLLAR_QUOTED]})
        filters = {"jsonContent": json_content}

        legacy_rows = csv_rows(self.get("csv", "legacy", filters))
        self.assertEqual(csv_rows(self.get("csv", "duckdb", filters)), legacy_rows)
        # the header, then the 2 submissions with this answer
        self.assertEqual(len(legacy_rows), 3)
        self.assertEqual({row[legacy_rows[0].index("other")] for row in legacy_rows[1:]}, {DOLLAR_QUOTED})

        rows, *__ = load_xlsx(self.get("xlsx", "duckdb", filters))
        self.assertEqual(len(rows), 4)

        # the search is also sent in the sql as is
        self.assertEqual(len(csv_rows(self.get("csv", "duckdb", {"search": "a$$b"}))), 1)


SNAPSHOTS_DIR = Path(__file__).resolve().parents[2] / "fixtures" / "snapshots"
NOW = datetime.datetime(2026, 3, 4, 10, 11, 12, tzinfo=pytz.UTC)
HOUSEHOLD_FORM_DESCRIPTOR = {
    "name": "data",
    "type": "survey",
    "title": "Household",
    "version": "2026010101",
    "children": [
        {
            "name": "household",
            "type": "group",
            "children": [
                {"name": "head_name", "type": "text", "label": "Head of household"},
                {"name": "members", "type": "decimal", "label": "Members"},
            ],
        },
        {"name": "vaccinated", "type": "text", "label": {"English": "Vaccinated", "French": "Vacciné"}},
        {"name": "visits", "type": "text", "label": "Visits"},
        {"name": "comment", "type": "text", "label": "Comment"},
        {"name": "never_answered", "type": "text", "label": "Never answered"},
    ],
}


HOUSEHOLD_QUESTIONS = ["head_name", "members", "vaccinated", "visits", "comment", "never_answered"]


def render_snapshot(snapshot_name: str, context: dict) -> str:
    """The expected export: a jinja template (ids... as variables), read as is (no new line translation)"""
    with open(SNAPSHOTS_DIR / snapshot_name, encoding="utf-8", newline="") as snapshot:
        return Template(snapshot.read(), keep_trailing_newline=True).render(**context)


def xlsx_row_as_csv_row(xlsx_row: list, csv_row: list) -> tuple[list, list]:
    """
    The xlsx cells are typed (empty, numbers), the csv ones are texts: the numbers are compared as numbers
    (4.5 in xlsx, 4.50 in csv), the rest as texts
    """
    xlsx_values, csv_values = [], []
    for xlsx_value, csv_value in zip(xlsx_row, csv_row):
        is_number = isinstance(xlsx_value, (int, float)) and not isinstance(xlsx_value, bool)
        xlsx_values.append(float(xlsx_value) if is_number else ("" if xlsx_value is None else xlsx_value))
        csv_values.append(float(csv_value) if is_number else csv_value)
    return xlsx_values, csv_values


# duckdb needs to see the committed fixtures, hence the transaction test case (like the parquet export tests)
class InstancesExportContentTestCase(BaseAPITransactionTestCase):
    """
    csv/xlsx export of the submissions of a form, compared to the snapshot `instances_export.csv`

    Each submission covers different columns:
        - complete: every column filled, deepest org unit (more than 4 parents), reference instance
        - minimal: no creator, location, entity, period, source dates (falls back on the creation dates), exported
        - guest: creator without first/last names, soft-deleted entity, answers to escape in csv
    And submissions that must not be exported: deleted, test device, no file, other form, other account.
    """

    def setUp(self):
        super().setUp()
        with mock.patch("django.utils.timezone.now", return_value=NOW):
            self.create_fixtures()

    def create_fixtures(self):
        self.account = m.Account.objects.create(name="Belgium")
        source = m.DataSource.objects.create(name="Belgium pyramid")
        version = m.SourceVersion.objects.create(data_source=source, number=1)
        self.account.default_version = version
        self.account.save()
        self.project = m.Project.objects.create(name="Belgium project", app_id="belgium", account=self.account)
        self.user = self.create_user_with_profile(
            username="namur_user",
            first_name="Jean",
            last_name="Dupont",
            account=self.account,
            permissions=[CORE_SUBMISSIONS_PERMISSION],
        )
        guest = self.create_user_with_profile(username="guest", account=self.account)

        org_unit_type = m.OrgUnitType.objects.create(name="Health facility", short_name="HF")
        self.org_units = {}
        parent = None
        for name in ["Belgium", "Namur province", "Namur district", "Gembloux zone", "Gembloux area", "Sauvenière"]:
            parent = self.org_units[name] = m.OrgUnit.objects.create(
                name=name,
                parent=parent,
                version=version,
                org_unit_type=org_unit_type,
                source_ref=f"ref_{name.split()[0].lower()}",
                code=f"code_{len(self.org_units)}",
                validation_status=m.OrgUnit.VALIDATION_VALID,
            )
        self.org_units["Brussels"] = m.OrgUnit.objects.create(
            name="Brussels", version=version, validation_status=m.OrgUnit.VALIDATION_NEW
        )

        self.form = m.Form.objects.create(name="Household", period_type=m.MONTH, correlatable=True)
        self.form.projects.add(self.project)
        org_unit_type.reference_forms.add(self.form)
        m.FormVersion.objects.create(form=self.form, version_id="2026010101", form_descriptor=HOUSEHOLD_FORM_DESCRIPTOR)
        self.create_validation_workflow(account=self.account, forms=[self.form], name="Household validation")
        entity_type = m.EntityType.objects.create(name="Household", account=self.account)
        self.entities = {
            name: m.Entity.objects.create(name=name, entity_type=entity_type, account=self.account, uuid=uuid)
            for name, uuid in [
                ("active", UUID("11111111-1111-4111-8111-111111111111")),
                ("soft deleted", UUID("22222222-2222-4222-8222-222222222222")),
            ]
        }

        self.instances = {
            "complete": self.create_form_instance(
                form=self.form,
                project=self.project,
                org_unit=self.org_units["Sauvenière"],
                period="202601",
                export_id="export_complete",
                location=Point(4.69, 50.56, 160),
                accuracy=4.5,
                source_created_at=datetime.datetime(2026, 1, 15, 8, 30, tzinfo=pytz.UTC),
                source_updated_at=datetime.datetime(2026, 1, 16, 9, 0, tzinfo=pytz.UTC),
                created_by=self.user,
                entity=self.entities["active"],
                correlation_id=1001,
                general_validation_status=ValidationWorkflowArtefactStatus.APPROVED,
                json={
                    "_version": "2026010101",
                    "head_name": "Jean",
                    "members": 4,
                    "vaccinated": "yes",
                    "visits": ["2026-01-02", "2026-01-09"],
                    "comment": "nothing to report",
                },
            ),
            "minimal": self.create_form_instance(
                form=self.form,
                project=self.project,
                org_unit=self.org_units["Brussels"],
                export_id="export_minimal",
                source_created_at=None,
                source_updated_at=None,
                last_export_success_at=NOW,
                json={"_version": "2026010101", "head_name": "Marie"},
            ),
            "guest": self.create_form_instance(
                form=self.form,
                project=self.project,
                org_unit=self.org_units["Gembloux area"],
                period="202602",
                export_id="export_guest",
                source_created_at=datetime.datetime(2026, 2, 1, 12, 0, tzinfo=pytz.UTC),
                created_by=guest,
                entity=self.entities["soft deleted"],
                correlation_id=1003,
                general_validation_status=ValidationWorkflowArtefactStatus.REJECTED,
                json={
                    "_version": "2026010101",
                    "head_name": "Émile",
                    "members": 2.5,
                    "vaccinated": True,
                    "comment": 'He said "ok", then\nleft',
                },
            ),
        }
        self.instances["complete"].flag_reference_instance(self.org_units["Sauvenière"])
        # modified in iaso after its creation (no source dates: the modification date falls back on it)
        m.Instance.objects.filter(pk=self.instances["minimal"].pk).update(updated_at=NOW + datetime.timedelta(days=1))
        self.entities["soft deleted"].delete()

        # not exported
        not_exported = {"form": self.form, "project": self.project, "org_unit": self.org_units["Brussels"]}
        self.create_form_instance(**not_exported, deleted=True, json={"head_name": "deleted"})
        self.create_form_instance(
            **not_exported,
            device=m.Device.objects.create(imei="test", test_device=True),
            json={"head_name": "test device"},
        )
        no_file = self.create_form_instance(**not_exported, json={"head_name": "no file"})
        m.Instance.objects.filter(pk=no_file.pk).update(file="")
        other_form = m.Form.objects.create(name="Other form")
        other_form.projects.add(self.project)
        self.create_form_instance(
            form=other_form, project=self.project, org_unit=self.org_units["Brussels"], json={"head_name": "other"}
        )
        france = m.Account.objects.create(name="France")
        france_project = m.Project.objects.create(name="France project", app_id="france", account=france)
        self.form.projects.add(france_project)
        self.create_form_instance(form=self.form, project=france_project, json={"head_name": "France"})

    def get(self, file_format, params=None):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/instances/", {"form_ids": self.form.id, file_format: "true", **(params or {})})
        self.assertEqual(response.status_code, 200)
        self.assertRegex(
            response["Content-Disposition"],
            rf'^attachment; filename="instances-{self.form.id}-\d{{4}}-\d{{2}}-\d{{2}}-\d{{2}}-\d{{2}}\.{file_format}"$',
        )
        content = b"".join(response.streaming_content)
        response.close()
        # used by the UI for the download progress
        self.assertEqual(int(response["X-File-Size"]), len(content))
        return content

    def snapshot_context(self):
        return {
            "instances": self.instances,
            "org_units": self.org_units,
            "entities": self.entities,
            "user": self.user,
            "guest": self.instances["guest"].created_by,
        }

    def test_csv_content(self):
        content = self.get("csv", {"order": "id"}).decode("utf-8")

        self.assertMultiLineEqual(content, render_snapshot("instances_export.csv", self.snapshot_context()))

    def test_csv_order(self):
        def exported_ids(order):
            header, *rows = csv_rows(self.get("csv", {"order": order}))
            return [int(row[0]) for row in rows]

        ids = sorted(instance.id for instance in self.instances.values())
        self.assertEqual(exported_ids("id"), ids)
        self.assertEqual(exported_ids("-id"), ids[::-1])

    def test_xlsx_content(self):
        rows, freeze_panes, bold_header, widths = load_xlsx(self.get("xlsx", {"order": "id"}))
        header, *expected_rows = csv_rows(render_snapshot("instances_export.csv", self.snapshot_context()).encode())

        self.assertEqual(list(rows[0]), header)
        # the question labels under the question names, multilingual labels as a dict (in jsonb's key order)
        self.assertEqual(
            rows[1][header.index("head_name") :],
            [
                "Head of household",
                "Members",
                "{'French': 'Vacciné', 'English': 'Vaccinated'}",
                "Visits",
                "Comment",
                "Never answered",
            ],
        )
        self.assertEqual(set(rows[1][: header.index("head_name")]), {None})
        self.assertEqual(len(rows[2:]), len(expected_rows))
        for xlsx_row, expected_row in zip(rows[2:], expected_rows):
            self.assertEqual(*xlsx_row_as_csv_row(xlsx_row, expected_row))

        self.assertEqual(freeze_panes, "A2")
        self.assertTrue(all(bold_header))
        # excel widths: the column width in characters + padding (20 -> 20.7109375)
        expected_widths = {
            column: 50.7109375 if title in HOUSEHOLD_QUESTIONS else 40.7109375 if title == "Latitude" else 20.7109375
            for column, title in enumerate(header, start=1)
        }
        self.assertEqual(widths, expected_widths)

        # typed cells: ids, coordinates and numeric answers are numbers, the codes stay texts
        complete = rows[2]
        self.assertIsInstance(complete[header.index("ID du formulaire")], int)
        self.assertIsInstance(complete[header.index("Latitude")], float)
        self.assertIsInstance(complete[header.index("members")], (int, float))
        self.assertIsInstance(complete[header.index("OU Code")], str)

    def test_django_side_queries_are_constant(self):
        """the rows are read by duckdb (with its own postgres connection): django only runs the setup queries"""
        for file_format in ("csv", "xlsx"):
            with self.subTest(file_format=file_format):
                self.get(file_format)  # warms the permission caches of the user
                for extra_submissions in (0, 5):
                    for __ in range(extra_submissions):
                        self.create_form_instance(form=self.form, project=self.project, json={"head_name": "extra"})
                    # 1. the profile org units (restriction of the user)
                    # 2. single_per_period forms (status column)
                    # 3. the form
                    # 4. its latest version (the questions columns)
                    # 5. SELECT 1: django_query_to_sql opens a cursor to render the export query with its params
                    with self.assertNumQueries(5):
                        self.get(file_format)
