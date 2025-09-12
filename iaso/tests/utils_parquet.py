from io import StringIO
from pathlib import Path

import duckdb
import numpy as np
import pandas as pd

from django.test import TransactionTestCase
from jinja2 import Template
from rest_framework.test import APIClient

from iaso.test import IasoTestCaseMixin


class BaseAPITransactionTestCase(TransactionTestCase, IasoTestCaseMixin):
    client_class = APIClient


def parquet_to_df(path):
    with duckdb.connect() as con:
        return con.execute(f"SELECT * FROM read_parquet('{path}')").fetchdf()


def normalize_df(df, stable_columns=None):
    df = df.fillna(pd.NA).astype(str).replace({None: "", np.nan: ""}).fillna("").reset_index(drop=True)
    if stable_columns:
        return df[stable_columns]
    return df


def render_with_jinja(path: Path, context: dict) -> str:
    text = path.read_text()
    template = Template(text)
    return template.render(**context)


def load_snapshot(snapshot_file: Path, context: dict) -> pd.DataFrame:
    rendered = render_with_jinja(snapshot_file, context)
    print(rendered)
    if snapshot_file.suffix == ".csv":
        return pd.read_csv(StringIO(rendered), dtype=str)
    if snapshot_file.suffix == ".json":
        return pd.read_json(StringIO(rendered), orient="records", lines=True)
    raise ValueError(f"Unsupported snapshot format: {snapshot_file.suffix} from {snapshot_file}")


def compare_or_create_snapshot(parquet_path, snapshot_path, stable_columns=None, context=None):
    context = context or {}
    snapshot_file = Path(snapshot_path)

    df_parquet = parquet_to_df(parquet_path)

    if not snapshot_file.exists():
        if snapshot_file.suffix == ".csv":
            df_parquet.to_csv(snapshot_file, index=False)
        elif snapshot_file.suffix == ".json":
            df_parquet.to_json(snapshot_file, orient="records", lines=True)
        else:
            raise ValueError(f"Unsupported snapshot format: {snapshot_file.suffix} from {snapshot_path}")
        print(f"Snapshot created at {snapshot_file}")
        return

    df_snapshot = load_snapshot(snapshot_file, context)

    pd.testing.assert_frame_equal(
        normalize_df(df_parquet, stable_columns), normalize_df(df_snapshot, stable_columns), check_dtype=False
    )


# used to debug if the test fails
def read_parquet(f):
    with duckdb.connect() as con:
        result = con.execute(f"SELECT * FROM read_parquet('{f.name}')")
        colnames = [d[0] for d in result.description]  # column names
        tuples = result.fetchall()
        rows = [dict(zip(colnames, row)) for row in tuples]

    return rows


def write_response_to_file(response, f):
    for chunk in response.streaming_content:
        f.write(chunk)
    f.flush()
    f.seek(0)
