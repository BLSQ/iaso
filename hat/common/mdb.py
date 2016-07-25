from subprocess import run, PIPE

'''
Functions to extract info from mdb files via mdb-tools https://github.com/brianb/mdbtools
'''


def run_cmd(cmd):
    r = run(cmd, stdout=PIPE, check=True)
    return r.stdout.decode()


def get_schema(mdb_file, table=None, namespace=None):
    '''Get the schema of the mdb file as sql'''
    cmd = ['mdb-schema', '--no-indexes', mdb_file, 'postgres']
    if table is not None:
        cmd = cmd + ['-T', table]
    if namespace is not None:
        cmd = cmd + ['-N', namespace]
    return run_cmd(cmd)


def get_tablenames(mdb_file):
    '''Get the names of the tables in the mdb file'''
    return run_cmd(['mdb-tables', mdb_file]).strip().split(' ')


def get_table_csv(mdb_file, table):
    '''Get the table contents as csv'''
    return run_cmd(['mdb-export', mdb_file, table])
