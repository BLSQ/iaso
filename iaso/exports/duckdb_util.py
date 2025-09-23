import os
import time

from logging import getLogger

import duckdb

from django.db import connection
from django.db.models import QuerySet


logger = getLogger(__name__)


def export_django_query_to_parquet_via_duckdb(qs: QuerySet, output_file_path: str):
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
        parquet_export_sql = f"""
            COPY (
                SELECT * FROM postgres_query('pg', $$ {full_sql} $$)
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
