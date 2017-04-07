'''
Functions to extract info from mdb files via mdb-tools https://github.com/brianb/mdbtools
'''

import re
from typing import List, Dict
from .utils import run_cmd


def get_schema(mdb_file: str, table: str=None, namespace: str=None) -> str:
    # Get the schema of the mdb file as sql
    cmd = ['mdb-schema', '--no-indexes', mdb_file, 'postgres']
    if table is not None:
        cmd = cmd + ['-T', table]
    if namespace is not None:
        cmd = cmd + ['-N', namespace]
    return run_cmd(cmd)


def get_tablenames(mdb_file: str) -> List[str]:
    # Get the names of the tables in the mdb file
    return run_cmd(['mdb-tables', mdb_file]).strip().split(' ')


def get_table_csv(mdb_file: str, table: str) -> str:
    # Get the table contents as csv
    return run_cmd(['mdb-export', '-d', ';', mdb_file, table])


def get_all_tables(mdb_file: str) -> Dict[str, str]:
    # Pattern for error string raised when mdb file does not
    # contain a certain table.
    table_error_re = re.compile('Error:\sTable\s\w+\sdoes\snot\sexist')
    names = get_tablenames(mdb_file)
    tables = {}
    for name in names:
        try:
            tables[name] = get_table_csv(mdb_file, name)
        except Exception as e:
            # Some tables are just in the index, but the actual
            # table is not there. We ignore missing tables.
            is_table_error = table_error_re.search(str(e))
            if not is_table_error:
                raise e

    return tables
