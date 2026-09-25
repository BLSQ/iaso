"""
CSV / XLSX exports of a django queryset through duckdb (same idea as the parquet export).

The legacy exports (see `hat.api.export_utils`) iterate on django model instances and write every cell from
python, which is very slow on large querysets. Here the queryset is compiled to SQL, read from postgres by duckdb
and written by duckdb's own writers: `COPY ... (FORMAT csv)` and `COPY ... (FORMAT xlsx)` (excel extension).

The queryset is expected to already give the final content of each cell (texts, numbers...), so this module only
chooses the columns titles and, for xlsx, the columns types.

Columns are described like the legacy exports ({"title": ..., "width": ...}) with extra keys:
    - "field": name of the queryset column (`.values()` key) holding the value
    - "infer_number" (optional): text column written as a number column in xlsx when all its non empty values
      are numbers (integers or decimals, without leading zeros so that codes like "007" stay texts)
"""

import os
import re
import shutil
import time
import zipfile

from logging import getLogger
from typing import Dict, List, Optional, Tuple
from xml.sax.saxutils import escape as xml_escape

from django.db.models import QuerySet
from xlsxwriter.utility import xl_rowcol_to_cell  # type: ignore

from .duckdb_util import django_query_to_sql, duckdb_attached_to_postgres


logger = getLogger(__name__)

COPY_BUFFER_SIZE = 16 * 1024 * 1024
XLSX_MAX_ROWS = 1_048_576
XLSX_SHEET_PATH = "xl/worksheets/sheet1.xml"
XLSX_STYLES_PATH = "xl/styles.xml"
# enough for the header row and the placeholder row
XLSX_SHEET_HEAD_SIZE = 4 * 1024 * 1024
XLSX_EMPTY_SECOND_ROW = '<row r="2"></row>'
XLSX_STRING_MAX_LENGTH = 32767
# not allowed in xml, so in xlsx files (tab, line feed and carriage return are allowed)
XLSX_INVALID_CHARS_RE = "[\\x01-\\x08\\x0b\\x0c\\x0e-\\x1f]"
# at most 18 digits so that the value always fits in a BIGINT
INTEGER_RE = "-?(0|[1-9][0-9]{0,17})"
DECIMAL_RE = "-?(0|[1-9][0-9]*)\\.[0-9]+"


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def sql_identifier(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def postgres_source(qs: QuerySet) -> str:
    return f"postgres_query('pg', $$ {django_query_to_sql(qs)} $$)"


def export_django_query_to_csv_via_duckdb(qs: QuerySet, output_file_path: str, columns: List[Dict]):
    start = time.perf_counter()
    projections = [
        f"{sql_identifier(c['field'])} AS {sql_identifier(c['title'].replace(chr(10), ' '))}" for c in columns
    ]
    with duckdb_attached_to_postgres() as duckdb_connection:
        # stored first: reading postgres is single threaded, writing the csv from a duckdb table is parallel
        duckdb_connection.execute(f"CREATE TABLE export_source AS SELECT * FROM {postgres_source(qs)}")
        duckdb_connection.execute(
            f"COPY (SELECT {', '.join(projections)} FROM export_source) "
            f"TO {sql_literal(output_file_path)} (FORMAT csv, HEADER true)"
        )
    logger.warning(f"exported csv {output_file_path} took {time.perf_counter() - start:.3f} seconds")


def export_django_query_to_xlsx_via_duckdb(
    qs: QuerySet,
    output_file_path: str,
    sheet_name: str,
    columns: List[Dict],
    sub_columns: Optional[List[str]] = None,
):
    """
    sub_columns: optional second header row (legacy export: the question labels under the question names)
    """
    start = time.perf_counter()
    header_rows = 2 if sub_columns else 1
    raw_file_path = output_file_path + ".raw.xlsx"
    with duckdb_attached_to_postgres() as duckdb_connection:
        duckdb_connection.execute("INSTALL excel; LOAD excel;")
        # stored first so that the columns types can be inferred from the whole content
        # like xlsxwriter, the rows beyond excel's limit are ignored
        duckdb_connection.execute(
            f"CREATE TABLE export_source AS SELECT * FROM {postgres_source(qs)} LIMIT {XLSX_MAX_ROWS - header_rows}"
        )
        types = dict(
            duckdb_connection.execute("SELECT column_name, column_type FROM (DESCRIBE export_source)").fetchall()
        )
        number_types = infer_number_types(duckdb_connection, [c["field"] for c in columns if c.get("infer_number")])

        projections = []
        for column in columns:
            field = sql_identifier(column["field"])
            if column["field"] in number_types:
                value = f"CAST(NULLIF({field}, '') AS {number_types[column['field']]})"
            elif types[column["field"]] == "VARCHAR":
                value = f"left(regexp_replace({field}, '{XLSX_INVALID_CHARS_RE}', '', 'g'), {XLSX_STRING_MAX_LENGTH})"
            else:
                value = field
            projections.append(f"{value} AS {sql_identifier(column['title'])}")

        # the xlsx writer is single threaded: the values are computed beforehand (in parallel)
        duckdb_connection.execute(
            f"CREATE TABLE export_values AS SELECT {', '.join(projections)} FROM export_source LIMIT 0"
        )
        if sub_columns:
            # empty placeholder row (written as <row r="2"></row>), replaced by the sub columns in style_xlsx: the
            # sub columns can't be written by duckdb since they are texts in columns that can be numbers
            duckdb_connection.execute("INSERT INTO export_values DEFAULT VALUES")
        # the insertion order is kept by the table scan of COPY
        duckdb_connection.execute(f"INSERT INTO export_values SELECT {', '.join(projections)} FROM export_source")
        duckdb_connection.execute("DROP TABLE export_source")
        duckdb_connection.execute(
            f"COPY export_values TO {sql_literal(raw_file_path)} "
            f"(FORMAT xlsx, HEADER true, SHEET {sql_literal(sheet_name[:31])})"
        )
    written = time.perf_counter()
    try:
        style_xlsx(raw_file_path, output_file_path, columns, sub_columns)
    finally:
        os.remove(raw_file_path)
    end = time.perf_counter()
    logger.warning(
        f"exported xlsx {output_file_path} took {end - start:.3f} seconds (styling {end - written:.3f} seconds)"
    )


def style_xlsx(raw_file_path: str, output_file_path: str, columns: List[Dict], sub_columns: Optional[List[str]]):
    """
    Styles the duckdb xlsx like the legacy export (bold header, frozen header, columns widths) and adds the sub
    columns row. The files parts are patched directly: loading the workbook (openpyxl) would be much too slow.
    Only the beginning of the (big) sheet changes, the rest of it is streamed as is.
    """
    with zipfile.ZipFile(raw_file_path) as raw:
        styles, header_style = _patch_styles(raw.read(XLSX_STYLES_PATH).decode("utf-8"))
        with zipfile.ZipFile(output_file_path, "w", zipfile.ZIP_DEFLATED, compresslevel=1) as output:
            for info in raw.infolist():
                if info.filename == XLSX_STYLES_PATH:
                    output.writestr(info, styles)
                elif info.filename == XLSX_SHEET_PATH:
                    with raw.open(info) as sheet, output.open(XLSX_SHEET_PATH, "w", force_zip64=True) as output_sheet:
                        # the head may end in the middle of a character: surrogateescape keeps the bytes as is
                        head = sheet.read(XLSX_SHEET_HEAD_SIZE).decode("utf-8", "surrogateescape")
                        head = _patch_sheet_head(head, header_style, columns, sub_columns)
                        output_sheet.write(head.encode("utf-8", "surrogateescape"))
                        shutil.copyfileobj(sheet, output_sheet, COPY_BUFFER_SIZE)
                else:
                    output.writestr(info, raw.read(info.filename))


def _patch_styles(styles: str) -> Tuple[str, int]:
    """adds a bold (and wrapped, like the legacy export) style for the header cells, returns it with its index"""
    fonts = re.search(r'<fonts count="(\d+)">(.*?)</fonts>', styles, re.S)
    cell_xfs = re.search(r'<cellXfs count="(\d+)">(.*?)</cellXfs>', styles, re.S)
    if not fonts or not cell_xfs or "<font>" not in fonts.group(2):
        raise ValueError("unexpected xlsx styles, can't add the header style")
    font_count, xf_count = int(fonts.group(1)), int(cell_xfs.group(1))
    bold_font = fonts.group(2).split("</font>")[0].replace("<font>", "<font><b/>", 1) + "</font>"
    header_xf = f'<xf numFmtId="164" fontId="{font_count}" xfId="0" applyFont="1" applyAlignment="1"><alignment wrapText="1"/></xf>'
    styles = styles.replace(fonts.group(0), f'<fonts count="{font_count + 1}">{fonts.group(2)}{bold_font}</fonts>')
    styles = styles.replace(
        cell_xfs.group(0), f'<cellXfs count="{xf_count + 1}">{cell_xfs.group(2)}{header_xf}</cellXfs>'
    )
    return styles, xf_count


def _patch_sheet_head(head: str, header_style: int, columns: List[Dict], sub_columns: Optional[List[str]]) -> str:
    header_end = head.find("</row>")
    if "<sheetData>" not in head or header_end == -1:
        raise ValueError("xlsx header row not found")
    header_end += len("</row>")
    header, rest = head[:header_end], head[header_end:]

    header = re.sub(r'<c (r="[A-Z]+1")', rf'<c \1 s="{header_style}"', header)

    if sub_columns:
        if not rest.startswith(XLSX_EMPTY_SECOND_ROW):
            raise ValueError("xlsx placeholder row for the sub columns not found")
        cells = "".join(
            f'<c r="{xl_rowcol_to_cell(1, index)}" t="inlineStr"><is><t xml:space="preserve">{_xml_text(label)}</t></is></c>'
            for index, label in enumerate(sub_columns)
            if label
        )
        rest = f'<row r="2">{cells}</row>' + rest[len(XLSX_EMPTY_SECOND_ROW) :]

    # like xlsxwriter's set_column(): widths are given in characters
    cols = "".join(
        f'<col min="{index + 1}" max="{index + 1}" width="{_column_width(column.get("width", len(column["title"])))}" customWidth="1"/>'
        for index, column in enumerate(columns)
    )
    frozen_header = (
        '<sheetViews><sheetView workbookViewId="0">'
        '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft"/>'
        "</sheetView></sheetViews>"
    )
    header = header.replace("<sheetData>", f"{frozen_header}<cols>{cols}</cols><sheetData>", 1)
    return header + rest


def _xml_text(value) -> str:
    value = re.sub(XLSX_INVALID_CHARS_RE, "", str(value))[:XLSX_STRING_MAX_LENGTH]
    return xml_escape(value)


def _column_width(width: float) -> float:
    # same conversion as xlsxwriter (from a number of characters to excel's width)
    max_digit_width, padding = 7, 5
    return int((width * max_digit_width + padding) / max_digit_width * 256) / 256


def infer_number_types(duckdb_connection, fields: List[str]) -> Dict[str, str]:
    """BIGINT or DOUBLE for the text fields of export_source only holding numbers (or nothing)"""
    if not fields:
        return {}
    checks = []
    for field in fields:
        value = f"NULLIF({sql_identifier(field)}, '')"
        is_integer = f"regexp_full_match({value}, '{INTEGER_RE}')"
        is_decimal = f"regexp_full_match({value}, '{DECIMAL_RE}')"
        checks.append(f"bool_and({value} IS NULL OR {is_integer})")
        checks.append(f"bool_and({value} IS NULL OR {is_integer} OR {is_decimal})")
    results = duckdb_connection.execute(f"SELECT {', '.join(checks)} FROM export_source").fetchone()

    number_types = {}
    for index, field in enumerate(fields):
        only_integers, only_numbers = results[2 * index], results[2 * index + 1]
        if only_integers:
            number_types[field] = "BIGINT"
        elif only_numbers:
            number_types[field] = "DOUBLE"
    return number_types
