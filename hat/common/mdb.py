from typing import List
from .utils import run_cmd

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
    return run_cmd(['mdb-export', '-d', ';', mdb_file, table])
