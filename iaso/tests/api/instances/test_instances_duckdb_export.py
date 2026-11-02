import csv
import datetime
import io
import json

from pathlib import Path
from unittest import mock
from uuid import UUID

import openpyxl
import pytz

from django.contrib.gis.geos import Point
from jinja2 import Template

from iaso import models as m
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION
from iaso.tests.utils_parquet import BaseAPITransactionTestCase


# closes a $$ ... $$ quoted string: the query params must not be able to end the sql given to duckdb
DOLLAR_QUOTED = "#hash $$) ; SELECT 42; --"
VALIDATION_STATUSES = [
    ValidationWorkflowArtefactStatus.APPROVED,
    ValidationWorkflowArtefactStatus.REJECTED,
    ValidationWorkflowArtefactStatus.PENDING,
    "",
]
SPECIAL_ANSWERS = [
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
    {"text": "007", "other": "x", "number": -3, "the_last_column": "x" * 40000},
]
ANSWER_COLUMNS = ["text", "other", "number", "status", "the_last_column"]
# the csv cells of SPECIAL_ANSWERS, in ANSWER_COLUMNS order
EXPECTED_CSV_ANSWERS = [
    ['a, "quoted" <b>&amp;</b>', "multi\nline\r\nend", "1", "", "short"],
    ["  leading and trailing  ", "Élève ñ 日本", "2", "done", "short"],
    ["ctrl\x01\x0bchar", DOLLAR_QUOTED, "3", "", "short"],
    ["True", "False", "12", "", "short"],
    ['["a", "b"]', "", "12.5", "", "short"],
    ["007", "x", "-3", "", "x" * 40000],
]
# the xlsx cells: control characters removed (not allowed in xml), carriage returns read back as line feeds,
# numbers as numbers (except "007"), strings truncated to excel's limit
EXPECTED_XLSX_ANSWERS = [
    ['a, "quoted" <b>&amp;</b>', "multi\nline\nend", 1, None, "short"],
    ["  leading and trailing  ", "Élève ñ 日本", 2, "done", "short"],
    ["ctrlchar", DOLLAR_QUOTED, 3, None, "short"],
    ["True", "False", 12, None, "short"],
    ['["a", "b"]', None, 12.5, None, "short"],
    ["007", "x", -3, None, "x" * 32767],
]
SPECIAL_FORM_DESCRIPTOR = {
    "name": "data",
    "type": "survey",
    "title": "Special values",
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
        # same name as the "Status" column (duckdb's column names are case insensitive)
        {"name": "status", "type": "text", "label": "Question status"},
        # never answered: empty column, multilingual label
        {"name": "not_answered", "type": "text", "label": {"English": "Not answered", "French": "Pas de réponse"}},
        {"name": "the_last_column", "type": "text"},
    ],
}
EXPECTED_HEADER = [
    "ID du formulaire",
    "Soumission de référence",
    "Version du formulaire",
    "Export id",
    "Latitude",
    "Longitude",
    "Altitude",
    "Précision",
    "Période",
    "Date de création",
    "Création dans IASO",
    "Date de modification",
    "Créé par",
    "Créé par id",
    "Status",
    "Entité",
    "Entité id",
    "Org unit",
    "Org unit id",
    "Référence externe",
    "OU Code",
    "OU Status",
    "Workflow",
    "Validation Status",
    "parent1",
    "parent2",
    "parent3",
    "parent4",
    "correlation id",
    "text",
    "other",
    "number",
    "status",
    "not_answered",
    "the_last_column",
]


def csv_rows(content):
    # newline="": keeps the carriage returns inside the quoted values
    return list(csv.reader(io.StringIO(content.decode("utf-8"), newline="")))


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
class InstancesExportSpecialValuesTestCase(BaseAPITransactionTestCase):
    """csv/xlsx export of answers that need escaping or a special handling, one submission per SPECIAL_ANSWERS"""

    def setUp(self):
        super().setUp()
        self.account = m.Account.objects.create(name="Belgium")
        source = m.DataSource.objects.create(name="Belgium pyramid")
        version = m.SourceVersion.objects.create(data_source=source, number=1)
        self.account.default_version = version
        self.account.save()
        self.project = m.Project.objects.create(name="Belgium project", app_id="belgium", account=self.account)
        self.user = self.create_user_with_profile(
            username="namur_user", account=self.account, permissions=[CORE_SUBMISSIONS_PERMISSION]
        )
        org_unit = m.OrgUnit.objects.create(name="Namur", version=version)

        self.form = m.Form.objects.create(name="Special values", period_type=m.MONTH, correlatable=True)
        self.form.projects.add(self.project)
        # the answers columns (and their labels) come from the latest version, like for any real form
        m.FormVersion.objects.create(form=self.form, version_id="2020020101", form_descriptor=SPECIAL_FORM_DESCRIPTOR)
        self.create_validation_workflow(account=self.account, forms=[self.form], name="Special validation")

        self.instance_ids = [
            self.create_form_instance(
                form=self.form,
                org_unit=org_unit,
                project=self.project,
                json={"_version": "2020020101", **answers},
                general_validation_status=VALIDATION_STATUSES[index % len(VALIDATION_STATUSES)],
            ).id
            for index, answers in enumerate(SPECIAL_ANSWERS)
        ]

    def get(self, file_format, params=None):
        self.client.force_authenticate(self.user)
        query = {"form_ids": self.form.id, file_format: "true", "order": "id", **(params or {})}
        response = self.client.get("/api/instances/", query)
        self.assertEqual(response.status_code, 200)
        content = b"".join(response.streaming_content)
        response.close()
        return content

    def test_csv_answers(self):
        header, *rows = csv_rows(self.get("csv"))

        self.assertEqual(header, EXPECTED_HEADER)
        self.assertEqual([int(row[0]) for row in rows], self.instance_ids)
        answer_indexes = [header.index(name) for name in ANSWER_COLUMNS]
        for row, expected in zip(rows, EXPECTED_CSV_ANSWERS):
            self.assertEqual([row[index] for index in answer_indexes], expected)
        self.assertEqual({row[header.index("not_answered")] for row in rows}, {""})

    def test_csv_quoting(self):
        content = self.get("csv").decode("utf-8")

        # quotes doubled, values with a comma / quote / new line quoted, carriage returns kept as is
        self.assertIn(',"a, ""quoted"" <b>&amp;</b>","multi\nline\r\nend",1,', content)
        self.assertIn(",  leading and trailing  ,Élève ñ 日本,2,done,", content)

    def test_xlsx_answers(self):
        rows, freeze_panes, bold_header, __ = load_xlsx(self.get("xlsx"))
        header, labels, *rows = rows

        self.assertEqual(header, EXPECTED_HEADER)
        self.assertEqual(
            labels[header.index("text") :],
            [
                'Text <with> "xml" & chars',
                "Other",
                "Number",
                "Question status",
                "{'French': 'Pas de réponse', 'English': 'Not answered'}",
                None,
            ],
        )
        self.assertEqual(freeze_panes, "A2")
        self.assertTrue(all(bold_header))
        self.assertEqual([row[0] for row in rows], self.instance_ids)
        answer_indexes = [header.index(name) for name in ANSWER_COLUMNS]
        for row, expected in zip(rows, EXPECTED_XLSX_ANSWERS):
            self.assertEqual([row[index] for index in answer_indexes], expected)

        # all the answers of "number" are numbers: number cells. "text" has a "007": text cells
        self.assertEqual({type(row[header.index("number")]) for row in rows}, {float})
        self.assertEqual({type(row[header.index("text")]) for row in rows}, {str})

    def test_validation_workflow_columns(self):
        expected = [
            ("Special validation", VALIDATION_STATUSES[index % len(VALIDATION_STATUSES)])
            for index in range(len(SPECIAL_ANSWERS))
        ]
        with self.subTest(file_format="csv"):
            header, *rows = csv_rows(self.get("csv"))
            workflow, status = header.index("Workflow"), header.index("Validation Status")
            self.assertEqual([(row[workflow], row[status]) for row in rows], expected)
        with self.subTest(file_format="xlsx"):
            header, _labels, *rows = load_xlsx(self.get("xlsx"))[0]
            workflow, status = header.index("Workflow"), header.index("Validation Status")
            # empty cells are read back as None
            self.assertEqual([(row[workflow], row[status] or "") for row in rows], expected)

    def test_validation_workflow_filters(self):
        other_workflow = self.create_validation_workflow(account=self.account, name="Other workflow")

        def exported_ids(params):
            header, *rows = csv_rows(self.get("csv", params))
            return [int(row[0]) for row in rows]

        approved_ids = [
            instance_id
            for index, instance_id in enumerate(self.instance_ids)
            if VALIDATION_STATUSES[index % len(VALIDATION_STATUSES)] == ValidationWorkflowArtefactStatus.APPROVED
        ]
        self.assertEqual(len(approved_ids), 2)
        self.assertEqual(exported_ids({"workflow_ids": self.form.validation_workflow_id}), self.instance_ids)
        self.assertEqual(exported_ids({"workflow_ids": other_workflow.id}), [])
        self.assertEqual(exported_ids({"validation_status": ValidationWorkflowArtefactStatus.APPROVED}), approved_ids)

    def test_no_submission(self):
        """only the header rows (from the form version) when no submission matches the filters"""
        no_match = {"search": "ids:0"}

        self.assertEqual(csv_rows(self.get("csv", no_match)), [EXPECTED_HEADER])

        rows, freeze_panes, bold_header, widths = load_xlsx(self.get("xlsx", no_match))
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0], EXPECTED_HEADER)
        first_question = EXPECTED_HEADER.index("text")
        self.assertEqual(rows[1][first_question], 'Text <with> "xml" & chars')
        self.assertEqual(set(rows[1][:first_question]), {None})
        self.assertEqual(freeze_panes, "A2")
        self.assertTrue(all(bold_header))
        self.assertEqual(len(widths), len(EXPECTED_HEADER))

    def test_no_form(self):
        self.client.force_authenticate(self.user)
        for file_format in ("csv", "xlsx"):
            with self.subTest(file_format=file_format):
                response = self.client.get(f"/api/instances/?{file_format}=true")
                self.assertJSONResponse(response, 400)
                self.assertEqual(response.json(), {"error": "There is no form"})

    def test_xlsx_rows_beyond_excel_limit_are_ignored(self):
        with mock.patch("iaso.exports.tabular.XLSX_MAX_ROWS", 5):
            rows, *__ = load_xlsx(self.get("xlsx"))

        # the 2 header rows, then the first submissions
        self.assertEqual(len(rows), 5)
        self.assertEqual([row[0] for row in rows[2:]], self.instance_ids[:3])

    def test_filter_values_with_dollar_quotes(self):
        json_content = json.dumps({"==": [{"var": "other"}, DOLLAR_QUOTED]})
        filters = {"jsonContent": json_content}

        header, *rows = csv_rows(self.get("csv", filters))
        # only the submission with this answer
        self.assertEqual([int(row[0]) for row in rows], [self.instance_ids[2]])
        self.assertEqual(rows[0][header.index("other")], DOLLAR_QUOTED)

        rows, *__ = load_xlsx(self.get("xlsx", filters))
        self.assertEqual([row[0] for row in rows[2:]], [self.instance_ids[2]])

        # the search is also sent in the sql as is
        self.assertEqual(csv_rows(self.get("csv", {"search": "a$$b"})), [EXPECTED_HEADER])


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
