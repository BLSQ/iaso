from io import StringIO
import re
import pandas
from hat.common.sqlalchemy import engine
from hat.common.mdb import get_schema, get_table_csv


def convert_intbool_cols(df, sql_schema):
    '''Convert bool columns from 0/1 values to False/True
    MS SQL Server uses 0/1 bit fields for booleans. We have
    to convert those values to True/False for postgres to
    accept them.
    '''
    p = r'^\s+\"([a-z_]+)"\s+BOOL[\s,]'
    cols = re.findall(p, sql_schema, re.I | re.M)
    for col in cols:
        df[col] = df[col].apply(lambda b: b == 1)


def extract_mdbtable(mdb_path, table_name):
    schema = get_schema(mdb_path, table=table_name)
    csv = get_table_csv(mdb_path, table_name)
    df = pandas.read_csv(StringIO(csv))
    convert_intbool_cols(df, schema)
    return (df, schema)


def extract_mdbtable_via_db(mdb_path, mdb_table_name):
    (df, schema) = extract_mdbtable(mdb_path, mdb_table_name)
    table_name = mdb_table_name.lower()

    # We want to create a temporary table
    schema = re.sub('CREATE TABLE', 'CREATE TEMPORARY TABLE', schema, flags=re.M)
    # lowercase table name
    schema = re.sub('"{}"'.format(mdb_table_name), '"{}"'.format(table_name.lower()), schema)

    # We put the data into the table once, and then read it back.
    # That might sound like a noop, but this way pandas will adapt
    # the schema from the table it did not have before and we also
    # check that we could import all the columns.
    with engine.begin() as conn:
        # create the table from the extracted schema
        conn.execute(schema, conn)
        df.to_sql(table_name, conn, if_exists='append', index=False)
        df2 = pandas.read_sql_query('SELECT * from "{}";'.format(table_name), conn)
        conn.execute('DROP TABLE IF EXISTS "{}";'.format(table_name))
        return df2
