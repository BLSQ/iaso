from pathlib import PurePath
from rq.decorators import job
from hat.rq.connection import redis_conn
from .import_historic import import_historic
from .import_backup import import_backup
from .export_csv import export_csv


@job('default', connection=redis_conn)
def import_files(fileinfos):
    stats = []
    for (name, filename) in fileinfos:
        suffix = PurePath(filename).suffix.lower()
        if any(suffix in s for s in ['.mdb', '.accdb']):
            print('IMPORT HISTORIC')
            stats.append(import_historic(name, filename))
        elif suffix in '.enc':
            print('IMPORT BACKUP')
            stats.append(import_backup(name, filename))
        else:
            raise Exception('Cannot import unkown filetype: {}'.format(suffix))
    return stats


# @job('default', connection=redis_conn)
# def reimport():
#     # reimport everything from couch
#     # 1. empty postgres tables
#     # 2. batchwise import documents
#     # 3. everything is new again
#     pass


@job('default', connection=redis_conn)
def export():
    return export_csv()
