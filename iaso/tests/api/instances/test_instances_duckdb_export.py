import csv
import datetime
import io
import re

from uuid import uuid4

import openpyxl
import pytz

from django.contrib.gis.geos import Point

from iaso import models as m
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION
from iaso.tests.utils_parquet import BaseAPITransactionTestCase


CONTROL_CHARS_RE = re.compile("[\x01-\x08\x0b\x0c\x0e-\x1f]")
ESCAPED_CONTROL_CHARS_RE = re.compile("_x00[01][0-9A-F]_")
TRICKY_ANSWERS = [
    {"text": 'a, "quoted" <b>&amp;</b>', "other": "multi\nline\r\nend", "number": 1, "the_last_column": "short"},
    {"text": "  leading and trailing  ", "other": "Élève ñ 日本", "number": 2, "the_last_column": "short"},
    {"text": "ctrl\x01\x0bchar", "other": "#hash", "number": 3, "the_last_column": "short"},
    {"text": True, "other": False, "number": 12, "the_last_column": "short"},
    {"text": ["a", "b"], "other": None, "number": 12.5, "the_last_column": "short"},
    # the legacy xlsx export drops the cells following a string longer than excel's limit (xlsxwriter's write_row
    # stops on the truncation "error"): keep it in the last column (jsonb orders the keys by length)
    {"text": "007", "other": "x", "number": -3, "the_last_column": "x" * 40000},
]


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

    def get(self, file_format, engine):
        self.client.force_authenticate(self.user)
        url = f"/api/instances/?form_ids={self.form.id}&{file_format}=true&order=id"
        response = self.client.get(url + ("&engine=legacy" if engine == "legacy" else ""))
        self.assertEqual(response.status_code, 200)
        content = b"".join(
            chunk.encode() if isinstance(chunk, str) else chunk
            for chunk in (response.streaming_content if response.streaming else response)
        )
        response.close()
        return content

    def test_csv_same_content(self):
        def rows(content):
            return list(csv.reader(io.StringIO(content.decode("utf-8"))))

        legacy_rows = rows(self.get("csv", "legacy"))
        duckdb_rows = rows(self.get("csv", "duckdb"))

        self.assertEqual(len(duckdb_rows), 1 + 2 * len(TRICKY_ANSWERS))
        # same content, the quoting may differ
        self.assertEqual(duckdb_rows, legacy_rows)

    def test_xlsx_same_content(self):
        def load(content):
            sheet = openpyxl.load_workbook(io.BytesIO(content)).worksheets[0]
            rows = [list(row) for row in sheet.iter_rows(values_only=True)]
            # the same widths can be grouped differently (<col min="1" max="4" ...>)
            widths = {
                column: dimension.width
                for dimension in sheet.column_dimensions.values()
                for column in range(dimension.min, dimension.max + 1)
            }
            return rows, sheet.freeze_panes, [cell.font.b for cell in sheet[1]], widths

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

        legacy_rows, legacy_panes, legacy_bold, legacy_widths = load(self.get("xlsx", "legacy"))
        duckdb_rows, duckdb_panes, duckdb_bold, duckdb_widths = load(self.get("xlsx", "duckdb"))

        # header rows: the titles, then the question labels
        header = duckdb_rows[0]
        self.assertEqual(header, legacy_rows[0])
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
