import os
import shutil
import tempfile
import time

from contextlib import contextmanager
from logging import getLogger

import duckdb

from django.db import connection
from django.db.models import QuerySet


logger = getLogger(__name__)

DUCKDB_TMP_ROOT = "/tmp/duckdb_tmp"


def django_query_to_sql(qs: QuerySet) -> str:
    sql, params = qs.query.sql_with_params()
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")  # ensure cursor is open
        full_sql = cursor.mogrify(sql, params).decode()
    # initially was full_sql = sql % tuple(map(adapt_param, params)) but supporting all types is complicated
    return full_sql


def sql_literal(value: str) -> str:
    """duckdb string literal: only the single quotes need to be escaped (backslashes are not special)"""
    return "'" + value.replace("'", "''") + "'"


def postgres_query_source(qs: QuerySet) -> str:
    """
    duckdb source reading the queryset from the attached postgres database.
    The sql contains the (user given) query params: it must be a quoted literal, not $$ ... $$ which ends at the
    first "$$" of a value.
    """
    return f"postgres_query('pg', {sql_literal(django_query_to_sql(qs))})"


@contextmanager
def duckdb_attached_to_postgres():
    """duckdb connection with the django database attached (read only) as `pg`"""
    dsn = connection.get_connection_params()

    # one temp directory per connection: duckdb's spill file names are only unique within a duckdb instance, so
    # concurrent exports sharing a directory remove each other's files
    os.makedirs(DUCKDB_TMP_ROOT, exist_ok=True)
    tmpdir = tempfile.mkdtemp(dir=DUCKDB_TMP_ROOT)

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
        try:
            yield duckdb_connection
        finally:
            duckdb_connection.close()
            shutil.rmtree(tmpdir, ignore_errors=True)


def export_django_query_to_parquet_via_duckdb(qs: QuerySet, output_file_path: str, mapping=None):
    start = time.perf_counter()

    source = postgres_query_source(qs)

    with duckdb_attached_to_postgres() as duckdb_connection:
        logger.info(f"exporting parquet : {output_file_path} \n\n {source}")
        # had to specify ROW_GROUP_SIZE when exporting large rows like several geojson on the same row
        alias_stmt = " * "
        if mapping:
            alias_stmt = dict_to_projection(mapping)

        parquet_export_sql = f"""
            COPY (
                SELECT {alias_stmt} FROM {source}
            ) TO '{output_file_path}' (FORMAT PARQUET, COMPRESSION 'ZSTD', ROW_GROUP_SIZE 10000)
        """

        duckdb_connection.execute(parquet_export_sql)

        row_count = duckdb_connection.execute(f"SELECT COUNT(*) FROM '{output_file_path}'").fetchone()[0]
        col_count = len(duckdb_connection.execute(f"DESCRIBE SELECT * FROM '{output_file_path}'").fetchall())

    duration = time.perf_counter() - start
    size_mb = os.path.getsize(output_file_path) / (1024 * 1024)
    logger.warning(
        f"dumped to {output_file_path} took {duration:.3f} seconds for {row_count} records and {col_count} columns, final file size {size_mb:.2f} Mb"
    )


def dict_to_projection(mapping):
    return ",\n    ".join(f'"{safe}" as "{orig}"' for orig, safe in mapping.items())
