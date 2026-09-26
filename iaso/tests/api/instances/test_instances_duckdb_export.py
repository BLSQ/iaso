import csv
import datetime
import io
import json
import re

from unittest import mock
from urllib.parse import quote
from uuid import uuid4

import openpyxl
import pytz

from django.contrib.gis.geos import Point
from django.utils import timezone

from iaso import models as m
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION
from iaso.tests.utils_parquet import BaseAPITransactionTestCase


CONTROL_CHARS_RE = re.compile("[\x01-\x08\x0b\x0c\x0e-\x1f]")
ESCAPED_CONTROL_CHARS_RE = re.compile(
    "_x00[01][0-9A-F]_"
)  # closes a $$ ... $$ quoted string: the query params must not be able to end the sql given to duckdb
DOLLAR_QUOTED = "#hash $$) ; SELECT 42; --"
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
            )
            if index == 1:
                instance.flag_reference_instance(instance.org_unit)
        m.Entity.objects_include_deleted.filter(name="entity 3").update(deleted_at=timezone.now())

    def get(self, file_format, engine, filters=""):
        self.client.force_authenticate(self.user)
        url = f"/api/instances/?form_ids={self.form.id}&{file_format}=true&order=id{filters}"
        response = self.client.get(url + ("&engine=legacy" if engine == "legacy" else ""))
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

    def test_no_submission(self):
        """only the header rows (from the form version) when no submission matches the filters"""
        no_match = "&search=ids:0"

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
        filters = "&jsonContent=" + quote(json_content)

        legacy_rows = csv_rows(self.get("csv", "legacy", filters))
        self.assertEqual(csv_rows(self.get("csv", "duckdb", filters)), legacy_rows)
        # the header, then the 2 submissions with this answer
        self.assertEqual(len(legacy_rows), 3)
        self.assertEqual({row[legacy_rows[0].index("other")] for row in legacy_rows[1:]}, {DOLLAR_QUOTED})

        rows, *__ = load_xlsx(self.get("xlsx", "duckdb", filters))
        self.assertEqual(len(rows), 4)

        # the search is also sent in the sql as is
        self.assertEqual(len(csv_rows(self.get("csv", "duckdb", "&search=" + quote("a$$b")))), 1)
