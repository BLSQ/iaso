import duckdb


def get_columns_from_parquet(tmpfile):
    with duckdb.connect() as con:
        actual_columns = [
            [c[0], c[1]]
            for c in con.execute(
                "DESCRIBE SELECT * FROM read_parquet(?)",
                [tmpfile.name],
            ).fetchall()
        ]

    return actual_columns
