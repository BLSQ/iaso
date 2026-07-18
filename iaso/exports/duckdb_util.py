import os
import time

from logging import getLogger

import duckdb

from django.db import connection
from django.db.models import QuerySet


logger = getLogger(__name__)


def export_django_query_to_parquet_via_duckdb(
    qs: QuerySet, output_file_path: str, mapping=None, json_fields=None, json_column=None
):
    # json_fields/json_column: mapping entries whose value actually lives inside a single raw json column, extracted via DuckDB instead of being a plain rename.
    start = time.perf_counter()

    sql, params = qs.query.sql_with_params()
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")  # ensure cursor is open
        full_sql = cursor.mogrify(sql, params).decode()
    # initially was full_sql = sql % tuple(map(adapt_param, params)) but supporting all types is complicated
    dsn = connection.get_connection_params()

    tmpdir = "/tmp/duckdb_tmp"
    os.makedirs(tmpdir, exist_ok=True)

    with duckdb.connect() as duckdb_connection:
        duckdb_connection.execute(f"PRAGMA temp_directory='{tmpdir}'")
        duckdb_connection.execute(
            "PRAGMA memory_limit='1500MB'"
        )  # reasonable but should work even if you don't have that memory available

        attach_sql = f"""
            INSTALL postgres;
            LOAD postgres;
            ATTACH 'dbname={dsn["dbname"]} host={dsn["host"]} user={dsn["user"]} password={dsn["password"]} port={dsn["port"]}' AS pg (TYPE postgres, READ_ONLY);
        """
        duckdb_connection.execute(attach_sql)

        logger.info(f"exporting parquet : {output_file_path} \n\n {full_sql}")
        # had to specify ROW_GROUP_SIZE when exporting large rows like several geojson on the same row
        source_sql = f"postgres_query('pg', $$ {full_sql} $$)"
        alias_stmt = " * "
        query_params = []
        if mapping:
            plain_cols, json_cols, json_pointers = build_projection_parts(mapping, json_fields, json_column)
            if json_pointers:
                # Extract every question in one shot per row (single JSON parse via a bound array
                # of paths, materialized once through the CTE) instead of one json_extract_string()
                # call per question -- calling it once per question would re-parse the same JSON
                # text for every single question, which is slower *and* far more memory-hungry.
                select_parts = plain_cols + [
                    f'__json_extracted[{i + 1}] as "{escaped_name}"' for i, escaped_name in enumerate(json_cols)
                ]
                alias_stmt = ",\n    ".join(select_parts)
                source_sql = f"""(
                    SELECT *, json_extract_string("{json_column}", ?) AS __json_extracted
                    FROM {source_sql}
                ) AS src_with_json"""
                query_params = [json_pointers]
            else:
                alias_stmt = ",\n    ".join(plain_cols)

        parquet_export_sql = f"""
            COPY (
                SELECT {alias_stmt} FROM {source_sql}
            ) TO '{output_file_path}' (FORMAT PARQUET, COMPRESSION 'ZSTD', ROW_GROUP_SIZE 10000)
        """

        duckdb_connection.execute(parquet_export_sql, query_params)

        row_count = duckdb_connection.execute(f"SELECT COUNT(*) FROM '{output_file_path}'").fetchone()[0]
        col_count = len(duckdb_connection.execute(f"DESCRIBE SELECT * FROM '{output_file_path}'").fetchall())

    duration = time.perf_counter() - start
    size_mb = os.path.getsize(output_file_path) / (1024 * 1024)
    logger.warning(
        f"dumped to {output_file_path} took {duration:.3f} seconds for {row_count} records and {col_count} columns, final file size {size_mb:.2f} Mb"
    )


def build_projection_parts(mapping, json_fields=None, json_column=None):
    json_fields = json_fields or set()
    plain_cols = []
    json_cols = []
    json_pointers = []
    for orig, safe in mapping.items():
        escaped_orig = orig.replace('"', '""')
        if orig in json_fields:
            json_cols.append(escaped_orig)
            # JSON Pointer (RFC 6901) syntax: only "~" and "/" need escaping, unlike JSONPath's quoting rules.
            json_pointers.append("/" + orig.replace("~", "~0").replace("/", "~1"))
        else:
            plain_cols.append(f'"{safe}" as "{escaped_orig}"')
    return plain_cols, json_cols, json_pointers
