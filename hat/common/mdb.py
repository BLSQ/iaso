from typing import List, Tuple
from io import StringIO
import re
from pandas import read_csv, read_sql_query, DataFrame
from .utils import run_cmd
from .sqlalchemy import engine


'''
Functions to extract info from mdb files via mdb-tools https://github.com/brianb/mdbtools
'''


def get_schema(mdb_file: str, table=None, namespace=None) -> str:
    '''Get the schema of the mdb file as sql'''
    cmd = ['mdb-schema', '--no-indexes', mdb_file, 'postgres']
    if table is not None:
        cmd = cmd + ['-T', table]
    if namespace is not None:
        cmd = cmd + ['-N', namespace]
    return run_cmd(cmd)


def get_tablenames(mdb_file: str) -> List[str]:
    '''Get the names of the tables in the mdb file'''
    return run_cmd(['mdb-tables', mdb_file]).strip().split(' ')


def get_table_csv(mdb_file: str, table: str) -> str:
    '''Get the table contents as csv'''
    return run_cmd(['mdb-export', mdb_file, table])


def convert_intbool_cols(df: DataFrame, sql_schema: str) -> None:
    '''Convert bool columns from 0/1 values to False/True
    MS SQL Server uses 0/1 bit fields for booleans. We have
    to convert those values to True/False for postgres to
    accept them.
    '''
    p = r'^\s+\"([a-z_]+)"\s+BOOL[\s,]'
    cols = re.findall(p, sql_schema, re.I | re.M)
    for col in cols:
        df[col] = df[col].apply(lambda b: b == 1)


def extract_mdbtable(mdb_path: str, table_name: str) -> Tuple[DataFrame, str]:
    schema = get_schema(mdb_path, table=table_name)
    csv = get_table_csv(mdb_path, table_name)
    df = read_csv(StringIO(csv))
    convert_intbool_cols(df, schema)
    return (df, schema)


def extract_mdbtable_via_db(mdb_path: str, mdb_table_name: str) -> DataFrame:
    (df, schema) = extract_mdbtable(mdb_path, mdb_table_name)
    table_name = mdb_table_name.lower()

    # We want to create a temporary table
    schema = re.sub('CREATE TABLE', 'CREATE TEMPORARY TABLE', schema, flags=re.M)

    # lowercase table name
    schema = re.sub('"{}"'.format(mdb_table_name), '"{}"'.format(table_name.lower()), schema)

    # Remove any alter statements which are used to add relationsships.
    # The related table will not exist and the statement would fail.
    schema = re.sub(r'^\s*ALTER\sTABLE.+$', '', schema, flags=re.M)

    # Remove unneeded comments
    schema = re.sub(r'\s*COMMENT\s.+$', '', schema, flags=re.M)

    # We put the data into the table once, and then read it back.
    # That might sound like a noop, but this way pandas will adapt
    # the schema from the table it did not have before and we also
    # check that we could import all the columns.
    with engine.begin() as conn:
        # create the table from the extracted schema
        conn.execute(schema, conn)
        df.to_sql(table_name, conn, if_exists='append', index=False)
        df2 = read_sql_query('SELECT * from "{}";'.format(table_name), conn)
        conn.execute('DROP TABLE IF EXISTS "{}";'.format(table_name))
        return df2
